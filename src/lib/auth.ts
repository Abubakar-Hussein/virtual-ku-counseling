import { NextAuthOptions } from 'next-auth';
import { cookies } from 'next/headers';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcrypt';
import { connectDB } from './mongodb';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';
import { logAction } from './audit';
import { sendCounselorPendingApprovalEmail } from './email';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        CredentialsProvider({
            name: 'KU Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                expectedRole: { label: 'Expected Role', type: 'text' },
            },
            async authorize(credentials) {
                const start = Date.now();
                console.log('[AUTH] Starting authorization for:', credentials?.email);

                if (!credentials?.email || !credentials?.password) return null;

                const expectedRole = credentials.expectedRole;

                // 1. Hardcoded Admin Bypass
                const adminEmail = process.env.ADMIN_EMAIL || 'admin@ku.ac.ke';
                const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

                if (credentials.email === adminEmail && credentials.password === adminPassword) {
                    if (expectedRole && expectedRole !== 'admin') {
                        console.log(`[AUTH] Admin login rejected: Expected role ${expectedRole} but user is admin`);
                        return null; // Return null intentionally to fail login if portal mismatch
                    }
                    console.log('[AUTH] Admin bypassed DB login');
                    return {
                        id: 'admin-hardcoded-id',
                        name: 'System Administrator',
                        email: adminEmail,
                        role: 'admin',
                        image: null,
                    };
                }

                // 2. Standard Database Login
                const dbStart = Date.now();
                await connectDB();
                console.log(`[AUTH] Database connection took: ${Date.now() - dbStart}ms`);

                const findStart = Date.now();
                const user = await User.findOne({ email: credentials.email });
                console.log(`[AUTH] User findOne took: ${Date.now() - findStart}ms`);

                if (!user) {
                    console.log('[AUTH] User not found');
                    return null;
                }

                // If user signed up with Google, they shouldn't use credentials login
                if (user.authProvider === 'google' && !user.password) {
                    console.log('[AUTH] User signed up with Google — no password set');
                    return null;
                }

                const bcryptStart = Date.now();
                const isValid = await bcrypt.compare(credentials.password, user.password);
                console.log(`[AUTH] Bcrypt compare took: ${Date.now() - bcryptStart}ms`);

                if (!isValid) {
                    console.log('[AUTH] Invalid password');
                    return null;
                }

                // Block counselors who haven't been approved yet
                if (user.role === 'counselor' && user.approvalStatus === 'pending') {
                    console.log('[AUTH] Counselor account pending approval:', user.email);
                    throw new Error('PENDING_APPROVAL');
                }

                console.log(`[AUTH] Total authorization took: ${Date.now() - start}ms`);

                if (expectedRole && user.role !== expectedRole) {
                    console.log(`[AUTH] Login rejected: Expected role ${expectedRole} but user is ${user.role}`);
                    return null;
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Only handle Google sign-ins here
            if (account?.provider !== 'google') return true;

            try {
                await connectDB();
                const email = user.email?.toLowerCase();
                if (!email) return false;

                // Validate email domain
                const isStudentEmail = /^[^\s@]+@students\.ku\.ac\.ke$/.test(email);
                const isStaffEmail = /^[^\s@]+@ku\.ac\.ke$/.test(email);
                const isGmail = /^[^\s@]+@gmail\.com$/.test(email);

                if (!isStudentEmail && !isStaffEmail && !isGmail) {
                    console.log('[AUTH:GOOGLE] Email domain not allowed:', email);
                    return '/login?error=InvalidEmail';
                }

                let existingUser = await User.findOne({ email });

                if (existingUser) {
                    // Update Google ID and image if not set
                    if (!existingUser.googleId && account.providerAccountId) {
                        existingUser.googleId = account.providerAccountId;
                        existingUser.image = user.image || existingUser.image;
                        await existingUser.save();
                    }

                    // Block counselors pending approval — check BEFORE attaching role
                    if (existingUser.role === 'counselor' && existingUser.approvalStatus === 'pending') {
                        console.log('[AUTH:GOOGLE] Counselor pending approval:', email);
                        return '/login?role=counselor&error=PendingApproval';
                    }

                    // Attach role and approval status to user object for JWT callback
                    (user as any).role = existingUser.role;
                    (user as any).id = existingUser._id.toString();
                    (user as any).approvalStatus = existingUser.approvalStatus || 'approved';

                    return true;
                }

                // --- New user: auto-register ---
                // Determine role from the cookie set by the client before OAuth redirect
                let role: 'student' | 'counselor' = 'student';

                try {
                    const cookieStore = await cookies();
                    const roleCookie = cookieStore.get('google_auth_role')?.value;
                    if (roleCookie === 'counselor') {
                        role = 'counselor';
                    } else if (roleCookie === 'student') {
                        role = 'student';
                    } else if (isStudentEmail) {
                        role = 'student';
                    } else if (isStaffEmail) {
                        role = 'counselor';
                    }
                } catch {
                    // Fallback: determine by email domain
                    if (isStudentEmail) {
                        role = 'student';
                    } else if (isStaffEmail) {
                        role = 'counselor';
                    }
                }
                // Gmail users default to student unless cookie explicitly says counselor

                // Validate email matches role
                if (role === 'student' && !isStudentEmail && !isGmail) {
                    return '/login?role=student&error=InvalidEmail';
                }

                const isCounselor = role === 'counselor';
                const approvalStatus = isCounselor ? 'pending' : 'approved';

                const googleName = user.name || profile?.name || 'User';

                // Extract first/last name from Google profile
                const nameParts = googleName.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                const newUser = await User.create({
                    firstName,
                    lastName,
                    name: googleName,
                    email,
                    role,
                    approvalStatus,
                    googleId: account.providerAccountId,
                    authProvider: 'google',
                    image: user.image || undefined,
                });

                // Create CounselorProfile for counselor accounts
                if (isCounselor) {
                    await CounselorProfile.findOneAndUpdate(
                        { userId: newUser._id },
                        { $setOnInsert: { userId: newUser._id, specializations: [], bio: '', availableSlots: [], meetLink: '' } },
                        { upsert: true, new: true }
                    );

                    // Notify admin that a counselor needs approval
                    try {
                        const adminEmail = process.env.ADMIN_EMAIL || 'admin@ku.ac.ke';
                        await sendCounselorPendingApprovalEmail({
                            counselorName: googleName,
                            counselorEmail: email,
                            adminEmail,
                            counselorId: newUser._id.toString(),
                        });
                    } catch (emailErr) {
                        console.error('[AUTH:GOOGLE] Failed to send admin notification:', emailErr);
                    }
                }

                // Audit log
                await logAction({
                    userId: newUser._id.toString(),
                    userName: newUser.name,
                    action: 'REGISTER',
                    resource: 'USER',
                    details: `Google sign-up: role=${role}${isCounselor ? ' (pending approval)' : ''}`,
                }).catch(err => console.error('[AUTH:GOOGLE] Audit error:', err));

                // Block new counselors BEFORE attaching session data
                // Return redirect so no JWT/session is created for pending counselors
                if (isCounselor) {
                    console.log('[AUTH:GOOGLE] New counselor registered, pending approval:', email);
                    return '/login?role=counselor&error=PendingApproval';
                }

                // Attach role and approval status to user object for JWT callback
                (user as any).role = newUser.role;
                (user as any).id = newUser._id.toString();
                (user as any).approvalStatus = newUser.approvalStatus || 'approved';

                return true;
            } catch (err) {
                console.error('[AUTH:GOOGLE] signIn callback error:', err);
                return '/login?error=OAuthError';
            }
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = (user as any).id || user.id;
                token.role = (user as any).role;
                token.approvalStatus = (user as any).approvalStatus;
            }

            // For Google users, if role is missing, fetch from DB
            if (account?.provider === 'google' && !token.role) {
                try {
                    await connectDB();
                    const dbUser = await User.findOne({ email: token.email });
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.role = dbUser.role;
                        token.approvalStatus = dbUser.approvalStatus || 'approved';
                    }
                } catch (err) {
                    console.error('[AUTH:JWT] Error fetching user role:', err);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).approvalStatus = token.approvalStatus;
            }
            return session;
        },
    },
    events: {
        async signIn({ user }) {
            // Fire-and-forget — don't block the login redirect on audit log write
            logAction({
                userId: user.id,
                userName: user.name || 'Unknown',
                action: 'LOGIN',
                resource: 'AUTH',
                details: 'User logged in successfully',
            }).catch((err) => console.error('[AUTH EVENT ERROR]:', err));
        }
    },
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

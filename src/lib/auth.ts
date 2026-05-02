import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { connectDB } from './mongodb';
import User from '@/models/User';
import { logAction } from './audit';

export const authOptions: NextAuthOptions = {
    providers: [
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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    events: {
        async signIn({ user }) {
            try {
                await logAction({
                    userId: user.id,
                    userName: user.name || 'Unknown',
                    action: 'LOGIN',
                    resource: 'AUTH',
                    details: 'User logged in successfully',
                });
            } catch (err) {
                console.error('[AUTH EVENT ERROR]:', err);
            }
        }
    },
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

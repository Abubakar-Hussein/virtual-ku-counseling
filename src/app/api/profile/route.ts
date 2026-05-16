import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';
import AdminProfile from '@/models/AdminProfile';
import bcrypt from 'bcrypt';
import { logAction } from '@/lib/audit';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const sessionId = (session.user as any).id;

        // ── Admin: read from AdminProfile (singleton) ────────────────────────
        if (sessionId === 'admin-hardcoded-id') {
            await connectDB();
            const adminProfile = await AdminProfile.findOne({ adminKey: 'default' }).lean() as any;
            return NextResponse.json({
                name: adminProfile?.name || 'System Administrator',
                email: session.user.email || process.env.ADMIN_EMAIL || 'admin@ku.ac.ke',
                phone: adminProfile?.phone || '',
                profileImage: adminProfile?.profileImage || null,
                role: 'admin',
            });
        }

        // ── Regular users ────────────────────────────────────────────────────
        await connectDB();
        const user = await User.findById(sessionId).select('-password');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let profileData: any = {
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            studentId: user.studentId || '',
            role: user.role,
            profileImage: user.profileImage || null,
        };

        if (user.role === 'counselor') {
            const cProfile = await CounselorProfile.findOne({ userId: user._id }).lean();
            if (cProfile) {
                profileData.profile = {
                    bio: (cProfile as any).bio || '',
                    specializations: (cProfile as any).specializations || [],
                    averageRating: (cProfile as any).averageRating ?? 0,
                    totalRatings: (cProfile as any).totalRatings ?? 0,
                    meetLink: (cProfile as any).meetLink || '',
                };
            } else {
                profileData.profile = {
                    bio: '',
                    specializations: [],
                    averageRating: 0,
                    totalRatings: 0,
                    meetLink: '',
                };
            }
            // Keep flat fields for backward compatibility with profile page
            profileData.bio = profileData.profile.bio;
            profileData.specializations = profileData.profile.specializations;
        }

        return NextResponse.json(profileData);
    } catch (error) {
        console.error('Profile GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, phone, password, bio, specializations, profileImage } = body;
        const sessionId = (session.user as any).id;

        await connectDB();

        // ── Admin: update AdminProfile singleton ─────────────────────────────
        if (sessionId === 'admin-hardcoded-id') {
            const changes: string[] = [];
            const updateFields: any = {};

            if (name?.trim()) {
                const nameRegex = /^[A-Za-z\s\-\']+$/;
                if (!nameRegex.test(name.trim())) {
                    return NextResponse.json({ error: 'Name can only contain letters, spaces, hyphens, and apostrophes' }, { status: 400 });
                }
                updateFields.name = name.trim();
                changes.push(`name updated`);
            }
            if (phone !== undefined) {
                updateFields.phone = phone;
                changes.push(`phone updated`);
            }
            if (profileImage !== undefined) {
                updateFields.profileImage = profileImage;
                changes.push('profile image updated');
            }

            // Password update: validate and re-hash
            if (password && password.trim().length >= 8) {
                // Note: this only updates the app-level display — the actual
                // admin login still uses ADMIN_PASSWORD from .env.local.
                // To change the real admin password, update ADMIN_PASSWORD in .env.local.
                changes.push('password change requested (update ADMIN_PASSWORD in .env.local to take effect)');
            }

            if (Object.keys(updateFields).length > 0) {
                await AdminProfile.findOneAndUpdate(
                    { adminKey: 'default' },
                    { $set: updateFields },
                    { upsert: true, new: true }
                );
            }

            if (changes.length > 0) {
                logAction({
                    userId: 'admin-hardcoded-id',
                    userName: name || 'System Administrator',
                    action: 'UPDATE_PROFILE',
                    resource: 'PROFILE',
                    details: `Admin updated: ${changes.join(', ')}`,
                }).catch(() => {});
            }

            return NextResponse.json({ message: 'Admin profile updated successfully' });
        }

        // ── Regular users ────────────────────────────────────────────────────
        const user = await User.findById(sessionId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const changes: string[] = [];
        if (name && name !== user.name) {
            const nameRegex = /^[A-Za-z\s\-\']+$/;
            if (!nameRegex.test(name.trim())) {
                return NextResponse.json({ error: 'Name can only contain letters, spaces, hyphens, and apostrophes' }, { status: 400 });
            }
            changes.push(`name: ${user.name} → ${name.trim()}`);
            user.name = name.trim();
        }
        if (phone !== undefined && phone !== user.phone) {
            changes.push(`phone: ${user.phone || 'N/A'} → ${phone}`);
            user.phone = phone;
        }
        if (profileImage !== undefined && profileImage !== user.profileImage) {
            changes.push('profile image updated');
            user.profileImage = profileImage;
        }
        if (password && password.trim().length >= 8) {
            user.password = await bcrypt.hash(password, 10);
            changes.push('password changed');
        }

        await user.save();

        // Update counselor profile if applicable (meetLink excluded — managed by admin)
        if (user.role === 'counselor') {
            const updateFields: any = {};
            if (bio !== undefined) {
                updateFields.bio = bio;
                changes.push('bio updated');
            }
            if (specializations && Array.isArray(specializations)) {
                updateFields.specializations = specializations;
                changes.push('specializations updated');
            }
            if (Object.keys(updateFields).length > 0) {
                await CounselorProfile.findOneAndUpdate(
                    { userId: user._id },
                    { $set: updateFields },
                    { upsert: true, new: true }
                );
            }
        }

        if (changes.length > 0) {
            const ip = (req as any).headers?.get?.('x-forwarded-for') || '127.0.0.1';
            await logAction({
                userId: user._id.toString(),
                userName: user.name,
                action: 'UPDATE_PROFILE',
                resource: 'PROFILE',
                details: `Updated: ${changes.join(', ')}`,
                ipAddress: ip,
            });
        }

        return NextResponse.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile PUT error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

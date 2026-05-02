import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';
import bcrypt from 'bcrypt';
import { logAction } from '@/lib/audit';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const sessionId = (session.user as any).id;

        if (sessionId === 'admin-hardcoded-id') {
            return NextResponse.json({
                name: 'System Administrator',
                email: session.user.email || 'admin@ku.ac.ke',
                phone: '',
                studentId: '',
                role: 'admin',
                profileImage: null
            });
        }

        await connectDB();
        const user = await User.findById(sessionId).select('-password');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let profileData: any = {
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            studentId: user.studentId || '',
            role: user.role,
            profileImage: user.profileImage || null
        };

        if (user.role === 'counselor') {
            const cProfile = await CounselorProfile.findOne({ userId: user._id });
            if (cProfile) {
                profileData.bio = cProfile.bio;
                profileData.specializations = cProfile.specializations;
            } else {
                profileData.bio = '';
                profileData.specializations = [];
            }
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

        if (sessionId === 'admin-hardcoded-id') {
            return NextResponse.json({ error: 'Cannot update hardcoded admin profile' }, { status: 403 });
        }

        await connectDB();
        const user = await User.findById(sessionId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Keep track of what changed for audit log
        const changes = [];
        if (name && name !== user.name) {
            changes.push(`name: ${user.name} -> ${name}`);
            user.name = name;
        }
        if (phone !== undefined && phone !== user.phone) {
            changes.push(`phone: ${user.phone || 'N/A'} -> ${phone}`);
            user.phone = phone;
        }
        if (profileImage !== undefined && profileImage !== user.profileImage) {
            changes.push('profile image updated');
            user.profileImage = profileImage;
        }

        // Optionally update password
        if (password && password.trim().length >= 8) {
            user.password = await bcrypt.hash(password, 10);
            changes.push('password changed');
        }

        await user.save();

        // Update counselor profile if applicable (meetLink excluded — managed by admin)
        if (user.role === 'counselor') {
            const updateFields: any = {};
            if (bio !== undefined && bio !== user.bio) {
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

        // Log the action
        if (changes.length > 0) {
            const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
            await logAction({
                userId: user._id.toString(),
                userName: user.name,
                action: 'UPDATE_PROFILE',
                resource: 'PROFILE',
                details: `Updated: ${changes.join(', ')}`,
                ipAddress: ip
            });
        }

        return NextResponse.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile PUT error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

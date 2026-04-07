import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';
import bcrypt from 'bcrypt';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = await User.findById((session.user as any).id).select('-password');
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let profileData: any = {
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            studentId: user.studentId || '',
            role: user.role
        };

        if (user.role === 'counselor') {
            const cProfile = await CounselorProfile.findOne({ userId: user._id });
            if (cProfile) {
                profileData.bio = cProfile.bio;
                profileData.specializations = cProfile.specializations;
                profileData.meetLink = cProfile.meetLink || '';
            } else {
                profileData.bio = '';
                profileData.specializations = [];
                profileData.meetLink = '';
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
        const { name, phone, password, bio, specializations, meetLink } = body;

        await connectDB();
        const user = await User.findById((session.user as any).id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Update basic info
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;

        // Optionally update password
        if (password && password.trim().length >= 8) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        // Update counselor profile if applicable
        if (user.role === 'counselor') {
            const updateFields: any = {};
            if (bio !== undefined) updateFields.bio = bio;
            if (meetLink !== undefined) updateFields.meetLink = meetLink;
            if (specializations && Array.isArray(specializations)) {
                updateFields.specializations = specializations;
            }

            await CounselorProfile.findOneAndUpdate(
                { userId: user._id },
                { $set: updateFields },
                { upsert: true, new: true }
            );
        }

        return NextResponse.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile PUT error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

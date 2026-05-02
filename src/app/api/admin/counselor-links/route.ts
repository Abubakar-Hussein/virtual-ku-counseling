import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';

// GET all counselors and their meeting links
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        // Find all approved counselors (or those created before the approval flow existed)
        const counselors = await User.find({ 
            role: 'counselor', 
            $or: [
                { approvalStatus: 'approved' },
                { approvalStatus: { $exists: false } }
            ]
        })
            .select('name email profileImage')
            .lean();

        const counselorIds = counselors.map(c => c._id);

        // Fetch their profiles to get the meetLink
        const profiles = await CounselorProfile.find({ userId: { $in: counselorIds } })
            .select('userId meetLink')
            .lean();

        const profileMap = profiles.reduce((acc: any, p: any) => {
            acc[p.userId.toString()] = p.meetLink || '';
            return acc;
        }, {});

        const result = counselors.map(c => ({
            _id: c._id.toString(),
            name: c.name,
            email: c.email,
            profileImage: (c as any).profileImage,
            meetLink: profileMap[c._id.toString()] || '',
        }));

        return NextResponse.json(result);
    } catch (err) {
        console.error('[ADMIN COUNSELOR LINKS GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST to update a counselor's meeting link
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { counselorId, meetLink } = await req.json();

        if (!counselorId) {
            return NextResponse.json({ error: 'counselorId is required' }, { status: 400 });
        }

        await connectDB();

        // Ensure profile exists, update or create it
        const profile = await CounselorProfile.findOneAndUpdate(
            { userId: counselorId },
            { $set: { meetLink: meetLink || '' } },
            { new: true, upsert: true }
        );

        return NextResponse.json({ message: 'Meeting link updated successfully', meetLink: profile.meetLink });
    } catch (err) {
        console.error('[ADMIN COUNSELOR LINKS POST]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

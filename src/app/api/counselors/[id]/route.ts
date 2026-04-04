import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        const user = await User.findById(id).select('-password').lean();
        if (!user || user.role !== 'counselor') {
            return NextResponse.json({ error: 'Counselor not found' }, { status: 404 });
        }
        const profile = await CounselorProfile.findOne({ userId: id }).lean();
        return NextResponse.json({ ...user, profile });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

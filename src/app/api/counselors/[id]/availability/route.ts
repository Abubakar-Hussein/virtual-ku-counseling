import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import CounselorProfile from '@/models/CounselorProfile';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        const profile = await CounselorProfile.findOne({ userId: id }).lean();
        return NextResponse.json(profile?.availableSlots ?? []);
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).id !== id && (session.user as any).role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slots, bio, specializations, maxDailyBookings } = await req.json();
        await connectDB();

        const updated = await CounselorProfile.findOneAndUpdate(
            { userId: id },
            { availableSlots: slots, bio, specializations, maxDailyBookings },
            { upsert: true, new: true }
        );

        return NextResponse.json(updated);
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

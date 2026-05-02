import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import SessionNote from '@/models/SessionNote';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'counselor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const counselorId = (session.user as any).id;

        await connectDB();

        // Fetch all session notes for this counselor
        const records = await SessionNote.find({ counselorId })
            .populate({ path: 'studentId', select: 'name email', model: User })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(records);
    } catch (error) {
        console.error('[COUNSELOR_RECORDS_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

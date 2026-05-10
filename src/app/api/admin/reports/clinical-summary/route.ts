import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import SessionNote from '@/models/SessionNote';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate   = searchParams.get('endDate');
        const progress  = searchParams.get('progress'); // Improved | Stable | Declined | Not Evaluated

        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        const filter: any = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }
        if (progress && progress !== 'all') filter.progressIndicator = progress;

        const notes = await SessionNote.find(filter)
            .populate({ path: 'studentId', select: 'name email studentId', model: User })
            .populate({ path: 'counselorId', select: 'name', model: User })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(notes);
    } catch (error) {
        console.error('[CLINICAL_SUMMARY_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

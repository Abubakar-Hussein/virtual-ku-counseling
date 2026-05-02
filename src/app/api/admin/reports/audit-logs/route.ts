import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate   = searchParams.get('endDate');
        const action    = searchParams.get('action');   // e.g. LOGIN, BOOK_APPOINTMENT, etc. | 'all'
        const resource  = searchParams.get('resource'); // USER | APPOINTMENT | PROFILE | 'all'

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

        if (action && action !== 'all')   filter.action   = action;
        if (resource && resource !== 'all') filter.resource = resource;

        const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(1000).lean();
        return NextResponse.json(logs);
    } catch (error) {
        console.error('[AUDIT_LOGS_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

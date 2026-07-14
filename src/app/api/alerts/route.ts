import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import CaseloadAlert from '@/models/CaseloadAlert';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'counselor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const counselorId = (session.user as any).id;

    try {
        await connectDB();
        const alerts = await CaseloadAlert.find({ counselorId, acknowledged: false })
            .populate('studentId', 'name email')
            .sort({ severity: -1, createdAt: -1 })
            .limit(20).lean();
        return NextResponse.json(alerts);
    } catch (err) {
        console.error('[ALERTS GET]', err);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'counselor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        await connectDB();
        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids)) return NextResponse.json({ error: 'ids array required' }, { status: 400 });
        await CaseloadAlert.updateMany({ _id: { $in: ids } }, { acknowledged: true });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[ALERTS PATCH]', err);
        return NextResponse.json({ error: 'Failed to acknowledge' }, { status: 500 });
    }
}

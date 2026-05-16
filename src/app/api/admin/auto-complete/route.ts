import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { autoCompletePastAppointments } from '@/lib/autoComplete';

/**
 * POST /api/admin/auto-complete
 * Admin-only: manually trigger auto-completion of stale appointments.
 * Normally runs automatically on every dashboard load, but this endpoint
 * lets an admin force an immediate pass if needed.
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { completed, cancelled } = await autoCompletePastAppointments();

        return NextResponse.json({
            message: completed + cancelled === 0
                ? 'No stale appointments found. Everything is up to date.'
                : `Auto-complete finished.`,
            completed,
            cancelled,
            total: completed + cancelled,
        });
    } catch (error) {
        console.error('[AUTO-COMPLETE ENDPOINT]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

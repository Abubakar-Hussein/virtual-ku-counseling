import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { autoCompletePastAppointments } from '@/lib/autoComplete';

/**
 * GET /api/appointments/stats
 * Returns lightweight counts only — no joins, no aggregation pipeline.
 * Used by the dashboard to render stat cards instantly.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // Fire-and-forget: auto-complete any confirmed appointments whose date has passed.
        // Runs before counting so stats always reflect reality.
        autoCompletePastAppointments();

        const user = session.user as any;

        const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

        // Build the base filter for this user role
        const baseFilter: any = {};
        if (user.role === 'student' && isValidId(user.id)) {
            baseFilter.studentId = new mongoose.Types.ObjectId(user.id);
        } else if (user.role === 'counselor' && isValidId(user.id)) {
            baseFilter.counselorId = new mongoose.Types.ObjectId(user.id);
        } else if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        // Run all 3 counts in parallel — hits index directly, no joins
        const [upcoming, pending, past] = await Promise.all([
            Appointment.countDocuments({ ...baseFilter, status: 'confirmed' }),
            Appointment.countDocuments({ ...baseFilter, status: 'pending' }),
            Appointment.countDocuments({ ...baseFilter, status: 'completed' }),
        ]);

        return NextResponse.json({ upcoming, pending, past });
    } catch (err) {
        console.error('[STATS GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

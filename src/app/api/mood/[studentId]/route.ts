import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import MoodEntry from '@/models/MoodEntry';
import Appointment from '@/models/Appointment';

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'counselor' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { studentId } = await params;
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');

    try {
        await connectDB();

        // Verify counselor has an appointment relationship with this student
        if (role === 'counselor') {
            const counselorId = (session.user as any).id;
            const hasRelationship = await Appointment.findOne({
                counselorId, studentId, status: { $in: ['confirmed', 'completed'] }
            });
            if (!hasRelationship) return NextResponse.json({ error: 'No relationship with student' }, { status: 403 });
        }

        const since = new Date();
        since.setDate(since.getDate() - days);
        const entries = await MoodEntry.find({ studentId, date: { $gte: since } })
            .sort({ date: -1 }).lean();
        return NextResponse.json(entries);
    } catch (err) {
        console.error('[MOOD STUDENT]', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

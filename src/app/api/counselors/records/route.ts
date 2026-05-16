import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import SessionNote from '@/models/SessionNote';
import Appointment from '@/models/Appointment';
import Intake from '@/models/Intake';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'counselor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const counselorId = (session.user as any).id;
        const { searchParams } = new URL(req.url);
        const search      = searchParams.get('search') || '';
        const progress    = searchParams.get('progress') || 'all';
        const startDate   = searchParams.get('startDate');
        const endDate     = searchParams.get('endDate');

        await connectDB();

        // Build the base note filter
        const noteFilter: any = { counselorId: new mongoose.Types.ObjectId(counselorId) };
        if (progress !== 'all') noteFilter.progressIndicator = progress;

        // Fetch all matching session notes for this counselor
        const notes = await SessionNote.find(noteFilter)
            .populate({ path: 'studentId', select: 'name email', model: User })
            .sort({ createdAt: -1 })
            .lean();

        // Enrich each note with its linked appointment + intake data
        const enriched = await Promise.all(
            notes.map(async (note: any) => {
                const [appointment, intake] = await Promise.all([
                    Appointment.findById(note.appointmentId)
                        .select('date timeSlot specialization reason rating feedback status')
                        .lean(),
                    Intake.findOne({ appointmentId: note.appointmentId })
                        .select('mood concerns isUrgent previousTherapy description')
                        .lean(),
                ]);
                return { ...note, appointment, intake };
            })
        );

        // Sort by appointment date descending (most recent session first)
        enriched.sort((a: any, b: any) => {
            const dateA = a.appointment?.date ? new Date(a.appointment.date).getTime() : 0;
            const dateB = b.appointment?.date ? new Date(b.appointment.date).getTime() : 0;
            return dateB - dateA;
        });

        // Apply date range filter (on appointment date)
        let filtered = enriched.filter((r: any) => {
            if (!r.appointment?.date) return true;
            const apptDate = new Date(r.appointment.date);
            if (startDate && apptDate < new Date(startDate)) return false;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (apptDate > end) return false;
            }
            return true;
        });

        // Apply text search (student name, notes, specialization)
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter((r: any) =>
                (r.studentId?.name || '').toLowerCase().includes(q) ||
                (r.notes || '').toLowerCase().includes(q) ||
                (r.appointment?.specialization || '').toLowerCase().includes(q) ||
                (r.appointment?.reason || '').toLowerCase().includes(q)
            );
        }

        // Calculate session number per student (chronological order per student)
        // Build a map: studentId -> sorted appointment dates
        const studentSessionMap: Record<string, string[]> = {};
        for (const r of filtered) {
            const sid = r.studentId?._id?.toString();
            if (!sid) continue;
            if (!studentSessionMap[sid]) studentSessionMap[sid] = [];
            if (r.appointment?.date) studentSessionMap[sid].push(r.appointment.date);
        }
        // Sort each student's sessions ascending (earliest = session 1)
        for (const sid in studentSessionMap) {
            studentSessionMap[sid].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        }

        const result = filtered.map((r: any) => {
            const sid = r.studentId?._id?.toString();
            const apptDate = r.appointment?.date;
            let sessionNumber = null;
            if (sid && apptDate && studentSessionMap[sid]) {
                sessionNumber = studentSessionMap[sid].indexOf(apptDate) + 1;
            }
            return { ...r, sessionNumber };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[COUNSELOR_RECORDS_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import SessionNote from '@/models/SessionNote';
import Intake from '@/models/Intake';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'counselor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id: studentId } = await params;
        const counselorId = (session.user as any).id;

        await connectDB();

        // Verify the counselor has had at least one session with this student
        const hasAccess = await Appointment.exists({ studentId, counselorId });
        if (!hasAccess) {
            return NextResponse.json({ error: 'No clinical relationship established with this student' }, { status: 403 });
        }

        // Fetch all past appointments, intakes, and notes for this student
        const history = await Appointment.aggregate([
            { $match: { studentId: new (require('mongoose').Types.ObjectId)(studentId), status: 'completed' } },
            { $sort: { date: -1 } },
            { $lookup: { from: 'intakes', localField: '_id', foreignField: 'appointmentId', as: 'intake' } },
            { $unwind: { path: '$intake', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'sessionnotes', localField: '_id', foreignField: 'appointmentId', as: 'note' } },
            { $unwind: { path: '$note', preserveNullAndEmptyArrays: true } },
            { $project: {
                _id: 1, date: 1, timeSlot: 1, specialization: 1, reason: 1,
                'intake.mood': 1, 'intake.concerns': 1,
                'note.notes': 1, 'note.actionItems': 1, 'note.progressIndicator': 1, 'note.updatedAt': 1
            }}
        ]);

        return NextResponse.json(history);
    } catch (error) {
        console.error('[STUDENT_HISTORY_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

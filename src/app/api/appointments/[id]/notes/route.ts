import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import SessionNote from '@/models/SessionNote';
import { logAction } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'counselor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        await connectDB();

        const note = await SessionNote.findOne({ appointmentId: id });
        return NextResponse.json(note || { _id: null, notes: '', actionItems: '', progressIndicator: 'Not Evaluated' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'counselor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const user = session.user as any;
        const { notes, actionItems, progressIndicator } = await req.json();

        await connectDB();

        // Verify the counselor owns this appointment
        const appointment = await Appointment.findById(id);
        if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        
        if (appointment.counselorId.toString() !== user.id) {
            return NextResponse.json({ error: 'Unauthorized to add notes to this session' }, { status: 403 });
        }

        // Update or Create
        const note = await SessionNote.findOneAndUpdate(
            { appointmentId: id },
            { 
                appointmentId: id,
                studentId: appointment.studentId,
                counselorId: user.id,
                notes,
                actionItems,
                progressIndicator
            },
            { new: true, upsert: true }
        );

        // Update appointment status to completed if they are writing notes
        if (appointment.status !== 'completed') {
            appointment.status = 'completed';
            await appointment.save();
        }

        await logAction({
            userId: user.id,
            userName: user.name,
            action: 'UPDATE_CLINICAL_NOTE',
            resource: 'SESSION_NOTE',
            details: `Updated session notes for appointment ${id}`,
            ipAddress: req.headers.get('x-forwarded-for') || undefined
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error('[NOTES_POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = session.user as any;
        const body = await req.json();
        const appt = await Appointment.findById(id);
        if (!appt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Permission check
        const isCounselor = user.role === 'counselor' && appt.counselorId.toString() === user.id;
        const isAdmin = user.role === 'admin';

        if (!isCounselor && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (body.status) appt.status = body.status;
        if (body.notes !== undefined && isCounselor) appt.notes = body.notes;
        await appt.save();

        // Notify student of status change
        if (body.status) {
            await Notification.create({
                userId: appt.studentId,
                message: `Your appointment on ${appt.date.toDateString()} at ${appt.timeSlot} has been ${body.status}`,
                type: body.status === 'confirmed' ? 'confirmation' : 'cancellation',
            });
        }

        return NextResponse.json(appt);
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = session.user as any;
        const appt = await Appointment.findById(id);
        if (!appt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const isStudent = user.role === 'student' && appt.studentId.toString() === user.id;
        const isAdmin = user.role === 'admin';

        if (!isStudent && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        appt.status = 'cancelled';
        await appt.save();

        await Notification.create({
            userId: appt.counselorId,
            message: `Appointment on ${appt.date.toDateString()} at ${appt.timeSlot} was cancelled by the student`,
            type: 'cancellation',
        });

        return NextResponse.json({ message: 'Appointment cancelled' });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

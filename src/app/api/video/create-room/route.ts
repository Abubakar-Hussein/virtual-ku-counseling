import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { createDailyRoom, createMeetingToken } from '@/lib/daily';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();
        const { appointmentId } = await req.json();
        if (!appointmentId) return NextResponse.json({ error: 'appointmentId required' }, { status: 400 });

        const appt = await Appointment.findById(appointmentId).lean() as any;
        if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

        const userId = (session.user as any).id;
        const isParticipant = [appt.studentId?.toString(), appt.counselorId?.toString()].includes(userId);
        if (!isParticipant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

        const roomName = `session-${appointmentId}`;
        const room = await createDailyRoom(roomName);

        const user = await User.findById(userId).select('name role').lean() as any;
        const isOwner = user?.role === 'counselor';
        const tokenData = await createMeetingToken(room.name || roomName, user?.name || 'User', isOwner);

        // Save room URL to appointment
        await Appointment.findByIdAndUpdate(appointmentId, { meetLink: room.url });

        return NextResponse.json({
            roomUrl: room.url,
            roomName: room.name || roomName,
            token: tokenData.token || '',
        });
    } catch (err) {
        console.error('[VIDEO CREATE]', err);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
}

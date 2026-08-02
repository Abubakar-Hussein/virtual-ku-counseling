import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import { buildCalendarEvent, generateGoogleCalendarUrl, generateOutlookCalendarUrl, generateICSString } from '@/lib/calendarLinks';

const VALID_PROVIDERS = ['google', 'outlook', 'apple'];

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = await User.findOne({ email: session.user.email }).select('calendarProvider role _id').lean() as any;

        const { searchParams } = new URL(req.url);
        const includeAppointments = searchParams.get('appointments') === 'true';

        const result: any = { provider: user?.calendarProvider || null };

        // Optionally enrich with upcoming appointments and their calendar URLs
        if (includeAppointments && user) {
            const isCouns = user.role === 'counselor';
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const query = isCouns
                ? { counselorId: user._id, status: { $in: ['confirmed', 'pending'] }, date: { $gte: now } }
                : { studentId: user._id, status: { $in: ['confirmed', 'pending'] }, date: { $gte: now } };

            const appointments = await Appointment.find(query)
                .populate(isCouns ? 'studentId' : 'counselorId', 'name email')
                .sort({ date: 1 })
                .limit(20)
                .lean() as any[];

            result.appointments = appointments.map((appt: any) => {
                const otherParty = isCouns ? appt.studentId : appt.counselorId;
                const event = buildCalendarEvent({
                    date: appt.date,
                    timeSlot: appt.timeSlot,
                    specialization: appt.specialization,
                    otherPartyName: otherParty?.name || 'Participant',
                    reason: appt.reason,
                });

                return {
                    _id: appt._id,
                    date: appt.date,
                    timeSlot: appt.timeSlot,
                    specialization: appt.specialization,
                    status: appt.status,
                    otherPartyName: otherParty?.name || 'Participant',
                    calendarLinks: {
                        google: generateGoogleCalendarUrl(event),
                        outlook: generateOutlookCalendarUrl(event),
                        icsData: generateICSString(event),
                    },
                };
            });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error('[CALENDAR SYNC GET]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { provider, action } = body;

        await connectDB();

        if (action === 'disconnect') {
            await User.updateOne({ email: session.user.email }, { $set: { calendarProvider: null } });
            return NextResponse.json({ success: true, provider: null });
        }

        if (!provider || !VALID_PROVIDERS.includes(provider)) {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        await User.updateOne({ email: session.user.email }, { $set: { calendarProvider: provider } });
        return NextResponse.json({ success: true, provider });
    } catch (err) {
        console.error('[CALENDAR SYNC POST]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

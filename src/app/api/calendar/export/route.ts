import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Appointment from '@/models/Appointment';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

        await connectDB();
        const user = await User.findOne({ email: session.user.email }).lean() as any;
        if (!user) return new NextResponse('User not found', { status: 404 });

        const isCouns = user.role === 'counselor';
        const query = isCouns
            ? { counselorId: user._id, status: { $in: ['confirmed', 'pending'] } }
            : { studentId: user._id, status: { $in: ['confirmed', 'pending'] } };

        const appointments = await Appointment.find(query)
            .populate(isCouns ? 'studentId' : 'counselorId', 'name')
            .lean() as any[];

        // VTIMEZONE for Africa/Nairobi (EAT, UTC+3 — no DST transitions)
        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//KU Wellness//Calendar Sync//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:KU Wellness Schedule',
            'X-WR-TIMEZONE:Africa/Nairobi',
            'BEGIN:VTIMEZONE',
            'TZID:Africa/Nairobi',
            'BEGIN:STANDARD',
            'DTSTART:19700101T000000',
            'TZOFFSETFROM:+0300',
            'TZOFFSETTO:+0300',
            'TZNAME:EAT',
            'END:STANDARD',
            'END:VTIMEZONE',
        ];

        /**
         * Format a date + time components into ICS local-time format
         * using the Africa/Nairobi TZID (declared above).
         * The appointment.date is stored as a UTC midnight date,
         * and timeSlot contains the local EAT hours — so we write
         * those hours directly as local DTSTART/DTEND values.
         */
        const fmtLocal = (d: Date, hour: number, minute: number): string => {
            const y = d.getUTCFullYear();
            const m = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            const h = String(hour).padStart(2, '0');
            const mi = String(minute).padStart(2, '0');
            return `${y}${m}${day}T${h}${mi}00`;
        };

        const now = new Date();
        const dtstamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

        for (const appt of appointments) {
            const date = new Date(appt.date);
            let startH = 9, startM = 0, endH = 10, endM = 0;

            if (appt.timeSlot) {
                const parts = appt.timeSlot.split('-');
                if (parts.length === 2) {
                    const [sh, sm] = parts[0].trim().split(':').map(Number);
                    const [eh, em] = parts[1].trim().split(':').map(Number);
                    if (!isNaN(sh)) startH = sh;
                    if (!isNaN(sm)) startM = sm;
                    if (!isNaN(eh)) endH = eh;
                    if (!isNaN(em)) endM = em;
                }
            }

            const otherName = isCouns
                ? (appt.studentId?.name || 'Student')
                : (appt.counselorId?.name || 'Counselor');

            const summary = `KU Wellness: ${appt.specialization || 'General'} Session with ${otherName}`;
            const description = `${appt.specialization || 'General'} counseling session with ${otherName}.\\nStatus: ${appt.status}`;

            ics.push(
                'BEGIN:VEVENT',
                `UID:${appt._id}@ku-wellness`,
                `DTSTAMP:${dtstamp}`,
                `DTSTART;TZID=Africa/Nairobi:${fmtLocal(date, startH, startM)}`,
                `DTEND;TZID=Africa/Nairobi:${fmtLocal(date, endH, endM)}`,
                `SUMMARY:${summary}`,
                `DESCRIPTION:${description}`,
                `STATUS:${appt.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
                // 15-minute reminder
                'BEGIN:VALARM',
                'TRIGGER:-PT15M',
                'ACTION:DISPLAY',
                'DESCRIPTION:Your counseling session starts in 15 minutes',
                'END:VALARM',
                'END:VEVENT'
            );
        }

        ics.push('END:VCALENDAR');

        return new NextResponse(ics.join('\r\n'), {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': 'attachment; filename="ku_wellness_schedule.ics"'
            }
        });
    } catch (err) {
        console.error('ICS Export Error:', err);
        return new NextResponse('Server Error', { status: 500 });
    }
}

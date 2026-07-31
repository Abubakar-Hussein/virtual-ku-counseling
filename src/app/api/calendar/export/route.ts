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
            ? { counselorId: user._id, status: 'confirmed' }
            : { studentId: user._id, status: 'confirmed' };

        const appointments = await Appointment.find(query)
            .populate(isCouns ? 'studentId' : 'counselorId', 'name')
            .lean() as any[];

        let ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//KU Wellness//Calendar Sync//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        const fmtDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

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

            const startDate = new Date(date);
            startDate.setHours(startH, startM, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(endH, endM, 0, 0);

            const otherName = isCouns
                ? (appt.studentId?.name || 'Student')
                : (appt.counselorId?.name || 'Counselor');

            ics.push(
                'BEGIN:VEVENT',
                `UID:${appt._id}@ku-wellness`,
                `DTSTAMP:${fmtDate(new Date())}`,
                `DTSTART:${fmtDate(startDate)}`,
                `DTEND:${fmtDate(endDate)}`,
                `SUMMARY:Session with ${otherName}`,
                `DESCRIPTION:${appt.specialization || 'General'} counseling session`,
                'STATUS:CONFIRMED',
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

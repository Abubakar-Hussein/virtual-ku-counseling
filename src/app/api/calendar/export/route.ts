import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Appointment from '@/models/Appointment';

// GET: Export calendar as .ics
export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

        await connectDB();
        const user = await User.findOne({ email: session.user.email }).lean() as any;
        if (!user) return new NextResponse('User not found', { status: 404 });

        // Get confirmed appointments for this user (either counselor or student)
        const query = user.role === 'counselor' ? { counselorId: user._id, status: 'confirmed' } : { studentId: user._id, status: 'confirmed' };
        
        const appointments = await Appointment.find(query).lean() as any[];

        // Generate ICS format
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//KU Wellness//Calendar Sync//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        for (const appt of appointments) {
            const date = new Date(appt.date);
            // Default 1 hour duration if timeSlot is missing
            const endDate = new Date(date.getTime() + 60 * 60 * 1000);

            const formatICSDate = (d: Date) => {
                return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };

            const dtstart = formatICSDate(date);
            const dtend = formatICSDate(endDate);
            const now = formatICSDate(new Date());

            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${appt._id}@ku-wellness`,
                `DTSTAMP:${now}`,
                `DTSTART:${dtstart}`,
                `DTEND:${dtend}`,
                `SUMMARY:Counseling Session`,
                `DESCRIPTION:Session type: ${appt.type || 'General'}`,
                'STATUS:CONFIRMED',
                'END:VEVENT'
            );
        }

        icsContent.push('END:VCALENDAR');
        const icsString = icsContent.join('\r\n');

        const headers = new Headers();
        headers.set('Content-Type', 'text/calendar; charset=utf-8');
        headers.set('Content-Disposition', `attachment; filename="ku_wellness_schedule.ics"`);

        return new NextResponse(icsString, { headers });
    } catch (err) {
        console.error('ICS Export Error:', err);
        return new NextResponse('Server Error', { status: 500 });
    }
}

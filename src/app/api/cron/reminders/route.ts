import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import GroupSession from '@/models/GroupSession';
import { sendAppointmentReminder, sendGroupSessionReminder } from '@/lib/twilio';

// POST: Trigger reminder scan — call via cron or manually
export async function POST() {
    try {
        await connectDB();
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in1h = new Date(now.getTime() + 60 * 60 * 1000);
        let sent = 0;

        // 1. Appointment reminders (24h and 1h before)
        const upcomingAppts = await Appointment.find({
            status: 'confirmed',
            date: { $gte: now, $lte: in24h },
        }).lean() as any[];

        for (const appt of upcomingAppts) {
            const student = await User.findById(appt.studentId).select('name phone smsConsent').lean() as any;
            const counselor = await User.findById(appt.counselorId).select('name').lean() as any;

            if (student?.phone && student?.smsConsent !== false) {
                const apptDate = new Date(appt.date);
                const dateStr = apptDate.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
                const timeStr = appt.time || apptDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
                await sendAppointmentReminder(student.phone, student.name, counselor?.name || 'your counselor', dateStr, timeStr);
                sent++;
            }
        }

        // 2. Group session reminders (24h before)
        const upcomingGroups = await GroupSession.find({
            status: 'upcoming',
            scheduledAt: { $gte: now, $lte: in24h },
        }).lean() as any[];

        for (const gs of upcomingGroups) {
            for (const studentId of gs.enrolledStudents) {
                const student = await User.findById(studentId).select('name phone smsConsent').lean() as any;
                if (student?.phone && student?.smsConsent !== false) {
                    const dateStr = new Date(gs.scheduledAt).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    await sendGroupSessionReminder(student.phone, student.name, gs.title, dateStr);
                    sent++;
                }
            }
        }

        return NextResponse.json({ success: true, remindersSent: sent });
    } catch (err) {
        console.error('[CRON REMINDERS]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';
import { sendBookingConfirmationEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = session.user as any;
        let query: any = {};

        if (user.role === 'student') query.studentId = user.id;
        else if (user.role === 'counselor') query.counselorId = user.id;
        // admin sees all

        const appointments = await Appointment.find(query)
            .populate('studentId', 'name email studentId')
            .populate('counselorId', 'name email')
            .sort({ date: -1 })
            .lean();

        return NextResponse.json(appointments);
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = session.user as any;
        if (user.role !== 'student') {
            return NextResponse.json({ error: 'Only students can book appointments' }, { status: 403 });
        }

        const body = await req.json();
        const { counselorId, date, timeSlot, specialization, reason } = body;

        if (!counselorId || !date || !timeSlot || !specialization || !reason) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        await connectDB();

        // Check for duplicate slot
        const conflict = await Appointment.findOne({
            counselorId,
            date: new Date(date),
            timeSlot,
            status: { $in: ['pending', 'confirmed'] },
        });
        if (conflict) {
            return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 });
        }

        const appointment = await Appointment.create({
            studentId: user.id,
            counselorId,
            date: new Date(date),
            timeSlot,
            specialization,
            reason,
            status: 'pending',
        });

        // Create notification for counselor
        await Notification.create({
            userId: counselorId,
            message: `New booking request from ${user.name} on ${new Date(date).toDateString()} at ${timeSlot}`,
            type: 'confirmation',
        });

        // Create confirmation for student
        await Notification.create({
            userId: user.id,
            message: `Your appointment request for ${new Date(date).toDateString()} at ${timeSlot} has been submitted`,
            type: 'confirmation',
        });

        // Send booking confirmation email to student (fire-and-forget; never blocks booking)
        try {
            console.log(`[EMAIL SEND] Preparing to send email for appointment ${appointment._id}`);
            const [studentUser, counselorUser, cProfile] = await Promise.all([
                User.findById(user.id).select('email name').lean(),
                User.findById(counselorId).select('name').lean(),
                CounselorProfile.findOne({ userId: counselorId }).select('meetLink').lean()
            ]);
            console.log(`[EMAIL SEND] Found Student:`, !!studentUser, `, Counselor:`, !!counselorUser);

            if (studentUser) {
                console.log(`[EMAIL SEND] Calling sendBookingConfirmationEmail for ${(studentUser as any).email}...`);
                await sendBookingConfirmationEmail({
                    studentName: (studentUser as any).name ?? user.name,
                    studentEmail: (studentUser as any).email,
                    counselorName: (counselorUser as any)?.name ?? 'Your Counselor',
                    date: new Date(date),
                    timeSlot,
                    specialization,
                    meetLink: (cProfile as any)?.meetLink || null,
                });
                console.log(`[EMAIL SEND] Call to sendBookingConfirmationEmail completed successfully.`);
            } else {
                console.warn(`[EMAIL SEND] Skipping email because student user was not found.`);
            }
        } catch (emailErr) {
            console.error('[APPOINTMENTS] Email send failed (non-fatal error):', emailErr);
        }

        return NextResponse.json(appointment, { status: 201 });
    } catch (err) {
        console.error('[APPOINTMENTS POST]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

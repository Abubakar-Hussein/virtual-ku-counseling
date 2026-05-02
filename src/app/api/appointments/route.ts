import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';
import Intake from '@/models/Intake';
import { sendBookingConfirmationEmail, sendBookingRequestEmails } from '@/lib/email';
import { logAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = session.user as any;
        
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate   = searchParams.get('endDate');
        const status    = searchParams.get('status'); // pending | confirmed | completed | cancelled | all

        // Safety check for valid ObjectId to prevent crash
        const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

        // Use Aggregation for a professional 'Real World' join with Intake
        const matchStage: any = {};

        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchStage.date.$lte = end;
            }
        }

        if (status && status !== 'all') {
            matchStage.status = status;
        }

        if (user.role === 'student' && isValidId(user.id)) {
            matchStage.studentId = new mongoose.Types.ObjectId(user.id);
        } else if (user.role === 'counselor' && isValidId(user.id)) {
            matchStage.counselorId = new mongoose.Types.ObjectId(user.id);
        } else if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized role mapping' }, { status: 403 });
        }

        const appointments = await Appointment.aggregate([
            { $match: matchStage },
            { $lookup: { from: 'users', localField: 'studentId', foreignField: '_id', as: 'student' } },
            { $unwind: '$student' },
            { $lookup: { from: 'users', localField: 'counselorId', foreignField: '_id', as: 'counselor' } },
            { $unwind: '$counselor' },
            { $lookup: { from: 'intakes', localField: '_id', foreignField: 'appointmentId', as: 'intake' } },
            { $unwind: { path: '$intake', preserveNullAndEmptyArrays: true } },
            { $project: {
                _id: 1, date: 1, timeSlot: 1, status: 1, specialization: 1, reason: 1, createdAt: 1,
                studentId: { _id: '$student._id', name: '$student.name', email: '$student.email', profileImage: '$student.profileImage' },
                counselorId: { _id: '$counselor._id', name: '$counselor.name', email: '$counselor.email', profileImage: '$counselor.profileImage' },
                intake: 1
            }},
            { $sort: { date: -1 } }
        ]);

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
        const { counselorId, date, timeSlot, specialization, reason, mood, concerns, isUrgent, previousTherapy } = body;

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

        // Create Clinical Intake
        await Intake.create({
            studentId: user.id,
            appointmentId: appointment._id,
            mood: mood || 5,
            concerns: concerns || [],
            description: reason,
            isUrgent: isUrgent || false,
            previousTherapy: previousTherapy || false,
        });

        // Audit Log
        await logAction({
            userId: user.id,
            userName: user.name,
            action: 'BOOK_APPOINTMENT',
            resource: 'APPOINTMENT',
            details: `Appointment booked with counselor ${counselorId}. Urgent: ${isUrgent || false}`,
            ipAddress: req.headers.get('x-forwarded-for') || undefined
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

        // Send booking request emails to both parties
        try {
            const [studentUser, counselorUser] = await Promise.all([
                User.findById(user.id).select('email name').lean(),
                User.findById(counselorId).select('name email').lean(),
            ]);

            if (studentUser && counselorUser) {
                await sendBookingRequestEmails({
                    studentName: (studentUser as any).name,
                    studentEmail: (studentUser as any).email,
                    counselorName: (counselorUser as any).name,
                    counselorEmail: (counselorUser as any).email,
                    date: new Date(date),
                    timeSlot,
                    specialization,
                    reason,
                });
            }
        } catch (emailErr) {
            console.error('[APPOINTMENT POST] Email send failed:', emailErr);
        }

        return NextResponse.json(appointment, { status: 201 });
    } catch (err) {
        console.error('[APPOINTMENTS POST]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

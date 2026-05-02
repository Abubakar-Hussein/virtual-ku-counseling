import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';
import { sendBookingConfirmationEmail, sendCounselorConfirmationEmail } from '@/lib/email';

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

        const isCounselor = user.role === 'counselor' && appt.counselorId.toString() === user.id;
        const isAdmin     = user.role === 'admin';

        if (!isCounselor && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (body.status) appt.status = body.status;
        if (body.notes !== undefined && isCounselor) appt.notes = body.notes;
        await appt.save();

        if (body.status) {
            // ── When counselor confirms: use counselor's dedicated meeting link ──
            if (body.status === 'confirmed') {
                const profile = await CounselorProfile.findOne({ userId: appt.counselorId }).lean();
                const meetLink = (profile as any)?.meetLink || null;

                const linkLine = meetLink
                    ? `\n🔗 Virtual Meeting Link: ${meetLink}`
                    : '\n⚠️ The admin has not assigned a meeting link for this counselor yet. It will be provided later.';

                // Notify student
                await Notification.create({
                    userId:  appt.studentId,
                    message: `✅ Your appointment on ${appt.date.toDateString()} at ${appt.timeSlot} has been confirmed.${linkLine}`,
                    type:    'confirmation',
                });

                // Notify counselor with same link
                await Notification.create({
                    userId:  appt.counselorId,
                    message: `📅 Appointment with student confirmed for ${appt.date.toDateString()} at ${appt.timeSlot}.${linkLine}`,
                    type:    'confirmation',
                });

                // Send confirmation email to student and counselor
                try {
                    const [studentUser, counselorUser] = await Promise.all([
                        User.findById(appt.studentId).select('email name').lean(),
                        User.findById(appt.counselorId).select('email name').lean(),
                    ]);

                    if (studentUser && counselorUser) {
                        await Promise.allSettled([
                            sendBookingConfirmationEmail({
                                studentName:    (studentUser as any).name,
                                studentEmail:   (studentUser as any).email,
                                counselorName:  (counselorUser as any).name,
                                date:           appt.date,
                                timeSlot:       appt.timeSlot,
                                specialization: appt.specialization,
                                meetLink,
                            }),
                            sendCounselorConfirmationEmail({
                                counselorName:  (counselorUser as any).name,
                                counselorEmail: (counselorUser as any).email,
                                studentName:    (studentUser as any).name,
                                date:           appt.date,
                                timeSlot:       appt.timeSlot,
                                specialization: appt.specialization,
                                meetLink,
                            })
                        ]);
                    }
                } catch (emailErr) {
                    console.error('[APPOINTMENT STATUS] Email send failed:', emailErr);
                }

            } else {
                // Notify student of other status changes
                await Notification.create({
                    userId:  appt.studentId,
                    message: `Your appointment on ${appt.date.toDateString()} at ${appt.timeSlot} has been ${body.status}`,
                    type:    body.status === 'confirmed' ? 'confirmation' : 'cancellation',
                });
            }
        }

        return NextResponse.json(appt);
    } catch (err) {
        console.error('[APPOINTMENT PUT]', err);
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
        const isAdmin   = user.role === 'admin';

        if (!isStudent && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        appt.status = 'cancelled';
        await appt.save();

        await Notification.create({
            userId:  appt.counselorId,
            message: `Appointment on ${appt.date.toDateString()} at ${appt.timeSlot} was cancelled by the student`,
            type:    'cancellation',
        });

        return NextResponse.json({ message: 'Appointment cancelled' });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

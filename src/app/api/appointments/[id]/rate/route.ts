import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import CounselorProfile from '@/models/CounselorProfile';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const start = Date.now();
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized: Only students can submit ratings' }, { status: 403 });
        }

        const { id } = await params;
        const user = session.user as any;
        const { rating, feedback } = await req.json();
        console.log(`[RATE] Parsed request in ${Date.now() - start}ms`);

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        const dbStart = Date.now();
        await connectDB();
        console.log(`[RATE] DB connect took ${Date.now() - dbStart}ms`);

        const findStart = Date.now();
        const appointment = await Appointment.findById(id);
        console.log(`[RATE] findById took ${Date.now() - findStart}ms`);
        if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

        if (appointment.studentId.toString() !== user.id) {
            return NextResponse.json({ error: 'Unauthorized to rate this appointment' }, { status: 403 });
        }

        if (appointment.status !== 'completed') {
            return NextResponse.json({ error: 'You can only rate completed appointments' }, { status: 400 });
        }

        if (appointment.rating) {
            return NextResponse.json({ error: 'You have already rated this appointment' }, { status: 400 });
        }

        // Save rating to appointment + update counselor profile IN PARALLEL
        appointment.rating = rating;
        appointment.feedback = feedback || '';
        const counselorId = appointment.counselorId;

        const saveStart = Date.now();
        await Promise.all([
            // 1) Save the appointment
            appointment.save(),

            // 2) Update counselor profile — atomic increment
            CounselorProfile.findOneAndUpdate(
                { userId: counselorId },
                { $inc: { totalRatings: 1 } },
                { upsert: true, new: true }
            ).then(async (profile) => {
                // Recalculate average from the incremented total
                const total = profile.totalRatings || 1;
                const oldAvg = profile.averageRating || 0;
                const newAvg = ((oldAvg * (total - 1)) + rating) / total;
                profile.averageRating = Math.round(newAvg * 10) / 10;
                await profile.save();
            }),
        ]);
        console.log(`[RATE] Parallel save took ${Date.now() - saveStart}ms`);
        console.log(`[RATE] Total request took ${Date.now() - start}ms`);

        return NextResponse.json({ message: 'Rating submitted successfully', rating: appointment.rating });
    } catch (error) {
        console.error('[RATE_APPOINTMENT_POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


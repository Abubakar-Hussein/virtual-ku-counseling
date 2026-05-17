import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import CounselorProfile from '@/models/CounselorProfile';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized: Only students can submit ratings' }, { status: 403 });
        }

        const { id } = await params;
        const user = session.user as any;
        const { rating, feedback } = await req.json();

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        await connectDB();

        // Ensure the appointment belongs to the student and is completed
        const appointment = await Appointment.findById(id);
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

        // Save rating + feedback to appointment
        appointment.rating = rating;
        appointment.feedback = feedback || '';
        await appointment.save();

        let profile = await CounselorProfile.findOne({ userId: appointment.counselorId });
        if (!profile) {
            profile = new CounselorProfile({
                userId: appointment.counselorId,
                totalRatings: 0,
                averageRating: 0,
            });
        }

        const currentTotal = profile.totalRatings || 0;
        const currentAvg = profile.averageRating || 0;

        const newTotal = currentTotal + 1;
        const newAvg = ((currentAvg * currentTotal) + rating) / newTotal;

        profile.totalRatings = newTotal;
        profile.averageRating = Math.round(newAvg * 10) / 10; // Round to 1 decimal place

        await profile.save();

        return NextResponse.json({ message: 'Rating submitted successfully', rating: appointment.rating });
    } catch (error) {
        console.error('[RATE_APPOINTMENT_POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

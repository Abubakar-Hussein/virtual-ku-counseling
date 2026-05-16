import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import CounselorProfile from '@/models/CounselorProfile';
import mongoose from 'mongoose';

/**
 * POST /api/admin/repair-ratings
 * Admin-only: Recalculates averageRating and totalRatings for ALL counselors
 * by reading from actual completed+rated appointments.
 * Run this once to fix any counselors whose profile stats are out of sync.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        // Aggregate all ratings grouped by counselorId from appointment records
        const ratingsByCouns = await Appointment.aggregate([
            { $match: { rating: { $exists: true, $gt: 0 } } },
            {
                $group: {
                    _id: '$counselorId',
                    totalRatings: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                },
            },
        ]);

        if (ratingsByCouns.length === 0) {
            return NextResponse.json({ message: 'No rated appointments found. Nothing to repair.', repaired: 0 });
        }

        // Upsert each counselor profile with the correct computed values
        const ops = ratingsByCouns.map((row) => ({
            updateOne: {
                filter: { userId: new mongoose.Types.ObjectId(row._id) },
                update: {
                    $set: {
                        totalRatings: row.totalRatings,
                        averageRating: parseFloat(row.averageRating.toFixed(1)),
                    },
                },
                upsert: true,
            },
        }));

        const result = await CounselorProfile.bulkWrite(ops);

        return NextResponse.json({
            message: 'Rating repair complete.',
            repaired: result.modifiedCount + result.upsertedCount,
            counselorsProcessed: ratingsByCouns.length,
            details: ratingsByCouns.map((r) => ({
                counselorId: r._id,
                totalRatings: r.totalRatings,
                averageRating: parseFloat(r.averageRating.toFixed(1)),
            })),
        });
    } catch (error) {
        console.error('[REPAIR_RATINGS]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

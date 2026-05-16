import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import CounselorProfile from '@/models/CounselorProfile';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        const profile = await CounselorProfile.findOne({ userId: id }).lean();
        return NextResponse.json(profile?.availableSlots ?? []);
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).id !== id && (session.user as any).role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slots, bio, specializations, maxDailyBookings } = await req.json();

        // Server-side enforcement: no day can have more slots than maxDailyBookings
        if (Array.isArray(slots) && maxDailyBookings) {
            const slotsPerDay: Record<string, number> = {};
            for (const slot of slots) {
                if (slot.day) {
                    slotsPerDay[slot.day] = (slotsPerDay[slot.day] || 0) + 1;
                }
            }
            const overLimit = Object.entries(slotsPerDay).filter(([_, count]) => count > maxDailyBookings);
            if (overLimit.length > 0) {
                const dayNames = overLimit.map(([d]) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
                return NextResponse.json(
                    { error: `Too many time blocks on ${dayNames}. Maximum ${maxDailyBookings} per day.` },
                    { status: 400 }
                );
            }
        }

        await connectDB();

        const updated = await CounselorProfile.findOneAndUpdate(
            { userId: id },
            { availableSlots: slots, bio, specializations, maxDailyBookings },
            { upsert: true, new: true }
        );

        return NextResponse.json(updated);
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

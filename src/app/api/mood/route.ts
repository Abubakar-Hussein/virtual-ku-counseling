import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import MoodEntry from '@/models/MoodEntry';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');

    try {
        await connectDB();
        const since = new Date();
        since.setDate(since.getDate() - days);
        const entries = await MoodEntry.find({ studentId: userId, date: { $gte: since } })
            .sort({ date: -1 }).lean();
        return NextResponse.json(entries);
    } catch (err) {
        console.error('[MOOD GET]', err);
        return NextResponse.json({ error: 'Failed to fetch mood entries' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    try {
        await connectDB();
        const body = await req.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const entry = await MoodEntry.findOneAndUpdate(
            { studentId: userId, date: today },
            { ...body, studentId: userId, date: today },
            { upsert: true, new: true, runValidators: true }
        );
        return NextResponse.json(entry, { status: 201 });
    } catch (err: any) {
        console.error('[MOOD POST]', err);
        return NextResponse.json({ error: err.message || 'Failed to save mood' }, { status: 500 });
    }
}

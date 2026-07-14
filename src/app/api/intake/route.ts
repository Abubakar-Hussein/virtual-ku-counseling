import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Intake from '@/models/Intake';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    try {
        await connectDB();
        const body = await req.json();
        const intake = await Intake.create({ ...body, studentId: userId, completedAt: new Date() });
        return NextResponse.json(intake, { status: 201 });
    } catch (err: any) {
        console.error('[INTAKE POST]', err);
        return NextResponse.json({ error: err.message || 'Failed to save intake' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    try {
        await connectDB();
        const intake = await Intake.findOne({ studentId: userId }).sort({ createdAt: -1 }).lean();
        return NextResponse.json(intake || null);
    } catch (err) {
        console.error('[INTAKE GET]', err);
        return NextResponse.json({ error: 'Failed to fetch intake' }, { status: 500 });
    }
}

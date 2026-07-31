import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import GroupSession from '@/models/GroupSession';
import { createDailyGroupRoom } from '@/lib/daily';

// GET: List group sessions
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    try {
        await connectDB();
        const filter = req.nextUrl.searchParams.get('filter'); // 'my' for enrolled/created

        if (role === 'counselor') {
            const sessions = filter === 'my'
                ? await GroupSession.find({ counselorId: userId }).sort({ scheduledAt: -1 }).populate('counselorId', 'name').lean()
                : await GroupSession.find({ status: { $in: ['upcoming', 'live'] } }).sort({ scheduledAt: 1 }).populate('counselorId', 'name').lean();
            return NextResponse.json(sessions);
        }

        // Student
        if (filter === 'my') {
            const sessions = await GroupSession.find({ enrolledStudents: userId })
                .sort({ scheduledAt: -1 }).populate('counselorId', 'name').lean();
            return NextResponse.json(sessions);
        }
        const sessions = await GroupSession.find({ status: { $in: ['upcoming', 'live'] } })
            .sort({ scheduledAt: 1 }).populate('counselorId', 'name').lean();
        return NextResponse.json(sessions);
    } catch (err) {
        console.error('[GROUPS GET]', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// POST: Create group session (counselor) or enroll (student)
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    try {
        await connectDB();
        const body = await req.json();

        if (body.action === 'enroll') {
            if (role !== 'student') return NextResponse.json({ error: 'Only students can enroll' }, { status: 403 });
            const gs = await GroupSession.findById(body.sessionId);
            if (!gs) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
            if (gs.enrolledStudents.length >= gs.maxParticipants) return NextResponse.json({ error: 'Session is full' }, { status: 400 });
            if (gs.enrolledStudents.includes(userId)) return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
            gs.enrolledStudents.push(userId);
            await gs.save();
            return NextResponse.json({ success: true, enrolled: gs.enrolledStudents.length });
        }

        if (body.action === 'unenroll') {
            const gs = await GroupSession.findById(body.sessionId);
            if (!gs) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            gs.enrolledStudents = gs.enrolledStudents.filter((id: any) => id.toString() !== userId);
            await gs.save();
            return NextResponse.json({ success: true });
        }

        if (body.action === 'launch') {
            if (role !== 'counselor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const gs = await GroupSession.findById(body.sessionId);
            if (!gs) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            if (gs.counselorId.toString() !== userId) return NextResponse.json({ error: 'Not your session' }, { status: 403 });
            const room = await createDailyGroupRoom(body.sessionId, gs.maxParticipants);
            gs.roomUrl = room.url;
            gs.status = 'live';
            await gs.save();
            return NextResponse.json({ roomUrl: room.url });
        }

        // Create new group session
        if (role !== 'counselor') return NextResponse.json({ error: 'Only counselors can create' }, { status: 403 });
        const { title, description, topic, scheduledAt, duration, maxParticipants, isAnonymous, tags } = body;
        if (!title || !topic || !scheduledAt) return NextResponse.json({ error: 'title, topic, scheduledAt required' }, { status: 400 });

        const gs = await GroupSession.create({
            title, description, topic, scheduledAt, duration: duration || 60,
            maxParticipants: maxParticipants || 20, counselorId: userId,
            isAnonymous: isAnonymous !== false, tags: tags || [],
        });
        return NextResponse.json(gs, { status: 201 });
    } catch (err) {
        console.error('[GROUPS POST]', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

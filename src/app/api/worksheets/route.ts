import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Worksheet from '@/models/Worksheet';
import WorksheetAssignment from '@/models/WorksheetAssignment';

// GET: List worksheets (templates for counselors, assignments for students)
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    try {
        await connectDB();

        if (role === 'counselor') {
            const worksheets = await Worksheet.find({ $or: [{ isTemplate: true }, { createdBy: userId }] })
                .sort({ createdAt: -1 }).lean();
            const assignments = await WorksheetAssignment.find({ counselorId: userId })
                .populate('studentId', 'name email')
                .populate('worksheetId', 'title category')
                .sort({ assignedAt: -1 }).lean();
            return NextResponse.json({ worksheets, assignments });
        }

        // Student: get their assignments
        const assignments = await WorksheetAssignment.find({ studentId: userId })
            .populate('worksheetId')
            .populate('counselorId', 'name')
            .sort({ assignedAt: -1 }).lean();
        return NextResponse.json({ assignments });
    } catch (err) {
        console.error('[WORKSHEETS GET]', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// POST: Create worksheet template or assign to student
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'counselor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const userId = (session.user as any).id;

    try {
        await connectDB();
        const body = await req.json();

        if (body.action === 'assign') {
            const { worksheetId, studentId } = body;
            if (!worksheetId || !studentId) return NextResponse.json({ error: 'worksheetId and studentId required' }, { status: 400 });
            const assignment = await WorksheetAssignment.create({ worksheetId, studentId, counselorId: userId });
            return NextResponse.json(assignment, { status: 201 });
        }

        // Create new worksheet template
        const { title, description, category, questions } = body;
        if (!title || !questions?.length) return NextResponse.json({ error: 'title and questions required' }, { status: 400 });
        const worksheet = await Worksheet.create({ title, description, category, questions, createdBy: userId });
        return NextResponse.json(worksheet, { status: 201 });
    } catch (err) {
        console.error('[WORKSHEETS POST]', err);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

// PATCH: Submit worksheet responses (student) or review (counselor)
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    try {
        await connectDB();
        const { assignmentId, responses, feedback } = await req.json();
        if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });

        const assignment = await WorksheetAssignment.findById(assignmentId);
        if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (role === 'student' && assignment.studentId.toString() === userId) {
            assignment.responses = responses;
            assignment.status = 'completed';
            assignment.completedAt = new Date();
            await assignment.save();
            return NextResponse.json(assignment);
        }

        if (role === 'counselor' && assignment.counselorId.toString() === userId) {
            assignment.counselorFeedback = feedback;
            assignment.status = 'reviewed';
            assignment.reviewedAt = new Date();
            await assignment.save();
            return NextResponse.json(assignment);
        }

        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } catch (err) {
        console.error('[WORKSHEETS PATCH]', err);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

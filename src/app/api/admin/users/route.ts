import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { logAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        await connectDB();

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate   = searchParams.get('endDate');
        const role      = searchParams.get('role');   // 'student' | 'counselor' | 'admin' | '' (all)

        // Build a dynamic query filter
        const filter: Record<string, any> = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                // Include the full end day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        if (role && role !== 'all') {
            filter.role = role;
        }

        const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
        return NextResponse.json(users);
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const body = await req.json();
        const { userId } = body;
        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

        await connectDB();
        
        const oldUser = await User.findById(userId);
        if (!oldUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        
        // Build update object from allowed fields
        const allowedFields = ['name', 'email', 'phone', 'studentId', 'role'];
        const updates: Record<string, any> = {};
        const changes: string[] = [];
        for (const field of allowedFields) {
            if (body[field] !== undefined && body[field] !== (oldUser as any)[field]) {
                updates[field] = body[field];
                changes.push(`${field}: "${(oldUser as any)[field] || ''}" → "${body[field]}"`);
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(oldUser);
        }

        const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');
        
        await logAction({
            userId: (session.user as any).id,
            userName: session.user?.name || 'Admin',
            action: 'UPDATE_PROFILE',
            resource: 'USER',
            details: `Updated ${oldUser.name} (${oldUser.email}): ${changes.join('; ')}`,
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });
        
        return NextResponse.json(user);
    } catch (err: any) {
        if (err?.name === 'ValidationError') {
            const msg = Object.values(err.errors).map((e: any) => e.message).join(', ');
            return NextResponse.json({ error: msg }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        
        await connectDB();
        
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        
        await User.findByIdAndDelete(userId);
        
        await logAction({
            userId: (session.user as any).id,
            userName: session.user?.name || 'Admin',
            action: 'DELETE_USER',
            resource: 'USER',
            details: `Deleted user ${user.name} (${user.email})`,
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });
        
        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

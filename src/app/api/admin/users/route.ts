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
        const { userId, role } = await req.json();
        await connectDB();
        
        const oldUser = await User.findById(userId);
        if (!oldUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        
        const oldRole = oldUser.role;
        const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
        
        if (user && oldRole !== role) {
            await logAction({
                userId: (session.user as any).id,
                userName: session.user.name || 'Admin',
                action: 'UPDATE_PROFILE',
                resource: 'USER',
                details: `Updated role for ${user.name} (${user.email}): ${oldRole} -> ${role}`,
                ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
            });
        }
        
        return NextResponse.json(user);
    } catch (err) {
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
            userName: session.user.name || 'Admin',
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

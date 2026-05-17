import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import AdminProfile from '@/models/AdminProfile';
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
        const userRole = searchParams.get('role');   // 'student' | 'counselor' | 'admin' | '' (all)
        const limitParam = searchParams.get('limit');
        const isReport = !!(startDate || endDate); // Report pages always send date range

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

        if (userRole && userRole !== 'all') {
            filter.role = userRole;
        }

        // Always exclude profileImage (large base64 blobs) — the user table only shows
        // 36px avatar circles with initials, and reports never need images either.
        let query = User.find(filter).select('-password -profileImage').sort({ createdAt: -1 });
        if (limitParam) {
            const limit = parseInt(limitParam, 10);
            if (!isNaN(limit) && limit > 0) query = query.limit(limit);
        }
        const dbUsers = await query.lean();

        // The hardcoded admin has no User document in MongoDB.
        // Inject a synthetic admin entry when the filter includes the admin role.
        let includeAdmin = false;
        if (userRole === 'admin') {
            includeAdmin = true; // explicitly asked for admins, show regardless of date
        } else if (!userRole || userRole === 'all') {
            includeAdmin = true;
            const adminDate = new Date('2024-01-01');
            if (startDate && new Date(startDate) > adminDate) includeAdmin = false;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (end < adminDate) includeAdmin = false;
            }
        }

        let users: any[] = [...dbUsers];

        if (includeAdmin) {
            const adminProfileDoc = await AdminProfile.findOne({ adminKey: 'default' })
                .select('name phone')
                .lean() as any;
            const adminEntry = {
                _id: 'admin-hardcoded-id',
                name: adminProfileDoc?.name || 'System Administrator',
                email: process.env.ADMIN_EMAIL || 'admin@ku.ac.ke',
                phone: adminProfileDoc?.phone || '',
                role: 'admin',
                approvalStatus: 'approved',
                createdAt: new Date('2024-01-01'),
                isHardcoded: true,
            };
            users = [adminEntry, ...dbUsers];
        }

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
                if (field === 'name') {
                    const nameRegex = /^[A-Za-z\s\-\']+$/;
                    if (!nameRegex.test(body[field].trim())) {
                        return NextResponse.json({ error: 'Name can only contain letters, spaces, hyphens, and apostrophes' }, { status: 400 });
                    }
                }
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

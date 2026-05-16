import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = session.user as any;
        
        // Safety check: The hardcoded admin has a string ID 'admin-hardcoded-id' 
        // which will cause a Mongoose CastError if we try to query with it.
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(user.id)) {
            return NextResponse.json([]);
        }

        const notifications = await Notification.find({ userId: user.id }).sort({ createdAt: -1 }).limit(20).lean();
        return NextResponse.json(notifications);
    } catch (err) {
        console.error('[NOTIFICATIONS GET ERROR]:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = session.user as any;

        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(user.id)) {
            return NextResponse.json({ message: 'No notifications to mark for system user' });
        }

        await Notification.updateMany({ userId: user.id, read: false }, { read: true });
        return NextResponse.json({ message: 'All marked as read' });
    } catch (err) {
        console.error('[NOTIFICATIONS PATCH ERROR]:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

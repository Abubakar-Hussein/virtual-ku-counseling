import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';

// GET: Fetch conversation with a specific user
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    const otherUserId = req.nextUrl.searchParams.get('with');
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = 50;

    try {
        await connectDB();

        if (otherUserId) {
            // Fetch messages between these two users
            const messages = await Message.find({
                $or: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId },
                ],
            })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            // Mark unread messages as read
            await Message.updateMany(
                { senderId: otherUserId, receiverId: userId, read: false },
                { read: true, readAt: new Date() }
            );

            return NextResponse.json(messages.reverse());
        }

        // No 'with' param — return list of conversations (contacts)
        const sent = await Message.aggregate([
            { $match: { senderId: userId } },
            { $group: { _id: '$receiverId' } },
        ]);
        const received = await Message.aggregate([
            { $match: { receiverId: userId } },
            { $group: { _id: '$senderId' } },
        ]);

        const contactIdSet = new Set([
            ...sent.map(s => s._id.toString()),
            ...received.map(r => r._id.toString()),
        ]);
        const contactIds = [...contactIdSet];

        // For each contact, get last message and unread count
        const contacts = await Promise.all(
            contactIds.map(async (cid) => {
                const user = await User.findById(cid).select('name email role profileImage').lean();
                const lastMsg = await Message.findOne({
                    $or: [
                        { senderId: userId, receiverId: cid },
                        { senderId: cid, receiverId: userId },
                    ],
                }).sort({ createdAt: -1 }).lean();
                const unread = await Message.countDocuments({
                    senderId: cid, receiverId: userId, read: false,
                });
                return { user, lastMessage: lastMsg, unreadCount: unread };
            })
        );

        contacts.sort((a, b) => {
            const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return bTime - aTime;
        });

        return NextResponse.json(contacts);
    } catch (err) {
        console.error('[MESSAGES GET]', err);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST: Send a message
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    try {
        await connectDB();
        const { receiverId, content, messageType } = await req.json();
        if (!receiverId || !content?.trim()) {
            return NextResponse.json({ error: 'receiverId and content required' }, { status: 400 });
        }

        const message = await Message.create({
            senderId: userId,
            receiverId,
            content: content.trim(),
            messageType: messageType || 'text',
        });

        return NextResponse.json(message, { status: 201 });
    } catch (err) {
        console.error('[MESSAGES POST]', err);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}

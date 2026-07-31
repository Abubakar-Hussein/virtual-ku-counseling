import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

const VALID_PROVIDERS = ['google', 'outlook', 'apple'];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const user = await User.findOne({ email: session.user.email }).select('calendarProvider').lean() as any;

        return NextResponse.json({ provider: user?.calendarProvider || null });
    } catch (err) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { provider, action } = body;

        await connectDB();

        if (action === 'disconnect') {
            await User.updateOne({ email: session.user.email }, { $set: { calendarProvider: null } });
            return NextResponse.json({ success: true, provider: null });
        }

        if (!provider || !VALID_PROVIDERS.includes(provider)) {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        await User.updateOne({ email: session.user.email }, { $set: { calendarProvider: provider } });
        return NextResponse.json({ success: true, provider });
    } catch (err) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

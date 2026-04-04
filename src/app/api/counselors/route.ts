import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const spec = searchParams.get('specialization');

        const query: any = { role: 'counselor' };
        const counselors = await User.find(query).select('-password').lean();

        // Attach profile info
        const profiles = await CounselorProfile.find({
            userId: { $in: counselors.map((c) => c._id) },
        }).lean();

        const profileMap: Record<string, any> = {};
        profiles.forEach((p) => { profileMap[p.userId.toString()] = p; });

        let result = counselors.map((c) => ({
            ...c,
            profile: profileMap[c._id.toString()] ?? null,
        }));

        if (spec) {
            result = result.filter((c) =>
                c.profile?.specializations?.includes(spec)
            );
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error('[COUNSELORS GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

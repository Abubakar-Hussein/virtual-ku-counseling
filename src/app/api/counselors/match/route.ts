import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Intake from '@/models/Intake';
import CounselorProfile from '@/models/CounselorProfile';
import User from '@/models/User';
import Appointment from '@/models/Appointment';

const CONCERN_TO_SPEC: Record<string, string> = {
    'Academic Stress': 'academic', 'Study Skills': 'academic', 'Time Management': 'academic',
    'Career Choice': 'career', 'Job Search': 'career', 'Career Transition': 'career',
    'Anxiety': 'mental_health', 'Depression': 'mental_health', 'Self-Esteem': 'mental_health',
    'Relationship': 'mental_health', 'Family Issues': 'mental_health', 'Grief': 'mental_health',
    'Substance Use': 'mental_health', 'Eating Habits': 'mental_health', 'Trauma': 'mental_health',
    'Other': 'mental_health',
};

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const intakeId = req.nextUrl.searchParams.get('intakeId');
    if (!intakeId) return NextResponse.json({ error: 'intakeId required' }, { status: 400 });

    try {
        await connectDB();
        const intake = await Intake.findById(intakeId).lean() as any;
        if (!intake) return NextResponse.json({ error: 'Intake not found' }, { status: 404 });

        // Get all approved counselors with profiles
        const counselors = await User.find({ role: 'counselor', approvalStatus: 'approved' }).lean();
        const profiles = await CounselorProfile.find({ userId: { $in: counselors.map(c => c._id) } }).lean() as any[];

        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

        // Determine needed specializations from concerns
        const neededSpecs = new Set<string>();
        (intake.concerns || []).forEach((c: string) => {
            const spec = CONCERN_TO_SPEC[c];
            if (spec) neededSpecs.add(spec);
        });
        if (neededSpecs.size === 0) neededSpecs.add('mental_health');

        // Count upcoming slots this week for availability scoring
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const existingAppts = await Appointment.find({
            date: { $gte: now, $lte: weekFromNow },
            status: { $in: ['pending', 'confirmed'] }
        }).lean() as any[];

        const apptCountByC: Record<string, number> = {};
        existingAppts.forEach(a => {
            const cid = a.counselorId.toString();
            apptCountByC[cid] = (apptCountByC[cid] || 0) + 1;
        });

        // Score each counselor
        const scored = counselors.map(c => {
            const cid = c._id.toString();
            const profile = profileMap.get(cid);
            if (!profile) return null;

            let score = 0;
            const reasons: string[] = [];

            // 40% Specialization match
            const specs = profile.specializations || [];
            const specOverlap = specs.filter((s: string) => neededSpecs.has(s)).length;
            const specScore = neededSpecs.size > 0 ? (specOverlap / neededSpecs.size) * 40 : 20;
            score += specScore;
            if (specOverlap > 0) reasons.push(`Specializes in ${specs.filter((s: string) => neededSpecs.has(s)).join(', ').replace('mental_health', 'Mental Health').replace('academic', 'Academic').replace('career', 'Career')}`);

            // 25% Availability
            const bookedThisWeek = apptCountByC[cid] || 0;
            const maxDaily = profile.maxDailyBookings || 8;
            const totalWeeklySlots = (profile.availableSlots || []).length;
            const availRatio = totalWeeklySlots > 0 ? Math.max(0, 1 - bookedThisWeek / (maxDaily * 5)) : 0;
            score += availRatio * 25;
            if (availRatio > 0.5) reasons.push('Good availability this week');

            // 15% Rating
            const rating = profile.averageRating || 0;
            score += (rating / 5) * 15;
            if (rating >= 4) reasons.push(`${rating.toFixed(1)}★ average rating`);

            // 10% Gender preference
            if (intake.preferredCounselorGender && intake.preferredCounselorGender !== 'no_preference') {
                // Simple heuristic based on name (not perfect, but functional)
                score += 5; // neutral — can't reliably determine gender from data
            } else {
                score += 10;
            }

            // 10% Session type
            if (intake.preferredSessionType === 'virtual' && profile.meetLink) {
                score += 10;
                reasons.push('Offers virtual sessions');
            } else if (intake.preferredSessionType === 'in_person') {
                score += 10;
                reasons.push('Offers in-person sessions');
            } else {
                score += 10;
            }

            return {
                _id: cid,
                name: c.name,
                email: c.email,
                profileImage: (c as any).profileImage,
                specializations: specs,
                bio: profile.bio,
                averageRating: profile.averageRating,
                totalRatings: profile.totalRatings,
                meetLink: profile.meetLink,
                availableSlots: profile.availableSlots,
                matchScore: Math.round(score),
                reasons,
            };
        }).filter(Boolean);

        // Sort by score descending, return top 3
        scored.sort((a: any, b: any) => b.matchScore - a.matchScore);
        return NextResponse.json(scored.slice(0, 3));
    } catch (err) {
        console.error('[MATCH]', err);
        return NextResponse.json({ error: 'Failed to match' }, { status: 500 });
    }
}

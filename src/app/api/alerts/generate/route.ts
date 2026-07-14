import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import CaseloadAlert from '@/models/CaseloadAlert';
import MoodEntry from '@/models/MoodEntry';
import Appointment from '@/models/Appointment';
import Intake from '@/models/Intake';

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'counselor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const counselorId = (session.user as any).id;

    try {
        await connectDB();
        const generated: string[] = [];

        // Get all students this counselor has appointments with
        const appts = await Appointment.find({
            counselorId,
            status: { $in: ['confirmed', 'completed'] }
        }).lean() as any[];

        const studentIds = [...new Set(appts.map(a => a.studentId.toString()))];

        for (const sid of studentIds) {
            // Check for existing unacknowledged alerts to avoid duplicates
            const existingTypes = new Set(
                (await CaseloadAlert.find({ counselorId, studentId: sid, acknowledged: false }).lean() as any[])
                    .map(a => a.type)
            );

            // 1. Low mood alert — latest mood ≤ 3
            if (!existingTypes.has('low_mood')) {
                const latest = await MoodEntry.findOne({ studentId: sid }).sort({ date: -1 }).lean() as any;
                if (latest && latest.mood <= 3) {
                    const studentAppt = appts.find(a => a.studentId.toString() === sid);
                    await CaseloadAlert.create({
                        counselorId, studentId: sid, type: 'low_mood',
                        message: `Reported mood level ${latest.mood}/10 on ${new Date(latest.date).toLocaleDateString()}`,
                        severity: 'warning',
                    });
                    generated.push('low_mood');
                }
            }

            // 2. Mood decline — dropped 3+ points in 7 days
            if (!existingTypes.has('mood_decline')) {
                const week = new Date();
                week.setDate(week.getDate() - 7);
                const recentMoods = await MoodEntry.find({ studentId: sid, date: { $gte: week } })
                    .sort({ date: 1 }).lean() as any[];
                if (recentMoods.length >= 2) {
                    const first = recentMoods[0].mood;
                    const last = recentMoods[recentMoods.length - 1].mood;
                    if (first - last >= 3) {
                        await CaseloadAlert.create({
                            counselorId, studentId: sid, type: 'mood_decline',
                            message: `Mood dropped from ${first} to ${last} over the past week`,
                            severity: 'critical',
                        });
                        generated.push('mood_decline');
                    }
                }
            }

            // 3. Inactivity — no mood log in 14+ days
            if (!existingTypes.has('inactivity')) {
                const twoWeeks = new Date();
                twoWeeks.setDate(twoWeeks.getDate() - 14);
                const recent = await MoodEntry.findOne({ studentId: sid, date: { $gte: twoWeeks } }).lean();
                const hasAnyMood = await MoodEntry.findOne({ studentId: sid }).lean();
                if (!recent && hasAnyMood) {
                    await CaseloadAlert.create({
                        counselorId, studentId: sid, type: 'inactivity',
                        message: 'Has not logged mood in over 14 days',
                        severity: 'info',
                    });
                    generated.push('inactivity');
                }
            }

            // 4. Missed sessions — 2+ cancelled in a row
            if (!existingTypes.has('missed_session')) {
                const recentAppts = await Appointment.find({ studentId: sid, counselorId })
                    .sort({ date: -1 }).limit(3).lean() as any[];
                const cancelled = recentAppts.filter(a => a.status === 'cancelled');
                if (cancelled.length >= 2) {
                    await CaseloadAlert.create({
                        counselorId, studentId: sid, type: 'missed_session',
                        message: `Cancelled ${cancelled.length} recent sessions`,
                        severity: 'warning',
                    });
                    generated.push('missed_session');
                }
            }

            // 5. High urgency — intake flagged urgent
            if (!existingTypes.has('high_urgency')) {
                const urgentIntake = await Intake.findOne({ studentId: sid, isUrgent: true })
                    .sort({ createdAt: -1 }).lean() as any;
                if (urgentIntake) {
                    const alreadyHandled = await CaseloadAlert.findOne({
                        counselorId, studentId: sid, type: 'high_urgency', acknowledged: true,
                        createdAt: { $gte: urgentIntake.createdAt }
                    });
                    if (!alreadyHandled) {
                        await CaseloadAlert.create({
                            counselorId, studentId: sid, type: 'high_urgency',
                            message: 'Flagged their intake as urgent / crisis triage',
                            severity: 'critical',
                        });
                        generated.push('high_urgency');
                    }
                }
            }
        }

        return NextResponse.json({ generated: generated.length, types: generated });
    } catch (err) {
        console.error('[ALERTS GENERATE]', err);
        return NextResponse.json({ error: 'Failed to generate alerts' }, { status: 500 });
    }
}

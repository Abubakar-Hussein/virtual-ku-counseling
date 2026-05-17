import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import SessionNote from '@/models/SessionNote';
import { autoCompletePastAppointments } from '@/lib/autoComplete';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const startDate  = searchParams.get('startDate');
        const endDate    = searchParams.get('endDate');
        const summaryOnly = searchParams.get('summary') === '1';
        const chartsOnly  = searchParams.get('charts') === '1';

        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        // Fire-and-forget: resolve stale appointments before aggregating so
        // report numbers are always accurate.
        autoCompletePastAppointments();

        // Build date filters
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt.$lte = end;
            }
        }
        const appointmentFilter = { ...dateFilter };

        // ── Mode: summary=1 ─────────────────────────────────────────────────
        // Only cheap countDocuments() — no aggregation joins, resolves fast.
        if (summaryOnly) {
            const [totalStudents, totalCounselors, totalAppointments, cancelled, uniqueStudentsResult] = await Promise.all([
                User.countDocuments({ role: 'student', ...dateFilter }),
                User.countDocuments({ role: 'counselor' }),
                Appointment.countDocuments(appointmentFilter),
                Appointment.countDocuments({ ...appointmentFilter, status: 'cancelled' }),
                Appointment.distinct('studentId', appointmentFilter),
            ]);

            const noShowRate = totalAppointments > 0
                ? parseFloat(((cancelled / totalAppointments) * 100).toFixed(1))
                : 0;

            const uniqueStudentsCount = uniqueStudentsResult.length;

            return NextResponse.json({
                summary: {
                    totalStudents,
                    totalCounselors,
                    totalAppointments,
                    avgLeadTime: 0,      // placeholder — filled by charts phase
                    noShowRate,
                    studentReach: totalStudents > 0
                        ? parseFloat(((uniqueStudentsCount / totalStudents) * 100).toFixed(1))
                        : 0,
                },
            });
        }

        // ── Mode: charts=1 ──────────────────────────────────────────────────
        // Heavy aggregation pipelines — runs in the background after paint.
        if (chartsOnly) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const [
                serviceMix,
                statusDistribution,
                trends,
                leadTimeResult,
                counselorPerformance,
                hourlyDemand,
                progressDistribution,
            ] = await Promise.all([
                // Service Mix
                Appointment.aggregate([
                    { $match: { ...appointmentFilter, specialization: { $exists: true, $ne: null } } },
                    { $group: { _id: '$specialization', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]),

                // Status Distribution
                Appointment.aggregate([
                    { $match: appointmentFilter },
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                ]),

                // Trends (Last 30 days)
                Appointment.aggregate([
                    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                    { $sort: { _id: 1 } },
                ]),

                // Average Lead Time
                Appointment.aggregate([
                    { $match: { status: 'completed' } },
                    { $project: { leadTime: { $subtract: ['$date', '$createdAt'] } } },
                    { $group: { _id: null, avgLeadTime: { $avg: '$leadTime' } } },
                ]),

                // Counselor Performance
                Appointment.aggregate([
                    { $match: { ...appointmentFilter, counselorId: { $exists: true, $ne: null } } },
                    { $group: {
                        _id: '$counselorId',
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                        total: { $sum: 1 },
                    }},
                    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'counselor' } },
                    { $unwind: '$counselor' },
                    { $project: { name: '$counselor.name', completed: 1, total: 1 } },
                    { $sort: { total: -1 } },
                    { $limit: 5 },
                ]),

                // Hourly Demand
                Appointment.aggregate([
                    { $match: { ...appointmentFilter, timeSlot: { $type: 'string', $regex: /:/ } } },
                    { $group: { _id: { $arrayElemAt: [{ $split: ['$timeSlot', ':'] }, 0] }, count: { $sum: 1 } } },
                    { $sort: { _id: 1 } },
                ]),

                // Clinical Progress
                SessionNote.aggregate([
                    { $match: dateFilter },
                    { $group: { _id: '$progressIndicator', count: { $sum: 1 } } },
                ]),
            ]);

            const totalAppointments = statusDistribution.reduce((sum: number, s: any) => sum + s.count, 0);

            const avgLeadTimeDays = leadTimeResult.length > 0 && leadTimeResult[0].avgLeadTime
                ? leadTimeResult[0].avgLeadTime / (1000 * 60 * 60 * 24)
                : 0;

            return NextResponse.json({
                serviceMix: serviceMix.map((s: any) => ({
                    label: (s._id || 'General').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                    value: s.count,
                    percentage: totalAppointments > 0 ? parseFloat(((s.count / totalAppointments) * 100).toFixed(0)) : 0,
                })),
                trends: trends.map((t: any) => ({ date: t._id, count: t.count })),
                counselorPerformance,
                hourlyDemand: hourlyDemand.map((h: any) => ({ hour: `${h._id}:00`, count: h.count })),
                statusDistribution,
                avgLeadTime: parseFloat(avgLeadTimeDays.toFixed(1)),
                progressDistribution: progressDistribution.map((p: any) => ({
                    label: p._id,
                    count: p.count,
                    percentage: totalAppointments > 0 ? parseFloat(((p.count / totalAppointments) * 100).toFixed(0)) : 0,
                })),
            });
        }

        // ── Fallback: full response (backward-compatible for reports pages) ──
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalStudents, totalCounselors, totalAppointments,
            serviceMix, statusDistribution, trends, leadTimeResult,
            counselorPerformance, hourlyDemand, progressDistribution, uniqueStudentsResult
        ] = await Promise.all([
            User.countDocuments({ role: 'student', ...dateFilter }),
            User.countDocuments({ role: 'counselor' }),
            Appointment.countDocuments(appointmentFilter),
            Appointment.aggregate([
                { $match: { ...appointmentFilter, specialization: { $exists: true, $ne: null } } },
                { $group: { _id: '$specialization', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Appointment.aggregate([
                { $match: appointmentFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Appointment.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            Appointment.aggregate([
                { $match: { status: 'completed' } },
                { $project: { leadTime: { $subtract: ['$date', '$createdAt'] } } },
                { $group: { _id: null, avgLeadTime: { $avg: '$leadTime' } } },
            ]),
            Appointment.aggregate([
                { $match: { ...appointmentFilter, counselorId: { $exists: true, $ne: null } } },
                { $group: { _id: '$counselorId', completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, total: { $sum: 1 } } },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'counselor' } },
                { $unwind: '$counselor' },
                { $project: { name: '$counselor.name', completed: 1, total: 1 } },
                { $sort: { total: -1 } }, { $limit: 5 },
            ]),
            Appointment.aggregate([
                { $match: { ...appointmentFilter, timeSlot: { $type: 'string', $regex: /:/ } } },
                { $group: { _id: { $arrayElemAt: [{ $split: ['$timeSlot', ':'] }, 0] }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            SessionNote.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$progressIndicator', count: { $sum: 1 } } },
            ]),
            Appointment.distinct('studentId', appointmentFilter),
        ]);

        const avgLeadTime = leadTimeResult.length > 0 && leadTimeResult[0].avgLeadTime
            ? leadTimeResult[0].avgLeadTime / (1000 * 60 * 60 * 24)
            : 0;
        const cancelled = statusDistribution.find((s: any) => s._id === 'cancelled')?.count || 0;
        const noShowRate = totalAppointments > 0 ? (cancelled / totalAppointments) * 100 : 0;
        const uniqueStudentsCount = uniqueStudentsResult.length;

        return NextResponse.json({
            summary: {
                totalStudents, totalCounselors, totalAppointments,
                avgLeadTime: parseFloat(avgLeadTime.toFixed(1)),
                noShowRate: parseFloat(noShowRate.toFixed(1)),
                studentReach: totalStudents > 0 ? parseFloat(((uniqueStudentsCount / totalStudents) * 100).toFixed(1)) : 0,
            },
            serviceMix: serviceMix.map((s: any) => ({
                label: (s._id || 'General').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                value: s.count,
                percentage: totalAppointments > 0 ? parseFloat(((s.count / totalAppointments) * 100).toFixed(0)) : 0,
            })),
            trends: trends.map((t: any) => ({ date: t._id, count: t.count })),
            counselorPerformance,
            hourlyDemand: hourlyDemand.map((h: any) => ({ hour: `${h._id}:00`, count: h.count })),
            statusDistribution,
            progressDistribution: progressDistribution.map((p: any) => ({
                label: p._id,
                count: p.count,
                percentage: totalAppointments > 0 ? parseFloat(((p.count / totalAppointments) * 100).toFixed(0)) : 0,
            })),
        });

    } catch (error) {
        console.error('[ADMIN_STATS_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

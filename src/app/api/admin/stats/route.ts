import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import SessionNote from '@/models/SessionNote';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        // Build date filter
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
        // If we want to filter by the actual appointment date instead of creation date for some metrics:
        const sessionDateFilter: any = {};
        if (startDate || endDate) {
            sessionDateFilter.date = {};
            if (startDate) sessionDateFilter.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                sessionDateFilter.date.$lte = end;
            }
        }

        // 1. Basic Stats
        const [totalStudents, totalCounselors, totalAppointments] = await Promise.all([
            User.countDocuments({ role: 'student', ...dateFilter }),
            User.countDocuments({ role: 'counselor' }),
            Appointment.countDocuments(appointmentFilter)
        ]);

        // 2. Service Mix (Specialization Distribution)
        const serviceMix = await Appointment.aggregate([
            { $match: { ...appointmentFilter, specialization: { $exists: true, $ne: null } } },
            { $group: { _id: '$specialization', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 3. Status Distribution
        const statusDistribution = await Appointment.aggregate([
            { $match: appointmentFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // 4. Trend Data (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const trends = await Appointment.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 5. Average Lead Time
        const completedApps = await Appointment.find({ status: 'completed' }).lean();
        let avgLeadTime = 0;
        if (completedApps.length > 0) {
            const totalLeadTime = completedApps.reduce((acc, curr) => {
                const created = new Date(curr.createdAt).getTime();
                const sessionDate = new Date(curr.date).getTime();
                if (isNaN(created) || isNaN(sessionDate)) return acc;
                return acc + (sessionDate - created);
            }, 0);
            avgLeadTime = totalLeadTime / completedApps.length / (1000 * 60 * 60 * 24);
        }

        // 6. No-Show Rate
        const cancelled = statusDistribution.find(s => s._id === 'cancelled')?.count || 0;
        const noShowRate = totalAppointments > 0 ? (cancelled / totalAppointments) * 100 : 0;

        // 7. Counselor Performance
        const counselorPerformance = await Appointment.aggregate([
            { $match: { ...appointmentFilter, counselorId: { $exists: true, $ne: null } } },
            { $group: { 
                _id: '$counselorId', 
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                total: { $sum: 1 }
            }},
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'counselor' } },
            { $unwind: '$counselor' },
            { $project: { name: '$counselor.name', completed: 1, total: 1 } },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        // 8. Hourly Demand Distribution
        const hourlyDemand = await Appointment.aggregate([
            { $match: { ...appointmentFilter, timeSlot: { $type: 'string', $regex: /:/ } } },
            { $group: { 
                _id: { $arrayElemAt: [{ $split: ['$timeSlot', ':'] }, 0] }, 
                count: { $sum: 1 } 
            }},
            { $sort: { _id: 1 } }
        ]);

        // 9. Clinical Progress Distribution
        const progressDistribution = await SessionNote.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$progressIndicator', count: { $sum: 1 } } }
        ]);

        return NextResponse.json({
            summary: {
                totalStudents,
                totalCounselors,
                totalAppointments,
                avgLeadTime: parseFloat(avgLeadTime.toFixed(1)),
                noShowRate: parseFloat(noShowRate.toFixed(1)),
                studentReach: totalStudents > 0 ? parseFloat(((totalAppointments / totalStudents) * 100).toFixed(1)) : 0
            },
            serviceMix: serviceMix.map(s => ({
                label: (s._id || 'General').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                value: s.count,
                percentage: totalAppointments > 0 ? parseFloat(((s.count / totalAppointments) * 100).toFixed(0)) : 0
            })),
            trends: trends.map(t => ({
                date: t._id,
                count: t.count
            })),
            counselorPerformance,
            hourlyDemand: hourlyDemand.map(h => ({
                hour: `${h._id}:00`,
                count: h.count
            })),
            progressDistribution: progressDistribution.map(p => ({
                label: p._id,
                count: p.count,
                percentage: totalAppointments > 0 ? parseFloat(((p.count / totalAppointments) * 100).toFixed(0)) : 0
            }))
        });

    } catch (error) {
        console.error('[ADMIN_STATS_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

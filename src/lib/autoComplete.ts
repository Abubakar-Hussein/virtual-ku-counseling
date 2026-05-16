import Appointment from '@/models/Appointment';
import { connectDB } from './mongodb';

/**
 * Simple in-process debounce: only allow autoComplete to actually write
 * to the DB once every 60 seconds, regardless of how many parallel requests
 * trigger it. This avoids 3× redundant DB writes on every student dashboard
 * load (stats + active + completed all call this simultaneously).
 */
let lastRunAt = 0;
const DEBOUNCE_MS = 60 * 1000; // 60 seconds

/**
 * autoCompletePastAppointments
 *
 * Finds all appointments whose scheduled date has passed and:
 *   - "confirmed"  → marks as "completed"  (session happened, counselor forgot to close)
 *   - "pending"    → marks as "cancelled"  (counselor never accepted; slot expired)
 *
 * Run as fire-and-forget on every dashboard/stats load — no cron job needed.
 * Debounced to once per 60 s so parallel requests don't cause redundant writes.
 * Never throws — errors are logged but swallowed so callers are never affected.
 */
export async function autoCompletePastAppointments(): Promise<{ completed: number; cancelled: number }> {
    // Debounce: skip if we ran within the last 60 seconds
    const now = Date.now();
    if (now - lastRunAt < DEBOUNCE_MS) {
        return { completed: 0, cancelled: 0 };
    }
    lastRunAt = now;

    try {
        await connectDB();

        // "Past" = before today's midnight.
        // Counselor has the whole calendar day to act — after midnight we auto-resolve.
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        const [completedResult, cancelledResult] = await Promise.all([
            // confirmed + past → completed (session happened)
            Appointment.updateMany(
                { status: 'confirmed', date: { $lt: todayMidnight } },
                { $set: { status: 'completed' } }
            ),
            // pending + past → cancelled (counselor never responded)
            Appointment.updateMany(
                { status: 'pending', date: { $lt: todayMidnight } },
                { $set: { status: 'cancelled' } }
            ),
        ]);

        if (completedResult.modifiedCount > 0) {
            console.log(`[AUTO-COMPLETE] ${completedResult.modifiedCount} confirmed → completed`);
        }
        if (cancelledResult.modifiedCount > 0) {
            console.log(`[AUTO-COMPLETE] ${cancelledResult.modifiedCount} pending → cancelled (expired)`);
        }

        return {
            completed: completedResult.modifiedCount,
            cancelled: cancelledResult.modifiedCount,
        };
    } catch (err) {
        console.error('[AUTO-COMPLETE] Error:', err);
        lastRunAt = 0; // reset on error so next request retries
        return { completed: 0, cancelled: 0 };
    }
}

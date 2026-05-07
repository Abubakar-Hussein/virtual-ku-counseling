import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
    /** Maximum number of requests allowed within the window */
    limit: number;
    /** Rolling time window in milliseconds */
    windowMs: number;
}

interface Record {
    count: number;
    resetAt: number;
}

/**
 * Creates a rate limiter using an in-memory sliding window.
 *
 * Usage:
 *   const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
 *   const limited = limiter(req);
 *   if (limited) return limited; // returns a 429 NextResponse
 */
export function createRateLimiter({ limit, windowMs }: RateLimitOptions) {
    const store = new Map<string, Record>();

    // Periodically clean up stale keys to prevent unbounded memory growth
    // Only set the interval on the server side
    if (typeof setInterval !== 'undefined') {
        setInterval(() => {
            const now = Date.now();
            store.forEach((record, key) => {
                if (record.resetAt < now) store.delete(key);
            });
        }, windowMs * 2);
    }

    return function rateLimit(req: NextRequest): NextResponse | null {
        // Prefer the real client IP forwarded by Vercel/proxies
        const ip =
            req.headers.get('x-real-ip') ||
            req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            '127.0.0.1';

        const now = Date.now();
        const record = store.get(ip);

        if (!record || record.resetAt < now) {
            // First request in this window (or window has expired)
            store.set(ip, { count: 1, resetAt: now + windowMs });
            return null;
        }

        if (record.count >= limit) {
            const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
            return NextResponse.json(
                {
                    error: 'Too many requests. Please wait a moment before trying again.',
                    retryAfter: retryAfterSeconds,
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfterSeconds),
                        'X-RateLimit-Limit': String(limit),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
                    },
                }
            );
        }

        record.count += 1;
        return null;
    };
}

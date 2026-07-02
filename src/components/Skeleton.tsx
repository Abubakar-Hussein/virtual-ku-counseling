'use client';

/**
 * Skeleton loading placeholder with shimmer animation.
 * Use to replace content while data is being fetched.
 */
export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}: {
    width?: string | number;
    height?: string | number;
    borderRadius?: number;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className="skeleton-shimmer"
            style={{
                width,
                height,
                borderRadius,
                background: 'var(--skeleton-bg, rgba(255,255,255,0.06))',
                position: 'relative',
                overflow: 'hidden',
                ...style,
            }}
        />
    );
}

/** Skeleton that mimics a StatsCard layout */
export function StatsCardSkeleton() {
    return (
        <div className="glass" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width="40%" height={32} />
            <Skeleton width="60%" height={16} />
        </div>
    );
}

/** Skeleton that mimics an AppointmentCard layout */
export function AppointmentCardSkeleton() {
    return (
        <div
            className="glass"
            style={{
                padding: '20px 24px',
                borderRadius: 14,
                borderLeft: '3px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={14} />
                </div>
                <Skeleton width={80} height={24} borderRadius={20} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <Skeleton width={100} height={24} borderRadius={20} />
                <Skeleton width={120} height={24} borderRadius={20} />
            </div>
            <Skeleton width="100%" height={1} borderRadius={0} />
            <Skeleton width="85%" height={14} />
        </div>
    );
}

/** Skeleton that mimics a table row */
export function TableRowSkeleton({ columns = 3 }: { columns?: number }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} style={{ padding: '12px 8px' }}>
                    <Skeleton width={i === 0 ? '80%' : '60%'} height={16} />
                </td>
            ))}
        </tr>
    );
}

/** Renders multiple skeletons for a dashboard page */
export function DashboardSkeleton({ hideStats = false }: { hideStats?: boolean }) {
    return (
        <>
            {/* Stats row — omitted when stats are already rendered */}
            {!hideStats && (
                <section className="stats-grid">
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                </section>
            )}

            {/* Content area */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                <Skeleton width="30%" height={22} style={{ marginBottom: 4 }} />
                <AppointmentCardSkeleton />
                <AppointmentCardSkeleton />
                <AppointmentCardSkeleton />
            </section>
        </>
    );
}

/** Skeleton for counselor grid cards */
export function CounselorCardSkeleton() {
    return (
        <div className="glass" style={{ padding: 24, borderRadius: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                <Skeleton width={80} height={80} borderRadius={40} />
                <div style={{ width: '100%' }}>
                    <Skeleton width="70%" height={20} style={{ margin: '0 auto 8px' }} />
                    <Skeleton width="40%" height={14} style={{ margin: '0 auto' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <Skeleton width={80} height={24} borderRadius={20} />
                    <Skeleton width={80} height={24} borderRadius={20} />
                </div>
                <Skeleton width="100%" height={60} borderRadius={12} />
                <Skeleton width="100%" height={44} borderRadius={12} />
            </div>
        </div>
    );
}


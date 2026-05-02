'use client';

/**
 * Reusable search bar + status filter pills for list pages.
 */
export default function SearchFilter({
    searchValue,
    onSearchChange,
    statusFilter,
    onStatusChange,
    dateFilter,
    onDateChange,
    statuses = ['all', 'pending', 'confirmed', 'completed', 'cancelled'],
    searchPlaceholder = 'Search...',
}: {
    searchValue: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusChange: (val: string) => void;
    dateFilter?: string;
    onDateChange?: (val: string) => void;
    statuses?: string[];
    searchPlaceholder?: string;
}) {
    const statusColors: Record<string, { bg: string; border: string; color: string }> = {
        all: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' },
        pending: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', color: '#facc15' },
        confirmed: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#4ade80' },
        completed: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#a5b4fc' },
        cancelled: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#f87171' },
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', maxWidth: 400 }}>
                <span style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    pointerEvents: 'none',
                }}>
                    🔍
                </span>
                <input
                    type="text"
                    className="form-input"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={e => onSearchChange(e.target.value)}
                    style={{ paddingLeft: 40, fontSize: '0.875rem' }}
                />
            </div>
            
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Date Filter */}
                {onDateChange && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date:</span>
                        <input
                            type="date"
                            className="form-input"
                            value={dateFilter || ''}
                            onChange={e => onDateChange(e.target.value)}
                            style={{ padding: '6px 12px', fontSize: '0.875rem', width: 'auto', background: 'var(--bg-card)' }}
                        />
                        {dateFilter && (
                            <button 
                                onClick={() => onDateChange('')}
                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Status Pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {statuses.map(status => {
                    const active = statusFilter === status;
                    const colors = statusColors[status] || statusColors.all;
                    return (
                        <button
                            key={status}
                            onClick={() => onStatusChange(status)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: 20,
                                border: `1px solid ${active ? colors.border : 'var(--border)'}`,
                                background: active ? colors.bg : 'transparent',
                                color: active ? colors.color : 'var(--text-muted)',
                                fontSize: '0.78rem',
                                fontWeight: active ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'capitalize',
                            }}
                        >
                            {status}
                        </button>
                    );
                })}
                </div>
            </div>
        </div>
    );
}

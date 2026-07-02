'use client';
import { Search, X } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; bg: string; border: string; color: string; activeBg: string }> = {
    all:       { label: 'All',       bg: 'var(--bg-card)',              border: 'var(--border)',                    color: 'var(--text-secondary)', activeBg: 'var(--ku-green)' },
    pending:   { label: 'Pending',   bg: 'rgba(245,158,11,0.07)',       border: 'rgba(245,158,11,0.2)',             color: '#b45309',               activeBg: '#b45309' },
    confirmed: { label: 'Confirmed', bg: 'rgba(50,83,67,0.07)',         border: 'rgba(50,83,67,0.2)',               color: 'var(--ku-green)',        activeBg: 'var(--ku-green)' },
    completed: { label: 'Completed', bg: 'rgba(50,83,67,0.07)',         border: 'rgba(50,83,67,0.2)',               color: 'var(--ku-green)',        activeBg: 'var(--ku-green)' },
    cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.07)',        border: 'rgba(239,68,68,0.2)',              color: '#dc2626',               activeBg: '#dc2626' },
};

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
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {/* Search bar */}
            <div style={{ position: 'relative', maxWidth: 480 }}>
                <Search size={15} strokeWidth={2.2} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={e => onSearchChange(e.target.value)}
                    style={{
                        width: '100%', paddingLeft: 42, paddingRight: searchValue ? 36 : 16,
                        paddingTop: 11, paddingBottom: 11,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 12, fontSize: '0.875rem', color: 'var(--text-primary)',
                        outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(50,83,67,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
                {searchValue && (
                    <button onClick={() => onSearchChange('')} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', display: 'flex', padding: 2,
                    }}>
                        <X size={14} strokeWidth={2.5} />
                    </button>
                )}
            </div>

            {/* Status pills + date */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {statuses.map(status => {
                    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.all;
                    const active = statusFilter === status;
                    return (
                        <button
                            key={status}
                            onClick={() => onStatusChange(status)}
                            style={{
                                padding: '7px 16px', borderRadius: 20, fontSize: '0.8rem',
                                fontWeight: active ? 700 : 500, cursor: 'pointer',
                                transition: 'all 0.18s',
                                background: active ? cfg.activeBg : 'var(--bg-card)',
                                color: active ? '#fff' : cfg.color,
                                border: active ? `1px solid ${cfg.activeBg}` : `1px solid var(--border)`,
                                boxShadow: active ? '0 2px 8px rgba(50,83,67,0.15)' : 'none',
                            }}
                        >
                            {cfg.label}
                        </button>
                    );
                })}

                {onDateChange && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Date:</span>
                        <input
                            type="date"
                            value={dateFilter || ''}
                            onChange={e => onDateChange(e.target.value)}
                            style={{
                                padding: '6px 10px', fontSize: '0.8rem', borderRadius: 10,
                                border: '1px solid var(--border)', background: 'var(--bg-card)',
                                color: 'var(--text-primary)', outline: 'none',
                            }}
                        />
                        {dateFilter && (
                            <button onClick={() => onDateChange('')} style={{
                                background: 'none', border: 'none', color: '#dc2626',
                                cursor: 'pointer', fontSize: '0.78rem',
                            }}>Clear</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import Avatar from '@/components/Avatar';
import { useSession } from 'next-auth/react';

export default function SessionRecordsPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [progressFilter, setProgressFilter] = useState('all');

    useEffect(() => {
        async function fetchRecords() {
            try {
                const res = await fetch('/api/counselors/records');
                const data = await res.json();
                if (Array.isArray(data)) setRecords(data);
            } catch (err) {
                console.error(err);
                showToast('Failed to load session records', 'error');
            } finally {
                setLoading(false);
            }
        }
        fetchRecords();
    }, []);

    const filtered = records.filter(r => {
        const matchesProgress = progressFilter === 'all' || r.progressIndicator === progressFilter;
        const matchesSearch = !search ||
            (r.studentId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.notes || '').toLowerCase().includes(search.toLowerCase());
        return matchesProgress && matchesSearch;
    });

    const progressOptions = ['all', 'Improved', 'Stable', 'Declined', 'Not Evaluated'];

    const progressColor: Record<string, string> = {
        'Improved': '#4ade80',
        'Stable': '#60a5fa',
        'Declined': '#f87171',
        'Not Evaluated': 'var(--text-muted)',
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Session Records</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                            Clinical notes and session summaries for your students.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Summary Stats */}
                {!loading && records.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                        {[
                            { label: 'Total Records', value: records.length, color: '#60a5fa' },
                            { label: 'Improved', value: records.filter(r => r.progressIndicator === 'Improved').length, color: '#4ade80' },
                            { label: 'Stable', value: records.filter(r => r.progressIndicator === 'Stable').length, color: '#94a3b8' },
                            { label: 'Declined', value: records.filter(r => r.progressIndicator === 'Declined').length, color: '#f87171' },
                        ].map(stat => (
                            <div key={stat.label} className="glass" style={{ padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color }}>{stat.value}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by student name or notes..."
                        style={{
                            flex: 1,
                            minWidth: 220,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '9px 14px',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            outline: 'none',
                        }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                        {progressOptions.map(p => (
                            <button
                                key={p}
                                onClick={() => setProgressFilter(p)}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: 20,
                                    border: `1px solid ${progressFilter === p ? (progressColor[p] || 'var(--ku-green-light)') : 'var(--border)'}`,
                                    background: progressFilter === p ? `${progressColor[p] || 'var(--ku-green-light)'}22` : 'transparent',
                                    color: progressFilter === p ? (progressColor[p] || 'var(--ku-green-light)') : 'var(--text-muted)',
                                    fontSize: '0.78rem',
                                    fontWeight: progressFilter === p ? 700 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {p === 'all' ? 'All Progress' : p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Records Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="glass skeleton" style={{ height: 200, borderRadius: 14 }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="📁"
                        title="No session records found"
                        description={search || progressFilter !== 'all'
                            ? 'No records match your current filters.'
                            : 'You have not recorded any clinical session notes yet. Notes appear here after you save them from the Clinical Workspace.'}
                    />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                        {filtered.map(record => {
                            const color = progressColor[record.progressIndicator] || 'var(--text-muted)';
                            return (
                                <div
                                    key={record._id}
                                    className="glass"
                                    style={{
                                        padding: 24,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 14,
                                        borderLeft: `3px solid ${color}`,
                                        borderRadius: 14,
                                    }}
                                >
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Avatar name={record.studentId?.name || '?'} src={record.studentId?.profileImage} size={36} fontSize="0.8rem" />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                    {record.studentId?.name || 'Unknown Student'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {new Date(record.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '3px 10px',
                                            borderRadius: 20,
                                            background: `${color}22`,
                                            color,
                                            border: `1px solid ${color}44`,
                                        }}>
                                            {record.progressIndicator}
                                        </span>
                                    </div>

                                    {/* Notes */}
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Session Notes</strong>
                                        <p style={{ marginTop: 4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {record.notes || 'No notes recorded.'}
                                        </p>
                                    </div>

                                    {/* Action Items */}
                                    {record.actionItems && (
                                        <div style={{ fontSize: '0.875rem', color: 'var(--ku-gold)', lineHeight: 1.5 }}>
                                            <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action Items</strong>
                                            <p style={{ marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {record.actionItems}
                                            </p>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {record.studentId?.email || ''}
                                        </span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <a
                                                href={`/counselor/appointments/${record.appointmentId}`}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '5px 10px',
                                                    borderRadius: 8,
                                                    border: '1px solid var(--ku-green-light)',
                                                    color: 'var(--ku-green-light)',
                                                    textDecoration: 'none',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                Open Workspace
                                            </a>
                                            <a
                                                href={`https://mail.google.com/mail/?view=cm&to=${record.studentId?.email}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-secondary"
                                                style={{ fontSize: '0.75rem', padding: '5px 10px', textDecoration: 'none' }}
                                            >
                                                📧
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import NotificationBell from '@/components/NotificationBell';
import { StatsCardSkeleton, TableRowSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import MiniChart from '@/components/MiniChart';
import Avatar from '@/components/Avatar';

export default function AdminDashboard() {
    const { showToast } = useToast();

    // Phase 1 — fast: summary counts + recent users
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Phase 2 — slow: chart aggregations (loads after paint)
    const [chartData, setChartData] = useState<any>(null);
    const [chartLoading, setChartLoading] = useState(true);

    // Search for users table
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('loggedIn') === 'true') {
                showToast('Log in successful', 'success');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        // ── Phase 1: fast summary + users ────────────────────────────────────
        // Uses ?summary=1 which only runs cheap countDocuments() queries.
        // The dashboard becomes interactive immediately after this resolves.
        async function fetchFast() {
            try {
                const [uRes, sRes] = await Promise.all([
                    fetch('/api/admin/users?limit=8', { cache: 'no-store' }),
                    fetch('/api/admin/stats?summary=1', { cache: 'no-store' }),
                ]);
                const uData = await uRes.json();
                const sData = await sRes.json();
                setUsers(Array.isArray(uData) ? uData : []);
                setStats(sData);
            } catch (err) {
                console.error(err);
                showToast('Failed to load dashboard data', 'error');
            } finally {
                setLoading(false);
            }
        }

        // ── Phase 2: heavy chart aggregations ────────────────────────────────
        // Runs after Phase 1 resolves so it never blocks the initial paint.
        async function fetchCharts() {
            try {
                const res = await fetch('/api/admin/stats?charts=1', { cache: 'no-store' });
                const data = await res.json();
                setChartData(data);
            } catch (err) {
                console.error('[CHART LOAD]', err);
            } finally {
                setChartLoading(false);
            }
        }

        fetchFast().then(() => fetchCharts());
    }, []);

    // Filtered users for table
    const filteredUsers = users.filter(u =>
        !userSearch ||
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(userSearch.toLowerCase())
    );

    // Appointment distribution — from chart data (phase 2)
    const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    if (chartData?.statusDistribution) {
        for (const s of chartData.statusDistribution) {
            if (s._id in statusCounts) (statusCounts as any)[s._id] = s.count;
        }
    }
    const totalAppointments = stats?.summary?.totalAppointments || 0;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>System Administration</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Overview of Kenyatta University counseling ecosystem.</p>
                    </div>
                    <NotificationBell />
                </header>

                {/* ── Stats Cards — visible as soon as Phase 1 resolves ── */}
                {loading ? (
                    <section className="stats-grid">
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </section>
                ) : (
                    <section className="stats-grid">
                        <StatsCard label="Total Students" value={stats?.summary?.totalStudents ?? '—'} icon="" color="#3b82f6" />
                        <StatsCard label="Total Counselors" value={stats?.summary?.totalCounselors ?? '—'} icon="" color="#10b981" />
                        <StatsCard label="No-Show Rate" value={`${stats?.summary?.noShowRate ?? '—'}%`} icon="" color="#f87171" />
                        <StatsCard label="Total Sessions" value={totalAppointments} icon="" color="var(--ku-gold)" />
                    </section>
                )}

                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>

                    {/* ── Recent Users Table ── */}
                    <section className="glass" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent User Signups</h2>
                        </div>
                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <span style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none',
                            }}></span>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                style={{ paddingLeft: 36, fontSize: '0.82rem' }}
                            />
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '12px 8px' }}>Name</th>
                                        <th style={{ padding: '12px 8px' }}>Role</th>
                                        <th style={{ padding: '12px 8px' }}>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <>
                                            <TableRowSkeleton columns={3} />
                                            <TableRowSkeleton columns={3} />
                                            <TableRowSkeleton columns={3} />
                                        </>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <Avatar name={u.name} src={u.profileImage} size={32} fontSize="0.75rem" />
                                                        <div>
                                                            <div style={{ fontWeight: 500 }}>{u.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <span className={`badge ${u.role === 'admin' ? 'spec-career' : u.role === 'counselor' ? 'spec-academic' : ''}`}>{u.role}</span>
                                                </td>
                                                <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>


                    {/* Appointment Distribution — shows skeleton until Phase 2 resolves */}
                    <section className="glass" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Appointment Distribution</h2>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time session status breakdown</p>
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                {totalAppointments}
                            </div>
                        </div>

                        {chartLoading ? (
                            <div style={{ height: 140, borderRadius: 10, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        ) : (
                            <MiniChart
                                data={[
                                    { label: 'Pending', value: statusCounts.pending, color: '#facc15' },
                                    { label: 'Confirmed', value: statusCounts.confirmed, color: '#4ade80' },
                                    { label: 'Completed', value: statusCounts.completed, color: '#a5b4fc' },
                                    { label: 'Cancelled', value: statusCounts.cancelled, color: '#f87171' },
                                ]}
                                height={140}
                            />
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

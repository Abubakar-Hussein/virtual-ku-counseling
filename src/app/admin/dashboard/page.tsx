'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import NotificationBell from '@/components/NotificationBell';
import { StatsCardSkeleton, TableRowSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import MiniChart from '@/components/MiniChart';
import Avatar from '@/components/Avatar';
import { Shield, Search, X } from 'lucide-react';

const ROLE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
    admin:    { bg: 'rgba(239,68,68,0.07)',  color: '#dc2626',        border: 'rgba(239,68,68,0.2)' },
    counselor:{ bg: 'rgba(50,83,67,0.07)',   color: 'var(--ku-green)',border: 'rgba(50,83,67,0.18)' },
    student:  { bg: 'rgba(50,83,67,0.06)',   color: 'var(--ku-green)',border: 'rgba(50,83,67,0.15)' },
};

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

    const filteredUsers = users.filter(u =>
        !userSearch ||
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(userSearch.toLowerCase())
    );

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
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 20, padding: '4px 12px',
                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)',
                            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            <Shield size={12} strokeWidth={2.5} /> System Admin
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Administration
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Overview of the Kenyatta University counseling ecosystem.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {loading ? (
                    <section className="stats-grid">
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </section>
                ) : (
                    <section className="stats-grid">
                        <StatsCard label="Total Students" value={stats?.summary?.totalStudents ?? '—'} icon="" color="var(--ku-green)" />
                        <StatsCard label="Total Counselors" value={stats?.summary?.totalCounselors ?? '—'} icon="" color="var(--ku-green)" />
                        <StatsCard label="No-Show Rate" value={`${stats?.summary?.noShowRate ?? '—'}%`} icon="" color="#dc2626" />
                        <StatsCard label="Total Sessions" value={totalAppointments} icon="" color="#3b82f6" />
                    </section>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32, marginTop: 32 }}>

                    {/* Recent Users Table */}
                    <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Signups</h2>
                        </div>
                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <Search size={14} strokeWidth={2.2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search recent users..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                style={{
                                    width: '100%', paddingLeft: 40, paddingRight: userSearch ? 36 : 14,
                                    paddingTop: 10, paddingBottom: 10, borderRadius: 12,
                                    border: '1px solid var(--border)', background: 'var(--bg-main)',
                                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(50,83,67,0.4)')}
                                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                            />
                            {userSearch && <button onClick={() => setUserSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={14} strokeWidth={2.5} /></button>}
                        </div>
                        
                        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(50,83,67,0.04)', borderBottom: '1px solid var(--border)' }}>
                                        {['Name', 'Role', 'Joined'].map(h => (
                                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ku-green)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <><TableRowSkeleton columns={3} /><TableRowSkeleton columns={3} /><TableRowSkeleton columns={3} /></>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan={3} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No users match your search.</td></tr>
                                    ) : (
                                        filteredUsers.map(u => {
                                            const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.student;
                                            return (
                                                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(50,83,67,0.02)'}
                                                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                                                >
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <Avatar name={u.name} src={u.profileImage} size={34} fontSize="0.75rem" />
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{u.name}</div>
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                                                            background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
                                                            textTransform: 'uppercase', letterSpacing: '0.06em',
                                                        }}>{u.role}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                        {new Date(u.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Appointment Distribution */}
                    <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Session Distribution</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Real-time status breakdown</p>
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ku-green)', lineHeight: 1 }}>
                                {totalAppointments}
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            {chartLoading ? (
                                <div style={{ height: 160, borderRadius: 12, background: 'var(--bg-main)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                            ) : (
                                <MiniChart
                                    data={[
                                        { label: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
                                        { label: 'Confirmed', value: statusCounts.confirmed, color: '#22c55e' },
                                        { label: 'Completed', value: statusCounts.completed, color: '#3b82f6' },
                                        { label: 'Cancelled', value: statusCounts.cancelled, color: '#dc2626' },
                                    ]}
                                    height={160}
                                />
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

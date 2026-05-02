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
    const [users, setUsers] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

        async function fetchData() {
            try {
                const [uRes, aRes, sRes] = await Promise.all([
                    fetch('/api/admin/users', { cache: 'no-store' }),
                    fetch('/api/appointments', { cache: 'no-store' }),
                    fetch('/api/admin/stats', { cache: 'no-store' })
                ]);
                const uData = await uRes.json();
                const aData = await aRes.json();
                const sData = await sRes.json();
                setUsers(uData);
                setAppointments(aData);
                setStats(sData);
            } catch (err) {
                console.error(err);
                showToast('Failed to load dashboard data', 'error');
            }
            finally { setLoading(false); }
        }
        fetchData();
    }, []);

    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalCounselors = users.filter(u => u.role === 'counselor').length;
    const pendingApps = appointments.filter(a => a.status === 'pending').length;

    // Filtered users for table
    const filteredUsers = users.filter(u =>
        !userSearch ||
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(userSearch.toLowerCase())
    );

    // Appointment distribution for mini chart
    const statusCounts = {
        pending: appointments.filter(a => a.status === 'pending').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };
    const total = appointments.length || 1;

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

                {loading ? (
                    <>
                        <section className="stats-grid">
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                        </section>
                    </>
                ) : (
                    <section className="stats-grid">
                        <StatsCard label="Lead Time" value={`${stats?.summary?.avgLeadTime || 0}d`} icon="⏳" color="#facc15" />
                        <StatsCard label="Clinical Reach" value={`${stats?.summary?.studentReach || 0}%`} icon="🎯" color="#3b82f6" />
                        <StatsCard label="No-Show Rate" value={`${stats?.summary?.noShowRate || 0}%`} icon="🚫" color="#f87171" />
                        <StatsCard label="Total Sessions" value={stats?.summary?.totalAppointments || 0} icon="📊" color="var(--ku-gold)" />
                    </section>
                )}

                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>
                    {/* Recent Users Table */}
                    <section className="glass" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent User Signups</h2>
                        </div>
                        {/* User search */}
                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <span style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none',
                            }}>🔍</span>
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
                                        filteredUsers.slice(-8).reverse().map(u => (
                                            <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <Avatar 
                                                            name={u.name} 
                                                            src={u.profileImage} 
                                                            size={32} 
                                                            fontSize="0.75rem" 
                                                        />
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

                    {/* System Health + Appointment Distribution */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <section className="glass" style={{ padding: 24 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>System Health</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[
                                    { label: 'Database Status', val: 'Healthy', color: '#22c55e' },
                                    { label: 'Cloud Storage', val: 'Connected', color: '#22c55e' },
                                    { label: 'SMTP Services', val: 'Inactive (Dev)', color: '#facc15' },
                                    { label: 'System Uptime', val: '99.9%', color: '#22c55e' }
                                ].map((s, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: s.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: s.color, display: 'inline-block',
                                                boxShadow: `0 0 8px ${s.color}`,
                                            }} />
                                            {s.val}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Appointment Distribution */}
                        {!loading && (
                            <section className="glass" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Appointment Distribution</h2>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time session status breakdown</p>
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                        {appointments.length}
                                    </div>
                                </div>
                                
                                <MiniChart 
                                    data={[
                                        { label: 'Pending', value: statusCounts.pending, color: '#facc15' },
                                        { label: 'Confirmed', value: statusCounts.confirmed, color: '#4ade80' },
                                        { label: 'Completed', value: statusCounts.completed, color: '#a5b4fc' },
                                        { label: 'Cancelled', value: statusCounts.cancelled, color: '#f87171' },
                                    ]}
                                    height={140}
                                />
                            </section>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

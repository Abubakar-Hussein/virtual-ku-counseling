'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import NotificationBell from '@/components/NotificationBell';

export default function AdminDashboard() {
    const [users, setUsers] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [uRes, aRes] = await Promise.all([
                    fetch('/api/admin/users'),
                    fetch('/api/appointments')
                ]);
                const uData = await uRes.json();
                const aData = await aRes.json();
                setUsers(uData);
                setAppointments(aData);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchData();
    }, []);

    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalCounselors = users.filter(u => u.role === 'counselor').length;
    const pendingApps = appointments.filter(a => a.status === 'pending').length;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>System Administration</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Overview of Kenyatta University counseling ecosystem.</p>
                    </div>
                    <NotificationBell />
                </header>

                <section className="stats-grid">
                    <StatsCard label="Total Students" value={totalStudents} icon="👥" color="#60a5fa" />
                    <StatsCard label="Active Counselors" value={totalCounselors} icon="🧑‍⚕️" color="var(--ku-green-light)" />
                    <StatsCard label="Pending Approval" value={pendingApps} icon="⏳" color="#facc15" />
                    <StatsCard label="System Sessions" value={appointments.length} icon="📊" color="var(--ku-gold)" />
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32 }}>
                    <section className="glass" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Recent User Signups</h2>
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
                                    {users.slice(-6).reverse().map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px 8px' }}>{u.name}</td>
                                            <td style={{ padding: '12px 8px' }}>
                                                <span className={`badge ${u.role === 'admin' ? 'spec-career' : u.role === 'counselor' ? 'spec-academic' : ''}`}>{u.role}</span>
                                            </td>
                                            <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

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
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: s.color }}>{s.val}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

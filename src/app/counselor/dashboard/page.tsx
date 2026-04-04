'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import AppointmentCard from '@/components/AppointmentCard';
import NotificationBell from '@/components/NotificationBell';

export default function CounselorDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({ today: 0, pending: 0, total: 0 });
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/appointments');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAppointments(data);
                    const today = data.filter(a => {
                        const d = new Date(a.date);
                        const now = new Date();
                        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && a.status === 'confirmed';
                    }).length;
                    const pending = data.filter(a => a.status === 'pending').length;
                    setStats({ today, pending, total: data.length });
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchData();
    }, []);

    const handleStatusChange = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
                // Update stats
                const pending = appointments.filter(a => a._id === id ? status === 'pending' : a.status === 'pending').length;
                setStats(s => ({ ...s, pending }));
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Counselor Portal</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {session?.user?.name}. Manage your sessions and student impact.</p>
                    </div>
                    <NotificationBell />
                </header>

                <section className="stats-grid">
                    <StatsCard label="Confirmed for Today" value={stats.today} icon="📅" color="var(--ku-green-light)" />
                    <StatsCard label="Pending Requests" value={stats.pending} icon="🔔" color="#facc15" />
                    <StatsCard label="Total Lifetime Sessions" value={stats.total} icon="📈" color="#60a5fa" />
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>Recent Activity</h2>
                        {loading ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Loading appointments...</div>
                        ) : appointments.length === 0 ? (
                            <div className="glass" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                                You have no counseling records yet.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {appointments.slice(0, 10).map(appt => (
                                    <AppointmentCard
                                        key={appt._id}
                                        appointment={appt}
                                        viewerRole="counselor"
                                        onStatusChange={handleStatusChange}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>System Notices</h2>
                        <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, color: 'var(--ku-gold)' }}>⚠️ Exam Period Approaching</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    Expected surge in academic session requests. Please ensure your schedule is up to date.
                                </div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, color: 'var(--text-secondary)' }}>🔒 Private Notes</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    All session notes are encrypted and shielded from students. Only you can view your assigned patient history.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

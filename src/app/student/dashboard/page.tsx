'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import AppointmentCard from '@/components/AppointmentCard';
import NotificationBell from '@/components/NotificationBell';
import Link from 'next/link';

export default function StudentDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({ upcoming: 0, pending: 0, past: 0 });
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/appointments');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAppointments(data);
                    const upcoming = data.filter(a => a.status === 'confirmed').length;
                    const pending = data.filter(a => a.status === 'pending').length;
                    const past = data.filter(a => a.status === 'completed').length;
                    setStats({ upcoming, pending, past });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Welcome back, {session?.user?.name}!</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage your counseling sessions and mental health progress.</p>
                    </div>
                    <NotificationBell />
                </header>

                <section className="stats-grid">
                    <StatsCard label="Confirmed Sessions" value={stats.upcoming} icon="📅" color="var(--ku-green-light)" />
                    <StatsCard label="Pending Requests" value={stats.pending} icon="⏳" color="#facc15" />
                    <StatsCard label="Past Sessions" value={stats.past} icon="✅" color="#60a5fa" />
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Upcoming Appointments</h2>
                            <Link href="/student/counselors" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.85rem' }}>
                                + Book New
                            </Link>
                        </div>

                        {loading ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Loading appointments...</div>
                        ) : appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length === 0 ? (
                            <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🏜️</div>
                                <p>You have no upcoming appointments.</p>
                                <Link href="/student/counselors" style={{ color: 'var(--ku-green-light)', display: 'block', marginTop: 12, fontWeight: 600 }}>Find a counselor to get started</Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {appointments
                                    .filter(a => a.status !== 'completed' && a.status !== 'cancelled')
                                    .slice(0, 5)
                                    .map(appt => (
                                        <AppointmentCard
                                            key={appt._id}
                                            appointment={appt}
                                            viewerRole="student"
                                            onCancel={handleCancel}
                                        />
                                    ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>Health Tips</h2>
                        <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {[
                                { title: 'The 5-4-3-2-1 Rule', desc: 'A grounding technique to help when you are feeling overwhelmed.' },
                                { title: 'Sleep Hygiene', desc: 'Try to maintain a consistent sleep schedule even during exams.' },
                                { title: 'Stay Hydrated', desc: 'Physical health directly impacts your mental clarity.' }
                            ].map((tip, i) => (
                                <div key={i} style={{ borderBottom: i === 2 ? '' : '1px solid var(--border)', paddingBottom: i === 2 ? 0 : 16 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, color: 'var(--ku-green-light)' }}>{tip.title}</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{tip.desc}</div>
                                </div>
                            ))}
                            <Link href="#" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', textDecoration: 'none' }}>View more resources →</Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

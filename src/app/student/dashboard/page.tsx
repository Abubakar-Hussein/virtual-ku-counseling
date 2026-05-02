'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import AppointmentCard from '@/components/AppointmentCard';
import NotificationBell from '@/components/NotificationBell';
import { DashboardSkeleton } from '@/components/Skeleton';
import ConfirmModal from '@/components/ConfirmModal';
import SearchFilter from '@/components/SearchFilter';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';

export default function StudentDashboard() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [stats, setStats] = useState({ upcoming: 0, pending: 0, past: 0 });
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & filter state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Confirm modal state
    const [cancelTarget, setCancelTarget] = useState<string | null>(null);

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
                showToast('Failed to load appointments', 'error');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleCancel = async (id: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
                showToast('Appointment cancelled successfully', 'success');
            } else {
                showToast('Failed to cancel appointment', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred while cancelling', 'error');
        }
        setCancelTarget(null);
    };

    // Filtered appointments
    const filtered = appointments.filter(a => {
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchesSearch = !search ||
            (a.counselorId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.reason || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.specialization || '').toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const activeAppointments = filtered.filter(a => a.status !== 'completed' && a.status !== 'cancelled');

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Avatar name={session?.user?.name || 'User'} src={(session?.user as any)?.profileImage} size={56} fontSize="1.2rem" />
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 }}>Welcome back, {session?.user?.name}!</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>Manage your counseling sessions and mental health progress.</p>
                        </div>
                    </div>
                    <NotificationBell />
                </header>

                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        <section className="stats-grid">
                            <StatsCard label="Confirmed Sessions" value={stats.upcoming} icon="📅" color="var(--ku-green-light)" />
                            <StatsCard label="Pending Requests" value={stats.pending} icon="⏳" color="#facc15" />
                            <StatsCard label="Past Sessions" value={stats.past} icon="✅" color="#60a5fa" />
                        </section>

                        <section className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Upcoming Appointments</h2>
                                    <Link href="/student/counselors" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.85rem' }}>
                                        + Book New
                                    </Link>
                                </div>

                                <SearchFilter
                                    searchValue={search}
                                    onSearchChange={setSearch}
                                    statusFilter={statusFilter}
                                    onStatusChange={setStatusFilter}
                                    searchPlaceholder="Search by counselor, reason..."
                                />

                                {activeAppointments.length === 0 ? (
                                    <EmptyState 
                                        icon="🏝️"
                                        title={statusFilter !== 'all' ? "No sessions found" : "All caught up!"}
                                        description={statusFilter !== 'all' 
                                            ? `We couldn't find any ${statusFilter} appointments matching your filters.` 
                                            : "You don't have any upcoming appointments. Taking regular time to talk can help maintain your mental wellness."}
                                        actionLabel={statusFilter === 'all' && search === '' ? "Book a Session" : undefined}
                                        actionHref="/student/counselors"
                                    />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {activeAppointments
                                            .slice(0, 10)
                                            .map(appt => (
                                                <AppointmentCard
                                                    key={appt._id}
                                                    appointment={appt}
                                                    viewerRole="student"
                                                    onCancel={(id) => setCancelTarget(id)}
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
                    </>
                )}
            </main>

            {/* Confirm cancel modal */}
            <ConfirmModal
                open={!!cancelTarget}
                title="Cancel Appointment?"
                message="This will cancel your appointment request. You can always book a new session later."
                confirmLabel="Yes, Cancel"
                cancelLabel="Keep It"
                variant="danger"
                onConfirm={() => cancelTarget && handleCancel(cancelTarget)}
                onCancel={() => setCancelTarget(null)}
            />
        </div>
    );
}

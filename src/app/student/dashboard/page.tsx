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
import { LayoutDashboard, Sparkles } from 'lucide-react';

export default function StudentDashboard() {
    const { data: session } = useSession();
    const { showToast } = useToast();

    // Stats load independently and fast (no joins)
    const [stats, setStats] = useState({ upcoming: 0, pending: 0, past: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    // Appointments list loads separately (heavy aggregation)
    const [appointments, setAppointments] = useState<any[]>([]);
    const [completed, setCompleted] = useState<any[]>([]);
    const [apptLoading, setApptLoading] = useState(true);

    // Search & filter state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Confirm modal state
    const [cancelTarget, setCancelTarget] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('loggedIn') === 'true') {
                showToast('Log in successful', 'success');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            if (params.get('booked') === 'success') {
                showToast('Appointment booked successfully! Waiting for counselor confirmation.', 'success');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        async function fetchStats() {
            try {
                const res = await fetch('/api/appointments/stats');
                const data = await res.json();
                if (data && !data.error) {
                    setStats({ upcoming: data.upcoming, pending: data.pending, past: data.past });
                }
            } catch (err) {
                console.error('[STATS]', err);
            } finally {
                setStatsLoading(false);
            }
        }

        async function fetchAppointments() {
            try {
                const [activeRes, completedRes] = await Promise.all([
                    fetch('/api/appointments?status=active'),
                    fetch('/api/appointments?status=completed&limit=10'),
                ]);
                const activeData = await activeRes.json();
                const completedData = await completedRes.json();
                if (Array.isArray(activeData)) setAppointments(activeData);
                if (Array.isArray(completedData)) {
                    const unrated = completedData.filter((a: any) => !a.rating);
                    const rated   = completedData.filter((a: any) =>  a.rating);
                    setCompleted([...unrated, ...rated].slice(0, 5));
                }
            } catch (err) {
                console.error('[APPOINTMENTS]', err);
                showToast('Failed to load appointments', 'error');
            } finally {
                setApptLoading(false);
            }
        }

        Promise.all([fetchStats(), fetchAppointments()]);
    }, []);

    const handleCancel = async (id: string) => {
        if (cancelling) return;
        setCancelling(true);
        try {
            const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
                setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
                showToast('Appointment cancelled successfully', 'success');
                setCancelTarget(null);
            } else {
                const body = await res.json().catch(() => ({}));
                showToast(body?.error || 'Failed to cancel appointment', 'error');
            }
        } catch (err) {
            console.error('[CANCEL]', err);
            showToast('Network error. Please try again.', 'error');
        } finally {
            setCancelling(false);
        }
    };

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
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <Avatar name={session?.user?.name || 'User'} src={(session?.user as any)?.profileImage} size={64} fontSize="1.4rem" />
                        <div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                                borderRadius: 20, padding: '4px 12px',
                                fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)',
                                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8,
                            }}>
                                <LayoutDashboard size={12} strokeWidth={2.5} /> Student Portal
                            </div>
                            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                Welcome back, {session?.user?.name?.split(' ')[0]}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Manage your counseling sessions and mental health progress.
                            </p>
                        </div>
                    </div>
                    <NotificationBell />
                </header>

                <section className="stats-grid">
                    {statsLoading ? (
                        <>
                            <div className="glass skeleton" style={{ height: 100, borderRadius: 16 }} />
                            <div className="glass skeleton" style={{ height: 100, borderRadius: 16 }} />
                            <div className="glass skeleton" style={{ height: 100, borderRadius: 16 }} />
                        </>
                    ) : (
                        <>
                            <StatsCard label="Confirmed Sessions" value={stats.upcoming} icon="" color="var(--ku-green)" />
                            <StatsCard label="Pending Requests" value={stats.pending} icon="" color="#f59e0b" />
                            <StatsCard label="Past Sessions" value={stats.past} icon="" color="#3b82f6" />
                        </>
                    )}
                </section>

                {apptLoading ? (
                    <DashboardSkeleton hideStats />
                ) : (
                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32, marginTop: 32 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Upcoming Appointments</h2>
                                <Link href="/student/counselors" style={{
                                    textDecoration: 'none', padding: '8px 16px', fontSize: '0.85rem',
                                    background: 'var(--ku-green)', color: '#fff', borderRadius: 10, fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(50,83,67,0.2)'
                                }}>
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
                                    icon=""
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

                            {completed.length > 0 && (
                                <>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '32px 0 16px', color: 'var(--text-secondary)' }}>Past Sessions</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {completed.map(appt => (
                                            <AppointmentCard
                                                key={appt._id}
                                                appointment={appt}
                                                viewerRole="student"
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Health Tips</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[
                                    { title: 'The 5-4-3-2-1 Rule', desc: 'A grounding technique to help when you are feeling overwhelmed. Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.' },
                                    { title: 'Sleep Hygiene', desc: 'Try to maintain a consistent sleep schedule even during exams. Turn off screens an hour before bed.' },
                                    { title: 'Stay Hydrated', desc: 'Physical health directly impacts your mental clarity. Keep a water bottle handy while studying.' }
                                ].map((tip, i) => (
                                    <div key={i} style={{
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        borderRadius: 14, padding: '16px 20px', borderLeft: '3px solid var(--ku-green)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--ku-green)' }}>
                                            <Sparkles size={16} strokeWidth={2.5} />
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tip.title}</div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            {tip.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

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

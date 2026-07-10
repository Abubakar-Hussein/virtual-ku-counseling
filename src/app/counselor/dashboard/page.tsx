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
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { Star, LayoutDashboard, Info, Lock } from 'lucide-react';

export default function CounselorDashboard() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [stats, setStats] = useState({ today: 0, pending: 0, total: 0 });
    const [rating, setRating] = useState<{ avg: number; total: number } | null>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [apptLoading, setApptLoading] = useState(true);
    const [ratingLoading, setRatingLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modalAction, setModalAction] = useState<{ id: string; status: string } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('loggedIn') === 'true') {
                showToast('Log in successful', 'success');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        async function fetchAppointments() {
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
            } catch (err) {
                console.error(err);
                showToast('Failed to load appointments', 'error');
            } finally {
                setApptLoading(false);
            }
        }

        async function fetchProfile() {
            try {
                const profileRes = await fetch('/api/profile');
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    const avg = profileData.profile?.averageRating ?? 0;
                    const total = profileData.profile?.totalRatings ?? 0;
                    if (total > 0) setRating({ avg, total });
                }
            } catch (err) {
                console.error('[PROFILE]', err);
            } finally {
                setRatingLoading(false);
            }
        }

        Promise.all([fetchAppointments(), fetchProfile()]);
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
                const labels: Record<string, string> = { confirmed: 'accepted', cancelled: 'declined', completed: 'marked as completed' };
                showToast(`Appointment ${labels[status] || 'updated'} successfully`, 'success');
                const updated = appointments.map(a => a._id === id ? { ...a, status } : a);
                const pending = updated.filter(a => a.status === 'pending').length;
                setStats(s => ({ ...s, pending }));
            } else {
                showToast('Failed to update appointment', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        }
        setModalAction(null);
    };

    const filtered = appointments.filter(a => {
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchesSearch = !search ||
            (a.studentId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.reason || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.specialization || '').toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getModalConfig = () => {
        if (!modalAction) return { title: '', message: '', variant: 'primary' as const, confirmLabel: '' };
        if (modalAction.status === 'confirmed') return {
            title: 'Accept Appointment?',
            message: 'This will confirm the session and notify the student.',
            variant: 'primary' as const,
            confirmLabel: 'Accept',
        };
        if (modalAction.status === 'cancelled') return {
            title: 'Decline Appointment?',
            message: 'This will decline the request and notify the student.',
            variant: 'danger' as const,
            confirmLabel: 'Decline',
        };
        return {
            title: 'Mark as Completed?',
            message: 'This will mark the session as completed.',
            variant: 'primary' as const,
            confirmLabel: 'Complete',
        };
    };

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
                                <LayoutDashboard size={12} strokeWidth={2.5} /> Counselor Portal
                            </div>
                            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                Welcome back, {session?.user?.name?.split(' ')[0]}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Manage your sessions and student impact.
                            </p>
                        </div>
                    </div>
                    <NotificationBell />
                </header>

                <section className="stats-grid">
                    {apptLoading ? (
                        <>
                            <div className="glass skeleton" style={{ height: 100, borderRadius: 16 }} />
                            <div className="glass skeleton" style={{ height: 100, borderRadius: 16 }} />
                            <div className="glass skeleton" style={{ height: 100, borderRadius: 16 }} />
                            <div className="glass skeleton" style={{ height: 100, borderRadius: 16 }} />
                        </>
                    ) : (
                        <>
                            <StatsCard label="Confirmed for Today" value={stats.today} icon="" color="var(--ku-green)" />
                            <StatsCard label="Pending Requests" value={stats.pending} icon="" color="#f59e0b" />
                            <StatsCard label="Total Lifetime Sessions" value={stats.total} icon="" color="#3b82f6" />
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '20px 24px', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05, transform: 'rotate(15deg)' }}><Star size={100} fill="currentColor" stroke="none" /></div>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}><Star size={20} fill="#f59e0b" stroke="#f59e0b" /></div>
                                {ratingLoading ? (
                                    <>
                                        <div className="skeleton" style={{ height: 32, width: 60, borderRadius: 6 }} />
                                        <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 4 }} />
                                    </>
                                ) : rating ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, zIndex: 1 }}>
                                            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{rating.avg.toFixed(1)}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 5</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 3, zIndex: 1 }}>
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star key={s} size={15} fill={s <= Math.round(rating.avg) ? '#f59e0b' : 'none'} stroke={s <= Math.round(rating.avg) ? '#f59e0b' : 'var(--border)'} />
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', zIndex: 1 }}>Average Rating ({rating.total} review{rating.total !== 1 ? 's' : ''})</div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1 }}>—</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Rating</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No reviews yet</div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </section>

                {apptLoading ? (
                    <DashboardSkeleton hideStats />
                ) : (
                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32, marginTop: 32 }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Recent Activity</h2>

                            <SearchFilter
                                searchValue={search}
                                onSearchChange={setSearch}
                                statusFilter={statusFilter}
                                onStatusChange={setStatusFilter}
                                searchPlaceholder="Search by student, reason..."
                            />

                            {filtered.length === 0 ? (
                                <EmptyState
                                    icon=""
                                    title="No appointments found"
                                    description={statusFilter !== 'all'
                                        ? `We couldn't find any ${statusFilter} appointments matching your filters.`
                                        : "You don't have any counseling records in the system yet. Once students book sessions, they will appear here."}
                                    actionLabel={statusFilter === 'all' && search === '' ? "Update Schedule" : undefined}
                                    actionHref="/counselor/schedule"
                                />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {filtered.slice(0, 10).map(appt => (
                                        <AppointmentCard
                                            key={appt._id}
                                            appointment={appt}
                                            viewerRole="counselor"
                                            onStatusChange={(id, status) => setModalAction({ id, status })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>System Notices</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: 14, padding: '16px 20px', borderLeft: '3px solid var(--ku-green)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--ku-green)' }}>
                                        <Info size={16} strokeWidth={2.5} />
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exam Period Approaching</div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        Expected surge in academic session requests. Please ensure your schedule is up to date to accommodate students.
                                    </div>
                                </div>
                                
                                <div style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: 14, padding: '16px 20px', borderLeft: '3px solid var(--text-muted)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-muted)' }}>
                                        <Lock size={16} strokeWidth={2.5} />
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Private Notes</div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        All session notes are encrypted and shielded from students. Only you can view your assigned patient history.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {modalAction && (
                <ConfirmModal
                    open={!!modalAction}
                    title={getModalConfig().title}
                    message={getModalConfig().message}
                    confirmLabel={getModalConfig().confirmLabel}
                    variant={getModalConfig().variant}
                    onConfirm={() => handleStatusChange(modalAction.id, modalAction.status)}
                    onCancel={() => setModalAction(null)}
                />
            )}
        </div>
    );
}

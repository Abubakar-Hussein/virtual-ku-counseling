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
import { Star, LayoutDashboard, AlertTriangle, TrendingDown, UserX, Clock, ShieldAlert, X } from 'lucide-react';

const SEVERITY_STYLE: Record<string, { border: string; icon: string; bg: string }> = {
    critical: { border: '#ef4444', icon: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
    warning: { border: '#f59e0b', icon: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
    info: { border: '#3b82f6', icon: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
};
const ALERT_ICON: Record<string, any> = {
    low_mood: AlertTriangle, mood_decline: TrendingDown, inactivity: Clock,
    missed_session: UserX, high_urgency: ShieldAlert,
};

function CaseloadAlerts() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Generate alerts then fetch
        fetch('/api/alerts/generate', { method: 'POST' })
            .then(() => fetch('/api/alerts'))
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setAlerts(d); })
            .catch(() => {})
            .finally(() => setLoaded(true));
    }, []);

    const dismiss = async (id: string) => {
        await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) });
        setAlerts(prev => prev.filter(a => a._id !== id));
    };

    if (!loaded) return <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />;
    if (alerts.length === 0) return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>All clear</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No active alerts for your caseload.</div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map(a => {
                const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info;
                const Icon = ALERT_ICON[a.type] || AlertTriangle;
                const studentName = a.studentId?.name || 'Student';
                return (
                    <div key={a._id} style={{ background: s.bg, border: `1px solid ${s.border}30`, borderRadius: 14, padding: '14px 18px', borderLeft: `3px solid ${s.border}`, position: 'relative' }}>
                        <button onClick={() => dismiss(a._id)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}><X size={14} /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Icon size={16} color={s.icon} strokeWidth={2.5} />
                            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: s.icon, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {a.type.replace(/_/g, ' ')}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: 'auto', paddingRight: 20 }}>
                                {new Date(a.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>{studentName}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.message}</div>
                    </div>
                );
            })}
            {alerts.length > 1 && (
                <button onClick={async () => { await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: alerts.map(a => a._id) }) }); setAlerts([]); }}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                    Dismiss All
                </button>
            )}
        </div>
    );
}

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
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Caseload Alerts</h2>
                            <CaseloadAlerts />
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

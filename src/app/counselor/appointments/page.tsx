'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AppointmentCard from '@/components/AppointmentCard';
import NotificationBell from '@/components/NotificationBell';
import { AppointmentCardSkeleton } from '@/components/Skeleton';
import ConfirmModal from '@/components/ConfirmModal';
import SearchFilter from '@/components/SearchFilter';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
import { Calendar } from 'lucide-react';

export default function CounselorAppointmentsPage() {
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & filter
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    const todayStr = new Date().toISOString().split('T')[0];
    const isFiltered = search !== '' || statusFilter !== 'all' || dateFilter !== '';
    const activeFilterCount = [search !== '', statusFilter !== 'all', dateFilter !== ''].filter(Boolean).length;

    const clearAllFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setDateFilter('');
    };

    // Confirm modal
    const [modalAction, setModalAction] = useState<{ id: string; status: string } | null>(null);

    useEffect(() => {
        async function fetchAppointments() {
            try {
                const res = await fetch('/api/appointments');
                const data = await res.json();
                if (Array.isArray(data)) setAppointments(data);
            } catch (err) {
                console.error(err);
                showToast('Failed to load appointments', 'error');
            }
            finally { setLoading(false); }
        }
        fetchAppointments();
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
            
        let matchesDate = true;
        if (dateFilter) {
            // Compare YYYY-MM-DD
            const apptDate = new Date(a.date).toISOString().split('T')[0];
            matchesDate = apptDate === dateFilter;
        }

        return matchesStatus && matchesSearch && matchesDate;
    });

    const getModalConfig = () => {
        if (!modalAction) return { title: '', message: '', variant: 'primary' as const, confirmLabel: '' };
        if (modalAction.status === 'confirmed') return {
            title: 'Accept Appointment?', message: 'This will confirm the session and notify the student.',
            variant: 'primary' as const, confirmLabel: 'Accept',
        };
        if (modalAction.status === 'cancelled') return {
            title: 'Decline Appointment?', message: 'This will decline the request and notify the student.',
            variant: 'danger' as const, confirmLabel: 'Decline',
        };
        return {
            title: 'Mark as Completed?', message: 'This will mark the session as completed.',
            variant: 'primary' as const, confirmLabel: 'Complete',
        };
    };

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
                            <Calendar size={12} strokeWidth={2.5} /> Counselor Portal
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Appointments
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            All student appointments assigned to you.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Quick date shortcuts */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick filter:</span>
                    <button
                        onClick={() => setDateFilter(dateFilter === todayStr ? '' : todayStr)}
                        style={{
                            padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
                            border: `1px solid ${dateFilter === todayStr ? 'rgba(50,83,67,0.3)' : 'var(--border)'}`,
                            background: dateFilter === todayStr ? 'rgba(50,83,67,0.08)' : 'var(--bg-card)',
                            color: dateFilter === todayStr ? 'var(--ku-green)' : 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'all 0.2s', fontWeight: dateFilter === todayStr ? 700 : 500,
                        }}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const tomorrowStr = tomorrow.toISOString().split('T')[0];
                            setDateFilter(dateFilter === tomorrowStr ? '' : tomorrowStr);
                        }}
                        style={{
                            padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500,
                        }}
                    >
                        Tomorrow
                    </button>
                    {isFiltered && (
                        <button
                            onClick={clearAllFilters}
                            style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.08)',
                                color: '#dc2626',
                                cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
                            }}
                        >
                            <span style={{ background: '#dc2626', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{activeFilterCount}</span>
                            Clear Filters
                        </button>
                    )}
                </div>

                <SearchFilter
                    searchValue={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    dateFilter={dateFilter}
                    onDateChange={setDateFilter}
                    searchPlaceholder="Search by student, reason, specialization..."
                />

                {/* Result count */}
                {!loading && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                        {isFiltered
                            ? <span>Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''} for current filters</span>
                            : <span><strong style={{ color: 'var(--text-primary)' }}>{appointments.length}</strong> total appointment{appointments.length !== 1 ? 's' : ''}</span>
                        }
                    </div>
                )}

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <AppointmentCardSkeleton />
                        <AppointmentCardSkeleton />
                        <AppointmentCardSkeleton />
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState 
                        icon=""
                        title="No appointments found"
                        description={
                            dateFilter
                                ? `No appointments on ${new Date(dateFilter + 'T12:00:00').toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
                                : statusFilter !== 'all'
                                    ? `No ${statusFilter} appointments match your search.`
                                    : "You don't have any student appointments scheduled at the moment."
                        }
                        actionLabel={!isFiltered ? "Update Availability" : undefined}
                        actionHref="/counselor/schedule"
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filtered.map((appt) => (
                            <AppointmentCard
                                key={appt._id}
                                appointment={appt}
                                viewerRole="counselor"
                                onStatusChange={(id, status) => setModalAction({ id, status })}
                            />
                        ))}
                    </div>
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

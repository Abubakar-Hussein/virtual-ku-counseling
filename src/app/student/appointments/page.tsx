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
import { CalendarDays } from 'lucide-react';

export default function StudentAppointmentsPage() {
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & filter
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Confirm modal
    const [cancelTarget, setCancelTarget] = useState<string | null>(null);

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
            showToast('An error occurred', 'error');
        }
        setCancelTarget(null);
    };

    const filtered = appointments.filter(a => {
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchesSearch = !search ||
            (a.counselorId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.reason || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.specialization || '').toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

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
                            <CalendarDays size={12} strokeWidth={2.5} /> My Sessions
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            My Appointments
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            View your booking history and manage upcoming sessions.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                <SearchFilter
                    searchValue={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    searchPlaceholder="Search by counselor, reason, specialization..."
                />

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
                        description={statusFilter !== 'all' 
                            ? `We couldn't find any ${statusFilter} appointments matching your criteria.` 
                            : "You haven't booked any counseling sessions yet. Start your journey to wellness today."}
                        actionLabel={statusFilter === 'all' && search === '' ? "Find a Counselor" : undefined}
                        actionHref="/student/counselors"
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filtered.map((appt) => (
                            <AppointmentCard
                                key={appt._id}
                                appointment={appt}
                                viewerRole="student"
                                onCancel={(id) => setCancelTarget(id)}
                            />
                        ))}
                    </div>
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

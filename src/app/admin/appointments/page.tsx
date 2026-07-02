'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AppointmentCard from '@/components/AppointmentCard';
import NotificationBell from '@/components/NotificationBell';
import { AppointmentCardSkeleton } from '@/components/Skeleton';
import SearchFilter from '@/components/SearchFilter';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';

export default function AdminAppointmentsPage() {
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        async function fetchAppointments() {
            setLoading(true);
            try {
                const res = await fetch(`/api/appointments?startDate=${dateRange.start}&endDate=${dateRange.end}`);
                const data = await res.json();
                if (Array.isArray(data)) setAppointments(data);
            } catch (err) {
                console.error(err);
                showToast('Failed to load appointments', 'error');
            }
            finally { setLoading(false); }
        }
        fetchAppointments();
    }, [dateRange]);

    const filtered = appointments.filter(a => {
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchesSearch = !search ||
            (a.studentId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.counselorId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.reason || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.specialization || '').toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>System Appointments</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Master view of every session requested or completed in the system.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="glass" style={{ padding: '6px 12px', display: 'flex', gap: 12, alignItems: 'center', borderRadius: 12 }}>
                            <input 
                                type="date" 
                                value={dateRange.start} 
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                            <input 
                                type="date" 
                                value={dateRange.end} 
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                            />
                        </div>
                        <NotificationBell />
                    </div>
                </header>

                <SearchFilter
                    searchValue={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    searchPlaceholder="Search by student, counselor, reason..."
                />

                {/* Result count */}
                {!loading && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                        Showing {filtered.length} of {appointments.length} appointments
                    </div>
                )}

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <AppointmentCardSkeleton />
                        <AppointmentCardSkeleton />
                        <AppointmentCardSkeleton />
                        <AppointmentCardSkeleton />
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState 
                        icon=""
                        title="No appointments found"
                        description={statusFilter !== 'all' 
                            ? `There are no system-wide appointments with the status '${statusFilter}' currently.` 
                            : "There are no appointment records found in the system yet."}
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filtered.map((appt) => (
                            <AppointmentCard
                                key={appt._id}
                                appointment={appt}
                                viewerRole="admin"
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

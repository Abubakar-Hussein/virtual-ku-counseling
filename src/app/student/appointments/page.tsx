'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AppointmentCard from '@/components/AppointmentCard';
import NotificationBell from '@/components/NotificationBell';

export default function StudentAppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAppointments() {
            try {
                const res = await fetch('/api/appointments');
                const data = await res.json();
                if (Array.isArray(data)) setAppointments(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchAppointments();
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
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Appointments</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>View your complete booking history and manage upcoming sessions.</p>
                    </div>
                    <NotificationBell />
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading history...</div>
                ) : appointments.length === 0 ? (
                    <div className="glass" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No appointment history found.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {appointments.map((appt) => (
                            <AppointmentCard
                                key={appt._id}
                                appointment={appt}
                                viewerRole="student"
                                onCancel={handleCancel}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

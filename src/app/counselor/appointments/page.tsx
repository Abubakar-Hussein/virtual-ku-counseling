'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AppointmentCard from '@/components/AppointmentCard';
import NotificationBell from '@/components/NotificationBell';

export default function CounselorAppointmentsPage() {
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

    const handleStatusChange = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Manage Appointments</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Accept, decline, and complete your counseling sessions.</p>
                    </div>
                    <NotificationBell />
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading history...</div>
                ) : appointments.length === 0 ? (
                    <div className="glass" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No appointment records found.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {appointments.map((appt) => (
                            <AppointmentCard
                                key={appt._id}
                                appointment={appt}
                                viewerRole="counselor"
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';

export default function BookAppointmentPage({ params }: { params: Promise<{ counselorId: string }> }) {
    const router = useRouter();
    const { counselorId } = React.use(params);
    const [counselor, setCounselor] = useState<any>(null);
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        date: '',
        timeSlot: '',
        specialization: '',
        reason: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const [cRes, sRes] = await Promise.all([
                    fetch(`/api/counselors/${counselorId}`),
                    fetch(`/api/counselors/${counselorId}/availability`)
                ]);
                const cData = await cRes.json();
                const sData = await sRes.json();
                setCounselor(cData);
                setSlots(sData);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchData();
    }, [counselorId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    counselorId: counselorId,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to book appointment');
            router.push('/student/dashboard?booked=success');
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Book Appointment</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Select a date and time to meet with {counselor?.name}.</p>
                    </div>
                    <NotificationBell />
                </header>

                <div className="glass fade-up" style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {error && <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label>Select Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Select Time Slot</label>
                                <select
                                    className="form-input"
                                    value={form.timeSlot}
                                    onChange={e => setForm({ ...form, timeSlot: e.target.value })}
                                    required
                                >
                                    <option value="">Choose a slot...</option>
                                    {slots.length > 0 ? slots.map((s, i) => (
                                        <option key={i} value={`${s.startTime}-${s.endTime}`}>
                                            {s.day.charAt(0).toUpperCase() + s.day.slice(1)}: {s.startTime} - {s.endTime}
                                        </option>
                                    )) : <option disabled>No counselor slots configured</option>}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Specialization</label>
                            <select
                                className="form-input"
                                value={form.specialization}
                                onChange={e => setForm({ ...form, specialization: e.target.value })}
                                required
                            >
                                <option value="">Select focus...</option>
                                {counselor?.profile?.specializations?.map((s: string) => (
                                    <option key={s} value={s}>{s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Reason for Visit</label>
                            <textarea
                                className="form-input"
                                style={{ minHeight: 120, resize: 'vertical' }}
                                placeholder="Briefly describe what you'd like to discuss..."
                                value={form.reason}
                                onChange={e => setForm({ ...form, reason: e.target.value })}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                            <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                                {submitting ? 'Confirming Booking...' : 'Confirm Appointment'}
                            </button>
                            <button type="button" onClick={() => router.back()} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            By confirming, a notification will be sent to the counselor for approval.
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
}

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
        // Intake fields
        mood: 5,
        concerns: [] as string[],
        isUrgent: false,
        previousTherapy: false,
    });
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const toggleConcern = (concern: string) => {
        setForm(prev => ({
            ...prev,
            concerns: prev.concerns.includes(concern) 
                ? prev.concerns.filter(c => c !== concern) 
                : [...prev.concerns, concern]
        }));
    };

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
            <main className="dashboard-content page-transition">
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

                        {step === 1 ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ku-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</div>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Schedule Selection</h2>
                                </div>

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
                                            disabled={!form.date}
                                        >
                                            <option value="">
                                                {!form.date ? 'Select a date first...' : 'Choose a slot...'}
                                            </option>
                                            {(() => {
                                                if (!form.date) return null;
                                                // Get the day of the week from the selected date
                                                const d = new Date(form.date);
                                                const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                                
                                                // Filter slots for that specific day
                                                const daySlots = slots.filter(s => s.day.toLowerCase() === dayName);
                                                
                                                if (daySlots.length === 0) {
                                                    return <option disabled>No slots available on this day</option>;
                                                }

                                                return daySlots.map((s, i) => (
                                                    <option key={i} value={`${s.startTime}-${s.endTime}`}>
                                                        {s.startTime} - {s.endTime}
                                                    </option>
                                                ));
                                            })()}
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

                                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                                    <button type="button" onClick={() => {
                                        if (form.date && form.timeSlot && form.specialization) setStep(2);
                                        else setError('Please fill in all scheduling fields.');
                                    }} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                        Next: Clinical Intake →
                                    </button>
                                    <button type="button" onClick={() => router.back()} className="btn-secondary">
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ku-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</div>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Clinical Intake</h2>
                                </div>

                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <label style={{ margin: 0, fontWeight: 600 }}>Current Mood (1: Low - 10: Excellent)</label>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{form.mood}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={form.mood}
                                        onChange={e => setForm({ ...form, mood: parseInt(e.target.value) })}
                                        style={{
                                            width: '100%',
                                            accentColor: 'var(--ku-green)',
                                            cursor: 'pointer',
                                            height: '8px',
                                            borderRadius: '4px',
                                        }}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Areas of Concern</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {['Anxiety', 'Depression', 'Academic Stress', 'Family Issues', 'Relationship', 'Career Choice', 'Grief', 'Other'].map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => toggleConcern(c)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: 20,
                                                    fontSize: '0.8rem',
                                                    border: '1px solid',
                                                    borderColor: form.concerns.includes(c) ? 'var(--ku-green)' : 'rgba(255,255,255,0.1)',
                                                    background: form.concerns.includes(c) ? 'rgba(0,102,51,0.1)' : 'transparent',
                                                    color: form.concerns.includes(c) ? 'var(--ku-green-light)' : 'var(--text-secondary)',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Reason for Visit</label>
                                    <textarea
                                        className="form-input"
                                        style={{ minHeight: 100, resize: 'vertical' }}
                                        placeholder="Briefly describe what you'd like to discuss..."
                                        value={form.reason}
                                        onChange={e => setForm({ ...form, reason: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={form.isUrgent} onChange={e => setForm({ ...form, isUrgent: e.target.checked })} />
                                        <span>I need to see someone urgently (Crisis Triage)</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={form.previousTherapy} onChange={e => setForm({ ...form, previousTherapy: e.target.checked })} />
                                        <span>I have attended counseling before</span>
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                                    <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                                        {submitting ? 'Confirming Booking...' : 'Complete & Confirm Booking'}
                                    </button>
                                    <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                                        Back
                                    </button>
                                </div>
                            </>
                        )}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            Clinical data is encrypted and only visible to your assigned counselor.
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
}

'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';

export default function CounselorNotesPage({ params }: { params: Promise<{ appointmentId: string }> }) {
    const router = useRouter();
    const { appointmentId } = React.use(params);
    const [appointment, setAppointment] = useState<any>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function fetchAppointment() {
            try {
                const res = await fetch('/api/appointments');
                const data = await res.json();
                const appt = data.find((a: any) => a._id === appointmentId);
                if (appt) {
                    setAppointment(appt);
                    setNotes(appt.notes || '');
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchAppointment();
    }, [appointmentId]);

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
            });
            if (res.ok) {
                setMessage('Session notes saved securely.');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    if (loading) return <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading session details...</div>;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Session Notes</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Record confidential session history for {appointment?.studentId?.name || 'Student'}.</p>
                    </div>
                    <NotificationBell />
                </header>

                <div className="glass fade-up" style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
                    <div style={{ marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
                        <div style={{ display: 'flex', gap: 40, marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Date</div>
                                <div style={{ fontWeight: 600 }}>{new Date(appointment?.date).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specialization</div>
                                <div style={{ fontWeight: 600 }}>{appointment?.specialization?.replace('_', ' ')}</div>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Initial Reason</div>
                            <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{appointment?.reason}"</div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Counselor's Private Notes</label>
                        <textarea
                            className="form-input"
                            style={{ minHeight: 300, resize: 'vertical', lineHeight: 1.6 }}
                            placeholder="Record your observations, plan, and session summary here..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                        <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                            {saving ? 'Saving...' : '💾 Save Secure Notes'}
                        </button>
                        <button onClick={() => router.back()} className="btn-secondary">
                            Back to Dashboard
                        </button>
                    </div>
                    {message && <p style={{ color: 'var(--ku-green-light)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, marginTop: 16 }}>{message}</p>}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
                        🔒 These notes are encrypted and only accessible to you. They are not visible to the student.
                    </p>
                </div>
            </main>
        </div>
    );
}

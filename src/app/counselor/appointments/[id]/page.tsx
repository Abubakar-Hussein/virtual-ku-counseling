'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import { useToast } from '@/components/Toast';

export default function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = React.use(params);
    const { showToast } = useToast();
    
    const [appointment, setAppointment] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    
    // Notes form
    const [notes, setNotes] = useState('');
    const [actionItems, setActionItems] = useState('');
    const [progressIndicator, setProgressIndicator] = useState('Not Evaluated');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDetails() {
            try {
                // Fetch appointment details first
                const res = await fetch('/api/appointments');
                const allApps = await res.json();
                const app = allApps.find((a: any) => a._id === id);
                if (!app) throw new Error('Appointment not found');
                
                setAppointment(app);

                // Fetch existing notes for this session
                const notesRes = await fetch(`/api/appointments/${id}/notes`);
                if (notesRes.ok) {
                    const notesData = await notesRes.json();
                    if (notesData._id) {
                        setNotes(notesData.notes || '');
                        setActionItems(notesData.actionItems || '');
                        setProgressIndicator(notesData.progressIndicator || 'Not Evaluated');
                    }
                }

                // Fetch student history
                const histRes = await fetch(`/api/students/${app.studentId._id}/history`);
                if (histRes.ok) {
                    const histData = await histRes.json();
                    setHistory(histData.filter((h: any) => h._id !== id)); // exclude current
                }

            } catch (err) {
                console.error(err);
                showToast('Failed to load session details', 'error');
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [id]);

    const handleSaveNotes = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/appointments/${id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes, actionItems, progressIndicator })
            });
            if (!res.ok) throw new Error('Failed to save notes');
            showToast('Clinical notes saved successfully', 'success');
            // Update local status to completed visually
            setAppointment((prev: any) => ({ ...prev, status: 'completed' }));
        } catch (err) {
            showToast('Failed to save notes', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-content">Loading...</main></div>;
    if (!appointment) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-content">Not found</main></div>;

    const student = appointment.studentId;
    const intake = appointment.intake;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <div>
                        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--ku-green-light)', cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            ← Back to Appointments
                        </button>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Clinical Session Details</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {new Date(appointment.date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {appointment.timeSlot}
                        </p>
                    </div>
                    <span className={`badge badge-${appointment.status}`}>{appointment.status.toUpperCase()}</span>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 32 }}>
                    
                    {/* Left Column: Notes & Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Intake Info */}
                        <section className="glass" style={{ padding: 24 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'var(--ku-green-light)' }}>Student Intake Data</h2>
                            {intake ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {intake.isUrgent && (
                                        <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontWeight: 600 }}>
                                            ⚠️ CRISIS TRIAGE: Urgent care requested.
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 40 }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Self-Reported Mood</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: intake.mood < 4 ? '#f87171' : intake.mood > 7 ? '#4ade80' : '#facc15' }}>
                                                {intake.mood}/10
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prior Therapy</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{intake.previousTherapy ? 'Yes' : 'No'}</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Primary Concerns</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {intake.concerns.map((c: string) => (
                                                <span key={c} className="badge" style={{ background: 'rgba(0,102,51,0.1)', color: 'var(--ku-green-light)' }}>{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Reason for Visit (Student's Words)</div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
                                            "{appointment.reason}"
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No pre-session intake data provided.</p>
                            )}
                        </section>

                        {/* Counselor Notes Workspace */}
                        <section className="glass" style={{ padding: 24, borderLeft: '3px solid var(--ku-green)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Clinical Notes Workspace</h2>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HIPAA/GDPR Compliant</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div className="form-group">
                                    <label>Session Notes & Observations</label>
                                    <textarea 
                                        className="form-input" 
                                        style={{ minHeight: 250, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.6 }}
                                        placeholder="Document clinical observations, therapeutic interventions, and patient responses..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Action Items / Homework for Student</label>
                                    <textarea 
                                        className="form-input" 
                                        style={{ minHeight: 120, resize: 'vertical', fontSize: '0.9rem', lineHeight: 1.5 }}
                                        placeholder="e.g., Practice mindfulness app 10 mins/day. Read the recommended stress management guide..."
                                        value={actionItems}
                                        onChange={e => setActionItems(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Overall Progress Indicator</label>
                                    <select 
                                        className="form-input" 
                                        value={progressIndicator} 
                                        onChange={e => setProgressIndicator(e.target.value)}
                                    >
                                        <option value="Not Evaluated">Not Evaluated</option>
                                        <option value="Improved">Improved (Positive Trajectory)</option>
                                        <option value="Stable">Stable (No Significant Change)</option>
                                        <option value="Declined">Declined (Needs Intervention)</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                    <button 
                                        className="btn-primary" 
                                        onClick={handleSaveNotes} 
                                        disabled={saving}
                                        style={{ padding: '10px 24px' }}
                                    >
                                        {saving ? 'Encrypting & Saving...' : 'Save Clinical Record'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Student Profile & History */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Student Snapshot */}
                        <section className="glass" style={{ padding: 24, textAlign: 'center' }}>
                            <Avatar name={student.name} src={student.profileImage} size={80} style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{student.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>{student.email}</p>
                            
                            <a href={`https://mail.google.com/mail/?view=cm&to=${student.email}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                Contact Student
                            </a>
                        </section>

                        {/* Student Feedback */}
                        {appointment.rating && (
                            <section className="glass" style={{ padding: 24 }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                                    Student Feedback
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                    <span style={{ fontSize: '1.2rem', color: '#facc15' }}>
                                        {'★'.repeat(appointment.rating)}{'☆'.repeat(5 - appointment.rating)}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{appointment.rating} / 5</span>
                                </div>
                                {appointment.feedback && (
                                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                                        "{appointment.feedback}"
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Historical Progress */}
                        <section className="glass" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                                Clinical History
                            </h3>
                            
                            {history.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                                    No prior sessions. This is the intake session.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {history.map((h, i) => (
                                        <div key={h._id} style={{ position: 'relative', paddingLeft: 16, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ku-green-light)', position: 'absolute', left: -5, top: 4 }} />
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                                                {new Date(h.date).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>
                                                {h.specialization.replace('_', ' ')}
                                            </div>
                                            {h.note && (
                                                <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6, marginTop: 6 }}>
                                                    <strong style={{ color: 'var(--ku-green-light)' }}>Progress:</strong> {h.note.progressIndicator}
                                                    {h.note.actionItems && <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>Action: {h.note.actionItems}</div>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                </div>
            </main>
        </div>
    );
}

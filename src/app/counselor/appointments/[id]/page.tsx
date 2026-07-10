'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import { useToast } from '@/components/Toast';
import { Star, ClipboardList, ArrowLeft } from 'lucide-react';

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

    if (loading) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-content"><div style={{ color: 'var(--text-muted)' }}>Loading...</div></main></div>;
    if (!appointment) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-content"><div style={{ color: 'var(--text-muted)' }}>Not found</div></main></div>;

    const student = appointment.studentId;
    const intake = appointment.intake;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, padding: 0 }}>
                            <ArrowLeft size={16} strokeWidth={2.5} /> Back to Appointments
                        </button>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 20, padding: '4px 12px',
                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)',
                            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            <ClipboardList size={12} strokeWidth={2.5} /> Clinical Record
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Session Details</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            {new Date(appointment.date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {appointment.timeSlot}
                        </p>
                    </div>
                    <span className={`badge badge-${appointment.status}`} style={{ marginTop: 36 }}>{appointment.status.toUpperCase()}</span>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32 }}>
                    
                    {/* Left Column: Notes & Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Intake Info */}
                        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Student Intake Data</h2>
                            {intake ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    {intake.isUrgent && (
                                        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontWeight: 700, fontSize: '0.85rem' }}>
                                            CRISIS TRIAGE: Urgent care requested.
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 48 }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Self-Reported Mood</div>
                                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: intake.mood < 4 ? '#dc2626' : intake.mood > 7 ? '#22c55e' : '#f59e0b', lineHeight: 1 }}>
                                                {intake.mood}/10
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Prior Therapy</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{intake.previousTherapy ? 'Yes' : 'No'}</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Primary Concerns</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {intake.concerns.map((c: string) => (
                                                <span key={c} style={{ background: 'rgba(50,83,67,0.08)', color: 'var(--ku-green)', border: '1px solid rgba(50,83,67,0.15)', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Reason for Visit (Student's Words)</div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12, margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                                            "{appointment.reason}"
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, padding: '20px 0', textAlign: 'center', background: 'var(--bg-main)', border: '1px dashed var(--border)', borderRadius: 12 }}>No pre-session intake data provided.</p>
                            )}
                        </section>

                        {/* Counselor Notes Workspace */}
                        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', borderLeft: '4px solid var(--ku-green)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Clinical Notes Workspace</h2>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HIPAA/GDPR Compliant</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Session Notes & Observations</label>
                                    <textarea 
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Document clinical observations, therapeutic interventions, and patient responses..."
                                        style={{ width: '100%', minHeight: 250, resize: 'vertical', padding: '16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6, fontFamily: 'monospace', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(50,83,67,0.4)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Action Items / Homework for Student</label>
                                    <textarea 
                                        value={actionItems}
                                        onChange={e => setActionItems(e.target.value)}
                                        placeholder="e.g., Practice mindfulness app 10 mins/day. Read the recommended stress management guide..."
                                        style={{ width: '100%', minHeight: 120, resize: 'vertical', padding: '16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(50,83,67,0.4)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Overall Progress Indicator</label>
                                    <select 
                                        value={progressIndicator} 
                                        onChange={e => setProgressIndicator(e.target.value)}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(50,83,67,0.4)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    >
                                        <option value="Not Evaluated">Not Evaluated</option>
                                        <option value="Improved">Improved (Positive Trajectory)</option>
                                        <option value="Stable">Stable (No Significant Change)</option>
                                        <option value="Declined">Declined (Needs Intervention)</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                    <button 
                                        onClick={handleSaveNotes} 
                                        disabled={saving}
                                        style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: saving ? 'rgba(50,83,67,0.5)' : 'var(--ku-green)', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(50,83,67,0.2)' }}
                                    >
                                        {saving ? 'Encrypting & Saving...' : 'Save Clinical Record'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Student Profile & History */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Student Snapshot */}
                        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 24px', textAlign: 'center' }}>
                            <Avatar name={student.name} src={student.profileImage} size={88} style={{ margin: '0 auto 20px' }} fontSize="2rem" />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{student.name}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 24 }}>{student.email}</p>
                            
                            <a href={`https://mail.google.com/mail/?view=cm&to=${student.email}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid rgba(50,83,67,0.3)', background: 'rgba(50,83,67,0.05)', color: 'var(--ku-green)', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
                                Contact Student
                            </a>
                        </section>

                        {/* Student Feedback */}
                        {appointment.rating && (
                            <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12, color: 'var(--text-primary)' }}>
                                    Student Feedback
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', gap: 3 }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={18} fill={star <= appointment.rating ? '#f59e0b' : 'none'} stroke={star <= appointment.rating ? '#f59e0b' : 'var(--border)'} />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b' }}>{appointment.rating} / 5</span>
                                </div>
                                {appointment.feedback && (
                                    <div style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 12, fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                                        "{appointment.feedback}"
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Historical Progress */}
                        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12, color: 'var(--text-primary)' }}>
                                Clinical History
                            </h3>
                            
                            {history.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                                    No prior sessions. This is the intake session.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {history.map((h, i) => (
                                        <div key={h._id} style={{ position: 'relative', paddingLeft: 20, borderLeft: '2px solid var(--border)' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ku-green)', position: 'absolute', left: -6, top: 4, border: '2px solid var(--bg-card)' }} />
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {new Date(h.date).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                                                {h.specialization.replace('_', ' ')}
                                            </div>
                                            {h.note && (
                                                <div style={{ fontSize: '0.85rem', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: 10, marginTop: 8 }}>
                                                    <div style={{ marginBottom: h.note.actionItems ? 6 : 0 }}><strong style={{ color: 'var(--text-primary)' }}>Progress:</strong> <span style={{ color: 'var(--text-secondary)' }}>{h.note.progressIndicator}</span></div>
                                                    {h.note.actionItems && <div style={{ color: 'var(--text-muted)' }}>Action: {h.note.actionItems}</div>}
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

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ArrowLeft, ArrowRight, ClipboardList, Sparkles, AlertTriangle } from 'lucide-react';

const CONCERNS = ['Anxiety','Depression','Academic Stress','Family Issues','Relationship','Career Choice','Grief','Self-Esteem','Substance Use','Eating Habits','Trauma','Other'];
const GOALS = ['Manage anxiety','Reduce stress','Improve grades','Build confidence','Career clarity','Better relationships','Process grief','Develop coping skills'];
const MOODS = ['😞','😟','😐','🙂','😊','😄','🤩'];

export default function IntakePage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        mood: 5, stressLevel: 5, sleepQuality: 3,
        concerns: [] as string[], anxietyLevel: 'mild', description: '',
        preferredCounselorGender: 'no_preference', preferredSessionType: 'no_preference',
        goalsForCounseling: [] as string[], previousTherapy: false,
        lifeSatisfaction: 5, socialSupport: 'moderate', isUrgent: false,
    });

    const toggle = (arr: string[], val: string) =>
        arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

    const canNext = [
        () => true,
        () => form.concerns.length > 0 && form.description.trim().length > 0,
        () => form.goalsForCounseling.length > 0,
        () => true,
    ];

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/intake', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) router.push(`/student/intake/results?intakeId=${data._id}`);
        } catch { } finally { setSaving(false); }
    };

    const pill = (active: boolean): React.CSSProperties => ({
        padding: '8px 16px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 600,
        border: active ? '2px solid #325343' : '1.5px solid #e5e7eb',
        background: active ? 'rgba(50,83,67,0.08)' : '#fff',
        color: active ? '#325343' : '#6b7280',
        cursor: 'pointer', transition: 'all 0.2s',
    });

    const slider = (val: number, max: number, onChange: (v: number) => void, labels?: string[]) => (
        <div>
            <input type="range" min={1} max={max} value={val} onChange={e => onChange(+e.target.value)}
                style={{ width: '100%', accentColor: '#325343' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>
                {labels ? labels.map((l, i) => <span key={i}>{l}</span>) : <><span>1</span><span>{max}</span></>}
            </div>
        </div>
    );

    const steps = [
        // Step 0: How are you feeling?
        <div key={0}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>How are you feeling?</h2>
            <p style={{ color: '#6b7280', marginBottom: 32, fontSize: '0.95rem' }}>Help us understand your current state of mind.</p>

            <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Overall Mood</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '2rem', marginBottom: 8 }}>
                    {MOODS.map((m, i) => {
                        const val = Math.round(1 + i * (9 / 6));
                        return <span key={i} onClick={() => setForm({ ...form, mood: val })}
                            style={{ cursor: 'pointer', opacity: Math.abs(form.mood - val) <= 1 ? 1 : 0.3, transition: 'all 0.2s', transform: Math.abs(form.mood - val) <= 0 ? 'scale(1.3)' : 'scale(1)' }}>{m}</span>;
                    })}
                </div>
                {slider(form.mood, 10, v => setForm({ ...form, mood: v }), ['Very Low', 'Neutral', 'Excellent'])}
            </div>

            <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Stress Level</label>
                {slider(form.stressLevel, 10, v => setForm({ ...form, stressLevel: v }), ['Minimal', 'Moderate', 'Overwhelming'])}
            </div>

            <div>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Sleep Quality</label>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} type="button" onClick={() => setForm({ ...form, sleepQuality: v })}
                            style={{ width: 44, height: 44, borderRadius: 12, border: form.sleepQuality === v ? '2px solid #325343' : '1.5px solid #e5e7eb', background: form.sleepQuality === v ? 'rgba(50,83,67,0.08)' : '#fff', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 700, color: form.sleepQuality === v ? '#325343' : '#9ca3af' }}>
                            {'⭐'.repeat(v > 3 ? 1 : 0)}{v}
                        </button>
                    ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>1 = Very poor, 5 = Excellent</div>
            </div>
        </div>,

        // Step 1: What brings you here?
        <div key={1}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>What brings you here?</h2>
            <p style={{ color: '#6b7280', marginBottom: 32, fontSize: '0.95rem' }}>Select all areas you&apos;d like support with.</p>

            <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Areas of Concern</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CONCERNS.map(c => (
                        <button key={c} type="button" onClick={() => setForm({ ...form, concerns: toggle(form.concerns, c) })}
                            style={pill(form.concerns.includes(c))}>{c}</button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Anxiety Level</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['none', 'mild', 'moderate', 'severe'].map(l => (
                        <button key={l} type="button" onClick={() => setForm({ ...form, anxietyLevel: l })}
                            style={pill(form.anxietyLevel === l)}>{l.charAt(0).toUpperCase() + l.slice(1)}</button>
                    ))}
                </div>
            </div>

            <div>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 8 }}>Tell us more <span style={{ color: '#9ca3af', fontWeight: 400 }}>(required)</span></label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe what you're going through in your own words..."
                    style={{ width: '100%', minHeight: 120, padding: 16, borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: '0.95rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>
        </div>,

        // Step 2: Your preferences
        <div key={2}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Your preferences</h2>
            <p style={{ color: '#6b7280', marginBottom: 32, fontSize: '0.95rem' }}>Help us find the best match for you.</p>

            <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Preferred Counselor Gender</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[['no_preference', 'No Preference'], ['male', 'Male'], ['female', 'Female']].map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setForm({ ...form, preferredCounselorGender: v })}
                            style={pill(form.preferredCounselorGender === v)}>{l}</button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Session Type</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[['no_preference', 'No Preference'], ['virtual', 'Virtual (Online)'], ['in_person', 'In-Person']].map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setForm({ ...form, preferredSessionType: v })}
                            style={pill(form.preferredSessionType === v)}>{l}</button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Goals for Counseling</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {GOALS.map(g => (
                        <button key={g} type="button" onClick={() => setForm({ ...form, goalsForCounseling: toggle(form.goalsForCounseling, g) })}
                            style={pill(form.goalsForCounseling.includes(g))}>{g}</button>
                    ))}
                </div>
            </div>

            <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.previousTherapy} onChange={e => setForm({ ...form, previousTherapy: e.target.checked })}
                        style={{ width: 20, height: 20, accentColor: '#325343' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>I&apos;ve had therapy/counseling before</span>
                </label>
            </div>
        </div>,

        // Step 3: Social & Well-being
        <div key={3}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Social &amp; Well-being</h2>
            <p style={{ color: '#6b7280', marginBottom: 32, fontSize: '0.95rem' }}>A few more questions to complete your assessment.</p>

            <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Life Satisfaction</label>
                {slider(form.lifeSatisfaction, 10, v => setForm({ ...form, lifeSatisfaction: v }), ['Very Low', 'Neutral', 'Very High'])}
            </div>

            <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>Social Support Network</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[['strong', 'Strong'], ['moderate', 'Moderate'], ['weak', 'Weak'], ['none', 'None']].map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setForm({ ...form, socialSupport: v })}
                            style={pill(form.socialSupport === v)}>{l}</button>
                    ))}
                </div>
            </div>

            <div style={{
                padding: '16px 20px', borderRadius: 14,
                border: '1.5px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)',
                display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
                <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 6 }}>
                        <input type="checkbox" checked={form.isUrgent} onChange={e => setForm({ ...form, isUrgent: e.target.checked })}
                            style={{ width: 20, height: 20, accentColor: '#dc2626' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>This is urgent / I need crisis support</span>
                    </label>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.5 }}>
                        If you are in immediate danger, please call emergency services or the crisis hotline.
                    </p>
                </div>
            </div>
        </div>,
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
                            <ClipboardList size={12} strokeWidth={2.5} /> Wellness Assessment
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Take Your Assessment</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>We&apos;ll match you with the best counselor based on your needs.</p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Progress bar */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 40 }}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{ flex: 1, height: 5, borderRadius: 99, background: i <= step ? '#325343' : '#e5e7eb', transition: 'background 0.3s' }} />
                    ))}
                </div>

                <div style={{ maxWidth: 640, margin: '0 auto' }}>
                    <div className="glass" style={{ padding: 36, borderRadius: 20 }}>
                        {steps[step]}
                    </div>

                    {/* Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
                        {step > 0 ? (
                            <button onClick={() => setStep(s => s - 1)} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 12,
                                border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600,
                                fontSize: '0.9rem', cursor: 'pointer',
                            }}><ArrowLeft size={16} /> Back</button>
                        ) : <div />}

                        {step < 3 ? (
                            <button onClick={() => canNext[step]() && setStep(s => s + 1)} disabled={!canNext[step]()}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderRadius: 12,
                                    border: 'none', background: canNext[step]() ? '#325343' : '#d1d5db', color: '#fff',
                                    fontWeight: 700, fontSize: '0.9rem', cursor: canNext[step]() ? 'pointer' : 'not-allowed',
                                }}>Next <ArrowRight size={16} /></button>
                        ) : (
                            <button onClick={handleSubmit} disabled={saving}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12,
                                    border: 'none', background: '#325343', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                                    cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                                }}>
                                {saving ? 'Finding matches...' : <><Sparkles size={16} /> Find My Counselor</>}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

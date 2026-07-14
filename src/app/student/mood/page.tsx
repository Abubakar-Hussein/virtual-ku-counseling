'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Heart, Send, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TAGS = ['stressed', 'productive', 'social', 'anxious', 'calm', 'tired', 'motivated', 'lonely', 'grateful'];
const EMOJIS = ['😞', '😟', '😕', '😐', '🙂', '😊', '😄', '🤗', '😁', '🤩'];

interface MoodEntry {
    _id: string; date: string; mood: number; energy: number;
    sleep: number; anxiety: number; journal?: string; tags: string[];
}

export default function MoodTrackerPage() {
    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [todayLogged, setTodayLogged] = useState(false);
    const [form, setForm] = useState({ mood: 5, energy: 3, sleep: 3, anxiety: 3, journal: '', tags: [] as string[] });

    useEffect(() => {
        fetch('/api/mood?days=30').then(r => r.json())
            .then(d => {
                if (Array.isArray(d)) {
                    setEntries(d);
                    const today = new Date().toISOString().slice(0, 10);
                    const todayEntry = d.find((e: MoodEntry) => e.date?.slice(0, 10) === today);
                    if (todayEntry) {
                        setTodayLogged(true);
                        setForm({ mood: todayEntry.mood, energy: todayEntry.energy, sleep: todayEntry.sleep, anxiety: todayEntry.anxiety, journal: todayEntry.journal || '', tags: todayEntry.tags || [] });
                    }
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/mood', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const saved = await res.json();
                setTodayLogged(true);
                setEntries(prev => {
                    const today = new Date().toISOString().slice(0, 10);
                    const filtered = prev.filter(e => e.date?.slice(0, 10) !== today);
                    return [saved, ...filtered];
                });
            }
        } catch { } finally { setSaving(false); }
    };

    const toggle = (arr: string[], val: string) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

    // 7-day trend data
    const last7 = entries.slice(0, 7).reverse();
    const avgMood = entries.length > 0 ? (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1) : '—';
    const trend = last7.length >= 2 ? last7[last7.length - 1].mood - last7[0].mood : 0;

    const moodColor = (m: number) => m <= 3 ? '#ef4444' : m <= 5 ? '#f59e0b' : m <= 7 ? '#22c55e' : '#10b981';

    const miniSlider = (label: string, val: number, onChange: (v: number) => void) => (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#325343' }}>{val}/5</span>
            </div>
            <input type="range" min={1} max={5} value={val} onChange={e => onChange(+e.target.value)}
                style={{ width: '100%', accentColor: '#325343' }} />
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
                            <Heart size={12} strokeWidth={2.5} /> Mood Tracker
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>How Are You Feeling?</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Track your daily mood, energy, and well-being.</p>
                    </div>
                    <NotificationBell />
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                    {/* Left: Today's Check-in */}
                    <div>
                        <div className="glass" style={{ padding: 28, borderRadius: 20, marginBottom: 24 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>
                                {todayLogged ? '✅ Today\'s Check-in (Update)' : 'Today\'s Check-in'}
                            </h2>

                            {/* Mood emoji selector */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 10 }}>Mood</label>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    {EMOJIS.map((e, i) => (
                                        <span key={i} onClick={() => setForm({ ...form, mood: i + 1 })}
                                            style={{ fontSize: form.mood === i + 1 ? '1.8rem' : '1.3rem', cursor: 'pointer', opacity: form.mood === i + 1 ? 1 : 0.35, transition: 'all 0.2s' }}>
                                            {e}
                                        </span>
                                    ))}
                                </div>
                                <input type="range" min={1} max={10} value={form.mood} onChange={e => setForm({ ...form, mood: +e.target.value })}
                                    style={{ width: '100%', accentColor: moodColor(form.mood) }} />
                            </div>

                            {miniSlider('Energy', form.energy, v => setForm({ ...form, energy: v }))}
                            {miniSlider('Sleep Quality', form.sleep, v => setForm({ ...form, sleep: v }))}
                            {miniSlider('Anxiety', form.anxiety, v => setForm({ ...form, anxiety: v }))}

                            {/* Tags */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>Quick Tags</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {TAGS.map(t => (
                                        <button key={t} type="button" onClick={() => setForm({ ...form, tags: toggle(form.tags, t) })}
                                            style={{
                                                padding: '5px 12px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600,
                                                border: form.tags.includes(t) ? '1.5px solid #325343' : '1px solid #e5e7eb',
                                                background: form.tags.includes(t) ? 'rgba(50,83,67,0.08)' : '#fff',
                                                color: form.tags.includes(t) ? '#325343' : '#6b7280', cursor: 'pointer',
                                            }}>{t}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Journal */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>Journal (optional)</label>
                                <textarea value={form.journal} onChange={e => setForm({ ...form, journal: e.target.value })}
                                    placeholder="What's on your mind today?"
                                    style={{ width: '100%', minHeight: 100, padding: 14, borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                            </div>

                            <button onClick={handleSave} disabled={saving} style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '13px', borderRadius: 12, border: 'none', background: '#325343', color: '#fff',
                                fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer',
                            }}>
                                <Send size={16} /> {saving ? 'Saving...' : todayLogged ? 'Update Check-in' : 'Save Check-in'}
                            </button>
                        </div>
                    </div>

                    {/* Right: Trends & History */}
                    <div>
                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                            <div className="glass" style={{ padding: '16px 20px', borderRadius: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Avg Mood</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#325343' }}>{avgMood}</div>
                            </div>
                            <div className="glass" style={{ padding: '16px 20px', borderRadius: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Entries</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#325343' }}>{entries.length}</div>
                            </div>
                            <div className="glass" style={{ padding: '16px 20px', borderRadius: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Trend</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    {trend > 0 ? <TrendingUp size={18} /> : trend < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
                                    {trend > 0 ? '+' : ''}{trend}
                                </div>
                            </div>
                        </div>

                        {/* 7-Day Chart (SVG) */}
                        <div className="glass" style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>7-Day Mood Trend</h3>
                            {last7.length >= 2 ? (
                                <svg viewBox="0 0 300 120" style={{ width: '100%', height: 120 }}>
                                    {/* Grid lines */}
                                    {[0, 1, 2].map(i => <line key={i} x1={0} y1={10 + i * 50} x2={300} y2={10 + i * 50} stroke="#f3f4f6" strokeWidth={1} />)}
                                    {/* Line */}
                                    <polyline fill="none" stroke="#325343" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                                        points={last7.map((e, i) => `${20 + i * (260 / (last7.length - 1))},${110 - (e.mood / 10) * 100}`).join(' ')} />
                                    {/* Area */}
                                    <polygon fill="rgba(50,83,67,0.08)"
                                        points={`${20},110 ${last7.map((e, i) => `${20 + i * (260 / (last7.length - 1))},${110 - (e.mood / 10) * 100}`).join(' ')} ${20 + (last7.length - 1) * (260 / (last7.length - 1))},110`} />
                                    {/* Dots */}
                                    {last7.map((e, i) => (
                                        <g key={i}>
                                            <circle cx={20 + i * (260 / (last7.length - 1))} cy={110 - (e.mood / 10) * 100} r={4} fill="#325343" />
                                            <text x={20 + i * (260 / (last7.length - 1))} y={110 - (e.mood / 10) * 100 - 10}
                                                textAnchor="middle" fontSize={9} fill="#325343" fontWeight={700}>{e.mood}</text>
                                        </g>
                                    ))}
                                    {/* Day labels */}
                                    {last7.map((e, i) => (
                                        <text key={`d${i}`} x={20 + i * (260 / (last7.length - 1))} y={125}
                                            textAnchor="middle" fontSize={8} fill="#9ca3af">
                                            {new Date(e.date).toLocaleDateString('en', { weekday: 'short' })}
                                        </text>
                                    ))}
                                </svg>
                            ) : (
                                <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Log at least 2 days to see your trend chart.</p>
                            )}
                        </div>

                        {/* 30-Day Calendar Heatmap */}
                        <div className="glass" style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>30-Day Overview</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                                {Array.from({ length: 30 }, (_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (29 - i));
                                    const dateStr = d.toISOString().slice(0, 10);
                                    const entry = entries.find(e => e.date?.slice(0, 10) === dateStr);
                                    const bg = entry ? moodColor(entry.mood) : '#f3f4f6';
                                    return (
                                        <div key={i} title={`${dateStr}: ${entry ? entry.mood + '/10' : 'No entry'}`}
                                            style={{ aspectRatio: '1', borderRadius: 6, background: bg, opacity: entry ? 0.8 : 0.4, position: 'relative' }}>
                                            <span style={{ position: 'absolute', bottom: 1, right: 3, fontSize: '0.5rem', color: entry ? '#fff' : '#ccc', fontWeight: 700 }}>
                                                {d.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: '0.7rem', color: '#9ca3af' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#ef4444' }} /> Low</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#f59e0b' }} /> Medium</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#22c55e' }} /> Good</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#f3f4f6' }} /> No data</span>
                            </div>
                        </div>

                        {/* Journal History */}
                        <div className="glass" style={{ padding: 24, borderRadius: 20 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Recent Entries</h3>
                            {entries.filter(e => e.journal).length === 0 ? (
                                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No journal entries yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {entries.filter(e => e.journal).slice(0, 5).map(e => (
                                        <div key={e._id} style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                                                <span style={{ fontWeight: 700, color: moodColor(e.mood) }}>{EMOJIS[e.mood - 1]} {e.mood}/10</span>
                                                <span style={{ color: '#9ca3af' }}>{new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{e.journal}</p>
                                            {e.tags?.length > 0 && (
                                                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                                                    {e.tags.map(t => <span key={t} style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', background: 'rgba(50,83,67,0.06)', color: '#325343' }}>{t}</span>)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

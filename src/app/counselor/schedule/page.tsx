'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

export default function CounselorSchedulePage() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [slots, setSlots] = useState<any[]>([]);
    const [bio, setBio] = useState('');
    const [specs, setSpecs] = useState<string[]>([]);
    const [maxBookings, setMaxBookings] = useState(8);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!session?.user) return;
        async function fetchProfile() {
            try {
                const res = await fetch(`/api/counselors/${(session?.user as any)?.id}`);
                const data = await res.json();
                if (data && data.profile) {
                    setProfile(data.profile);
                    setSlots(data.profile.availableSlots || []);
                    setBio(data.profile.bio || '');
                    setSpecs(data.profile.specializations || []);
                    setMaxBookings(data.profile.maxDailyBookings || 8);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchProfile();
    }, [session]);

    const addSlot = () => {
        setSlots([...slots, { day: 'monday', startTime: '09:00', endTime: '10:00' }]);
    };

    const removeSlot = (index: number) => {
        setSlots(slots.filter((_, i) => i !== index));
    };

    const updateSlot = (index: number, key: string, value: string) => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], [key]: value };
        setSlots(newSlots);
    };

    const toggleSpec = (s: string) => {
        setSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const res = await fetch(`/api/counselors/${(session?.user as any).id}/availability`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slots, bio, specializations: specs, maxDailyBookings: maxBookings }),
            });
            if (res.ok) {
                setMessage('Availability updated successfully!');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    if (loading) return <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Professional Profile</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Set your working hours and specializations for student bookings.</p>
                    </div>
                    <NotificationBell />
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
                    <section className="glass" style={{ padding: 32 }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>Weekly Availability</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {slots.map((slot, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <select
                                        className="form-input"
                                        style={{ maxWidth: 140 }}
                                        value={slot.day}
                                        onChange={e => updateSlot(i, 'day', e.target.value)}
                                    >
                                        {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                    </select>
                                    <input type="time" className="form-input" style={{ maxWidth: 120 }} value={slot.startTime} onChange={e => updateSlot(i, 'startTime', e.target.value)} />
                                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                                    <input type="time" className="form-input" style={{ maxWidth: 120 }} value={slot.endTime} onChange={e => updateSlot(i, 'endTime', e.target.value)} />
                                    <button onClick={() => removeSlot(i)} style={{ color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                                </div>
                            ))}
                            <button onClick={addSlot} className="btn-secondary" style={{ alignSelf: 'flex-start', borderStyle: 'dashed' }}>+ Add Time Block</button>
                        </div>
                    </section>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        <section className="glass" style={{ padding: 32 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>About & Specs</h2>

                            <div className="form-group" style={{ marginBottom: 20 }}>
                                <label>Professional Bio</label>
                                <textarea className="form-input" style={{ minHeight: 100 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell students about your background..." />
                            </div>

                            <div className="form-group">
                                <label>Specializations</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                    {['academic', 'career', 'mental_health'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => toggleSpec(s)}
                                            style={{
                                                padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                                                background: specs.includes(s) ? 'var(--ku-green)' : 'rgba(255,255,255,0.05)',
                                                color: specs.includes(s) ? '#fff' : 'var(--text-secondary)',
                                                border: '1px solid var(--border)',
                                            }}
                                        >
                                            {s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <button
                            onClick={handleSave}
                            className="btn-primary"
                            disabled={saving}
                            style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
                        >
                            {saving ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                        {message && <p style={{ color: 'var(--ku-green-light)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{message}</p>}
                    </div>
                </div>
            </main>
        </div>
    );
}

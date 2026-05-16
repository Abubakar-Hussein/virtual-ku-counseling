'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const HOURS_12 = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const MINUTES = ['00', '15', '30', '45'];

// Convert 24h "HH:MM" to { hour12, minute, period }
function to12Hour(time24: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const minute = mStr || '00';
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return { hour: String(h), minute, period };
}

// Convert { hour12, minute, period } back to 24h "HH:MM"
function to24Hour(hour: string, minute: string, period: 'AM' | 'PM'): string {
    let h = parseInt(hour, 10);
    if (period === 'AM' && h === 12) h = 0;
    else if (period === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2, '0')}:${minute}`;
}

// Convert "HH:MM" to total minutes for comparison
function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

// Check if a slot has a valid time range
function isSlotValid(slot: { startTime: string; endTime: string }): boolean {
    return timeToMinutes(slot.endTime) > timeToMinutes(slot.startTime);
}

// Format time for display: "9:00 AM"
function formatTimeDisplay(time24: string): string {
    const { hour, minute, period } = to12Hour(time24);
    return `${hour}:${minute} ${period}`;
}

export default function CounselorSchedulePage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<any>(null);
    const [slots, setSlots] = useState<any[]>([]);
    const [bio, setBio] = useState('');
    const [specs, setSpecs] = useState<string[]>([]);
    const [maxBookings, setMaxBookings] = useState(8);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    const updateSlotTime = (index: number, field: 'startTime' | 'endTime', hour: string, minute: string, period: 'AM' | 'PM') => {
        const time24 = to24Hour(hour, minute, period);
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], [field]: time24 };

        // Auto-correct: if setting start time and end time is now invalid, bump end time
        if (field === 'startTime') {
            const startMins = timeToMinutes(time24);
            const endMins = timeToMinutes(newSlots[index].endTime);
            if (endMins <= startMins) {
                // Set end time to 1 hour after start, capped at 23:45
                const newEndMins = Math.min(startMins + 60, 23 * 60 + 45);
                const endH = Math.floor(newEndMins / 60);
                const endM = newEndMins % 60;
                newSlots[index].endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
            }
        }

        setSlots(newSlots);
    };

    const toggleSpec = (s: string) => {
        setSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const hasInvalidSlots = slots.some(slot => !isSlotValid(slot));

    // Count slots per day to enforce maxDailyBookings
    const slotsPerDay: Record<string, number> = {};
    for (const slot of slots) {
        slotsPerDay[slot.day] = (slotsPerDay[slot.day] || 0) + 1;
    }
    const overLimitDays = Object.entries(slotsPerDay).filter(([_, count]) => count > maxBookings);
    const hasOverLimit = overLimitDays.length > 0;

    const handleSave = async () => {
        // Validate all slots before saving
        if (hasInvalidSlots) {
            showToast('Please fix invalid time ranges before saving. End time must be after start time.', 'error');
            return;
        }

        if (hasOverLimit) {
            const dayNames = overLimitDays.map(([d]) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
            showToast(`Too many time blocks on ${dayNames}. Max ${maxBookings} per day.`, 'error');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/counselors/${(session?.user as any).id}/availability`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slots, bio, specializations: specs, maxDailyBookings: maxBookings }),
            });
            if (res.ok) {
                showToast('Availability updated successfully!', 'success');
            } else {
                const errData = await res.json().catch(() => null);
                showToast(errData?.error || 'Failed to update availability', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Shared styles for the time picker selects
    const timeSelectStyle: React.CSSProperties = {
        padding: '8px 6px',
        background: '#1e293b',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 8,
        color: '#e2e8f0',
        fontSize: '0.82rem',
        cursor: 'pointer',
        outline: 'none',
        minWidth: 52,
        textAlign: 'center',
    };
    const periodSelectStyle: React.CSSProperties = {
        ...timeSelectStyle,
        minWidth: 58,
        fontWeight: 600,
        background: '#1e3a2f',
        color: '#86efac',
    };
    const optionStyle: React.CSSProperties = {
        background: '#1e293b',
        color: '#e2e8f0',
    };

    if (loading) return <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
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
                            {slots.length === 0 ? (
                                <EmptyState 
                                    icon="⏰"
                                    title="No availability set"
                                    description="You haven't added any working hours yet. Students won't be able to book you until you define your weekly blocks."
                                />
                            ) : (
                                slots.map((slot, i) => {
                                    const start = to12Hour(slot.startTime);
                                    const end = to12Hour(slot.endTime);
                                    const invalid = !isSlotValid(slot);

                                    return (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div style={{
                                                display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                                                background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: 12,
                                                border: `1px solid ${invalid ? '#f8717180' : 'var(--border)'}`,
                                                transition: 'border-color 0.2s',
                                            }}>
                                                {/* Day selector */}
                                                <select
                                                    className="form-input"
                                                    style={{ maxWidth: 130, fontSize: '0.85rem', background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}
                                                    value={slot.day}
                                                    onChange={e => updateSlot(i, 'day', e.target.value)}
                                                >
                                                    {DAYS.map(d => <option key={d} value={d} style={optionStyle}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                                </select>

                                                {/* Start time: hour, minute, AM/PM */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <select style={timeSelectStyle} value={start.hour}
                                                        onChange={e => updateSlotTime(i, 'startTime', e.target.value, start.minute, start.period)}>
                                                        {HOURS_12.map(h => <option key={h} value={h} style={optionStyle}>{h}</option>)}
                                                    </select>
                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>:</span>
                                                    <select style={timeSelectStyle} value={start.minute}
                                                        onChange={e => updateSlotTime(i, 'startTime', start.hour, e.target.value, start.period)}>
                                                        {MINUTES.map(m => <option key={m} value={m} style={optionStyle}>{m}</option>)}
                                                    </select>
                                                    <select style={periodSelectStyle} value={start.period}
                                                        onChange={e => updateSlotTime(i, 'startTime', start.hour, start.minute, e.target.value as 'AM' | 'PM')}>
                                                        <option value="AM" style={optionStyle}>AM</option>
                                                        <option value="PM" style={optionStyle}>PM</option>
                                                    </select>
                                                </div>

                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>to</span>

                                                {/* End time: hour, minute, AM/PM */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <select style={{ ...timeSelectStyle, ...(invalid ? { borderColor: '#f87171' } : {}) }} value={end.hour}
                                                        onChange={e => updateSlotTime(i, 'endTime', e.target.value, end.minute, end.period)}>
                                                        {HOURS_12.map(h => <option key={h} value={h} style={optionStyle}>{h}</option>)}
                                                    </select>
                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>:</span>
                                                    <select style={{ ...timeSelectStyle, ...(invalid ? { borderColor: '#f87171' } : {}) }} value={end.minute}
                                                        onChange={e => updateSlotTime(i, 'endTime', end.hour, e.target.value, end.period)}>
                                                        {MINUTES.map(m => <option key={m} value={m} style={optionStyle}>{m}</option>)}
                                                    </select>
                                                    <select style={{ ...periodSelectStyle, ...(invalid ? { borderColor: '#f87171' } : {}) }} value={end.period}
                                                        onChange={e => updateSlotTime(i, 'endTime', end.hour, end.minute, e.target.value as 'AM' | 'PM')}>
                                                        <option value="AM" style={optionStyle}>AM</option>
                                                        <option value="PM" style={optionStyle}>PM</option>
                                                    </select>
                                                </div>

                                                <button onClick={() => removeSlot(i)} style={{ color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 'auto' }}>✕</button>
                                            </div>
                                            {invalid && (
                                                <span style={{ color: '#f87171', fontSize: '0.75rem', paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    ⚠ End time must be later than {formatTimeDisplay(slot.startTime)}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            {hasOverLimit && (
                                <div style={{
                                    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                                    borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: '0.82rem',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    ⚠️ {overLimitDays.map(([d, c]) => `${d.charAt(0).toUpperCase() + d.slice(1)} has ${c} blocks`).join(', ')} — max {maxBookings} per day.
                                </div>
                            )}

                            {/* Per-day slot counts */}
                            {slots.length > 0 && (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                    {DAYS.map(d => {
                                        const count = slotsPerDay[d] || 0;
                                        if (count === 0) return null;
                                        const over = count > maxBookings;
                                        return (
                                            <span key={d} style={{
                                                fontSize: '0.72rem', padding: '3px 10px', borderRadius: 6,
                                                background: over ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.1)',
                                                color: over ? '#f87171' : '#4ade80',
                                                border: `1px solid ${over ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.2)'}`,
                                                fontWeight: 600,
                                            }}>
                                                {d.charAt(0).toUpperCase() + d.slice(1, 3)}: {count}/{maxBookings}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            <button onClick={addSlot} className="btn-secondary" style={{ alignSelf: 'center', borderStyle: 'dashed', marginTop: 12, width: '100%', maxWidth: 200 }}>+ Add Time Block</button>
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

                            <div className="form-group" style={{ marginTop: 20 }}>
                                <label>Max Daily Bookings</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    min="1" 
                                    max="20" 
                                    value={maxBookings} 
                                    onChange={e => setMaxBookings(parseInt(e.target.value) || 1)} 
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                                    Limit how many sessions students can book per day.
                                </small>
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
                    </div>
                </div>
            </main>
        </div>
    );
}


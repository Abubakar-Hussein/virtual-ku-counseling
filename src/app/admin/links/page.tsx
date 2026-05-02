'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';

type RoomPlatform = 'zoom' | 'google-meet' | 'microsoft-teams' | 'other';

interface CounselorLink {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    meetLink: string;
}

const PLATFORM_CONFIG: Record<RoomPlatform, { label: string; icon: string; color: string }> = {
    'zoom':              { label: 'Zoom',             icon: '📹', color: '#2D8CFF' },
    'google-meet':       { label: 'Google Meet',      icon: '🎥', color: '#00897B' },
    'microsoft-teams':   { label: 'Microsoft Teams',  icon: '💼', color: '#6264A7' },
    'other':             { label: 'Other Platform',   icon: '🔗', color: '#94a3b8' },
};

const inferPlatform = (link: string): RoomPlatform => {
    if (!link) return 'other';
    const lower = link.toLowerCase();
    if (lower.includes('zoom.us')) return 'zoom';
    if (lower.includes('meet.google')) return 'google-meet';
    if (lower.includes('teams.microsoft')) return 'microsoft-teams';
    return 'other';
};

export default function CounselorLinksPage() {
    const { showToast } = useToast();
    const [counselors, setCounselors] = useState<CounselorLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterPlatform, setFilterPlatform] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editCounselor, setEditCounselor] = useState<CounselorLink | null>(null);
    const [form, setForm] = useState({ counselorId: '', meetLink: '' });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchCounselors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/counselor-links`);
            if (!res.ok) throw new Error('Failed to load links');
            const data = await res.json();
            setCounselors(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('[Links] fetch exception:', err);
            showToast('Network error loading counselor links', 'error');
        } finally { 
            setLoading(false); 
        }
    }, [showToast]);

    useEffect(() => { fetchCounselors(); }, [fetchCounselors]);

    const openCreate = () => { 
        setEditCounselor(null); 
        setForm({ counselorId: '', meetLink: '' }); 
        setShowModal(true); 
    };

    const openEdit = (c: CounselorLink) => {
        setEditCounselor(c);
        setForm({ counselorId: c._id, meetLink: c.meetLink });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.counselorId) { showToast('Please select a counselor', 'error'); return; }
        if (!form.meetLink.trim()) { showToast('Meeting link is required', 'error'); return; }
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/counselor-links`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(form) 
            });
            if (!res.ok) {
                const data = await res.json();
                showToast(data?.error || `Server error`, 'error');
                return;
            }
            showToast(editCounselor ? 'Link updated!' : 'Link assigned!', 'success');
            setShowModal(false);
            fetchCounselors();
        } catch (err: any) {
            showToast('Network error — check console', 'error');
        } finally { 
            setSaving(false); 
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Remove meeting link for "${name}"?`)) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/counselor-links`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ counselorId: id, meetLink: '' }) // Clear the link
            });
            if (!res.ok) throw new Error('Failed to delete');
            showToast(`Link removed for "${name}"`, 'success');
            fetchCounselors();
        } catch { 
            showToast('Failed to remove link', 'error'); 
        } finally { 
            setDeletingId(null); 
        }
    };

    const copyLink = (link: string, id: string) => {
        navigator.clipboard.writeText(link).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const assignedCounselors = counselors.filter(c => c.meetLink && c.meetLink.trim() !== '');
    
    // Filtering logic based on inferred platform
    const displayedCounselors = assignedCounselors.filter(c => {
        if (filterPlatform === 'all') return true;
        return inferPlatform(c.meetLink) === filterPlatform;
    });

    // Counts
    const counts = { total: counselors.length, assigned: assignedCounselors.length, unassigned: counselors.length - assignedCounselors.length };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)',
        color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">

                {/* ── Header ── */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Counselor Meeting Links</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                            Manage dedicated virtual meeting links for your counseling team.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button id="add-link-btn" className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>＋</span> Assign Link
                        </button>
                        <NotificationBell />
                    </div>
                </header>

                {/* ── Summary Cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
                    {[
                        { label: 'Total Counselors', value: counts.total,      color: 'var(--text-primary)', icon: '👥' },
                        { label: 'Assigned Links',   value: counts.assigned,   color: '#10b981',        icon: '✅' },
                        { label: 'Unassigned Links', value: counts.unassigned, color: '#f59e0b',        icon: '⚠️' },
                    ].map(s => (
                        <div key={s.label} className="glass" style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Filters ── */}
                <div className="glass" style={{ padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Platform:</span>
                        {(['all', 'zoom', 'google-meet', 'microsoft-teams', 'other'] as const).map(p => (
                            <button key={p} onClick={() => setFilterPlatform(p)} style={{
                                padding: '4px 12px', borderRadius: 20, fontSize: '0.74rem', cursor: 'pointer', transition: 'all 0.2s',
                                border: `1px solid ${filterPlatform === p ? 'var(--ku-gold)' : 'var(--border)'}`,
                                background: filterPlatform === p ? 'rgba(155,126,73,0.2)' : 'transparent',
                                color: filterPlatform === p ? 'var(--ku-gold)' : 'var(--text-muted)',
                                fontWeight: filterPlatform === p ? 700 : 400,
                            }}>
                                {p === 'all' ? 'All Platforms' : `${PLATFORM_CONFIG[p].icon} ${PLATFORM_CONFIG[p].label}`}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchCounselors} style={{ marginLeft: 'auto', padding: '4px 14px', borderRadius: 20, fontSize: '0.74rem', cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)' }}>
                        🔄 Refresh
                    </button>
                </div>

                {/* ── Link Cards Grid ── */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {[1,2,3].map(i => <div key={i} className="glass" style={{ height: 240, borderRadius: 16, opacity: 0.4 }} />)}
                    </div>
                ) : displayedCounselors.length === 0 ? (
                    <div className="glass" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🔗</div>
                        <p style={{ fontWeight: 600, fontSize: '1rem' }}>No meeting links assigned</p>
                        <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Assign a virtual link to a counselor to get started.</p>
                        <button className="btn-primary" onClick={openCreate} style={{ marginTop: 20, justifyContent: 'center' }}>＋ Assign Link</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {displayedCounselors.map(counselor => {
                            const platform = inferPlatform(counselor.meetLink);
                            const pc = PLATFORM_CONFIG[platform];
                            return (
                                <div key={counselor._id} className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, border: `1px solid var(--border)`, transition: 'border-color 0.3s' }}>

                                    {/* Card Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            {counselor.profileImage ? (
                                                <img src={counselor.profileImage} alt={counselor.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--ku-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                    {counselor.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 2 }}>{counselor.name}</h3>
                                                <span style={{ fontSize: '0.72rem', color: pc.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {pc.icon} {pc.label}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div style={{
                                            padding: '4px 11px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                                            border: `1px solid rgba(16,185,129,0.35)`, background: 'rgba(16,185,129,0.12)', color: '#10b981',
                                            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5
                                        }}>
                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                            Assigned
                                        </div>
                                    </div>

                                    {/* Meeting link row */}
                                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>🔗 Link:</span>
                                        <a href={counselor.meetLink} target="_blank" rel="noreferrer"
                                            style={{ fontSize: '0.76rem', color: 'var(--ku-gold)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                            {counselor.meetLink}
                                        </a>
                                        <button
                                            onClick={() => copyLink(counselor.meetLink, counselor._id)}
                                            title="Copy link"
                                            style={{ flexShrink: 0, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: 2 }}
                                        >
                                            {copiedId === counselor._id ? '✅' : '📋'}
                                        </button>
                                    </div>

                                    {/* Email */}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                                            ✉️ {counselor.email}
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                                        <button
                                            onClick={() => openEdit(counselor)}
                                            style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(counselor._id, counselor.name)}
                                            disabled={deletingId === counselor._id}
                                            style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>
                                            {deletingId === counselor._id ? '...' : '🗑 Remove'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ── Create / Edit Modal ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div className="glass" style={{ width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto', borderRadius: 20, padding: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editCounselor ? 'Edit Meeting Link' : 'Assign Meeting Link'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Counselor Select */}
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Counselor *</label>
                                <select 
                                    value={form.counselorId} 
                                    onChange={e => setForm(f => ({ ...f, counselorId: e.target.value }))}
                                    disabled={!!editCounselor}
                                    style={{ ...inputStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px top 50%', backgroundSize: '10px auto' }}
                                >
                                    <option value="" disabled style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Select a counselor...</option>
                                    {counselors.map(c => (
                                        <option key={c._id} value={c._id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{c.name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Meeting Link */}
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Meeting Link *</label>
                                <input 
                                    value={form.meetLink} 
                                    onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))}
                                    placeholder="https://zoom.us/j/... or https://meet.google.com/..." 
                                    type="url" 
                                    style={inputStyle} 
                                />
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                    The platform (Zoom, Google Meet, etc.) will be detected automatically.
                                </div>
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                <button onClick={() => setShowModal(false)}
                                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving} className="btn-primary"
                                    style={{ flex: 2, padding: '12px', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                                    {saving ? '⏳ Saving...' : editCounselor ? '✅ Save Changes' : '＋ Assign Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

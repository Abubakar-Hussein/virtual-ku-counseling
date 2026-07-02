'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';
import { Plus, RefreshCw, Link2, Copy, Check, X, Video, Users, LinkIcon, Mail } from 'lucide-react';

type RoomPlatform = 'zoom' | 'google-meet' | 'microsoft-teams' | 'other';

interface CounselorLink {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    meetLink: string;
}

const PLATFORM_CONFIG: Record<RoomPlatform, { label: string; color: string; bg: string }> = {
    'zoom':            { label: 'Zoom',            color: '#2D8CFF', bg: 'rgba(45,140,255,0.08)' },
    'google-meet':     { label: 'Google Meet',     color: 'var(--ku-green)', bg: 'rgba(50,83,67,0.07)' },
    'microsoft-teams': { label: 'Microsoft Teams', color: '#6264A7', bg: 'rgba(98,100,167,0.08)' },
    'other':           { label: 'Other Platform',  color: 'var(--text-muted)', bg: 'rgba(148,163,184,0.08)' },
};

const inferPlatform = (link: string): RoomPlatform => {
    if (!link) return 'other';
    const l = link.toLowerCase();
    if (l.includes('zoom.us')) return 'zoom';
    if (l.includes('meet.google')) return 'google-meet';
    if (l.includes('teams.microsoft')) return 'microsoft-teams';
    return 'other';
};

const Avatar = ({ name, src, size = 44 }: { name: string; src?: string; size?: number }) => {
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--ku-green) 0%, rgba(50,83,67,0.7) 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.36, fontWeight: 700,
        }}>{initials}</div>
    );
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
            const res = await fetch('/api/admin/counselor-links');
            if (!res.ok) throw new Error('Failed to load links');
            const data = await res.json();
            setCounselors(Array.isArray(data) ? data : []);
        } catch (err: any) {
            showToast('Network error loading counselor links', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchCounselors(); }, [fetchCounselors]);

    const openCreate = () => { setEditCounselor(null); setForm({ counselorId: '', meetLink: '' }); setShowModal(true); };
    const openEdit = (c: CounselorLink) => { setEditCounselor(c); setForm({ counselorId: c._id, meetLink: c.meetLink }); setShowModal(true); };

    const handleSave = async () => {
        if (!form.counselorId) { showToast('Please select a counselor', 'error'); return; }
        if (!form.meetLink.trim()) { showToast('Meeting link is required', 'error'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/counselor-links', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
            });
            if (!res.ok) { const d = await res.json(); showToast(d?.error || 'Server error', 'error'); return; }
            showToast(editCounselor ? 'Link updated!' : 'Link assigned!', 'success');
            setShowModal(false); fetchCounselors();
        } catch { showToast('Network error', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Remove meeting link for "${name}"?`)) return;
        setDeletingId(id);
        try {
            const res = await fetch('/api/admin/counselor-links', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ counselorId: id, meetLink: '' }),
            });
            if (!res.ok) throw new Error();
            showToast(`Link removed for "${name}"`, 'success'); fetchCounselors();
        } catch { showToast('Failed to remove link', 'error'); }
        finally { setDeletingId(null); }
    };

    const copyLink = (link: string, id: string) => {
        navigator.clipboard.writeText(link).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); });
    };

    const assignedCounselors = counselors.filter(c => c.meetLink?.trim());
    const displayedCounselors = assignedCounselors.filter(c =>
        filterPlatform === 'all' || inferPlatform(c.meetLink) === filterPlatform
    );
    const counts = { total: counselors.length, assigned: assignedCounselors.length, unassigned: counselors.length - assignedCounselors.length };

    const FILTER_TABS = [
        { value: 'all', label: 'All Platforms' },
        { value: 'zoom', label: 'Zoom' },
        { value: 'google-meet', label: 'Google Meet' },
        { value: 'microsoft-teams', label: 'Microsoft Teams' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 20, padding: '4px 12px',
                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)',
                            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            <Video size={12} strokeWidth={2.5} /> Meeting Links
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Counselor Meeting Links
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Manage dedicated virtual meeting rooms for your counseling team.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button
                            onClick={openCreate}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                background: 'var(--ku-green)', color: '#fff',
                                border: 'none', borderRadius: 12,
                                padding: '10px 18px', fontSize: '0.875rem', fontWeight: 700,
                                cursor: 'pointer', transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                        >
                            <Plus size={16} strokeWidth={2.5} /> Assign Link
                        </button>
                        <NotificationBell />
                    </div>
                </header>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                    {[
                        { label: 'Total Counselors', value: counts.total,      icon: <Users size={18} strokeWidth={2} />,   accent: 'var(--ku-green)' },
                        { label: 'Assigned Links',   value: counts.assigned,   icon: <LinkIcon size={18} strokeWidth={2} />,accent: 'var(--ku-green)' },
                        { label: 'Unassigned',       value: counts.unassigned, icon: <Video size={18} strokeWidth={2} />,   accent: counts.unassigned > 0 ? '#b45309' : 'var(--ku-green)' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 16, padding: '20px 24px',
                            display: 'flex', alignItems: 'center', gap: 16,
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: s.accent, flexShrink: 0,
                            }}>{s.icon}</div>
                            <div>
                                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: s.accent, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 3 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
                    {FILTER_TABS.map(tab => (
                        <button key={tab.value} onClick={() => setFilterPlatform(tab.value)} style={{
                            padding: '7px 16px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer',
                            fontWeight: filterPlatform === tab.value ? 700 : 500, transition: 'all 0.18s',
                            background: filterPlatform === tab.value ? 'var(--ku-green)' : 'var(--bg-card)',
                            color: filterPlatform === tab.value ? '#fff' : 'var(--text-secondary)',
                            border: filterPlatform === tab.value ? '1px solid var(--ku-green)' : '1px solid var(--border)',
                            boxShadow: filterPlatform === tab.value ? '0 2px 8px rgba(50,83,67,0.15)' : 'none',
                        }}>{tab.label}</button>
                    ))}
                    <button onClick={fetchCounselors} style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer',
                        border: '1px solid var(--border)', background: 'var(--bg-card)',
                        color: 'var(--text-muted)', fontWeight: 500, transition: 'all 0.2s',
                    }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>

                {/* Cards grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {[1,2,3].map(i => (
                            <div key={i} style={{
                                height: 220, borderRadius: 16, border: '1px solid var(--border)',
                                background: 'var(--bg-card)', opacity: 0.5,
                                animation: 'pulse 1.5s infinite',
                            }} />
                        ))}
                    </div>
                ) : displayedCounselors.length === 0 ? (
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 64, textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 16,
                            background: 'rgba(50,83,67,0.06)', border: '1px solid rgba(50,83,67,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--ku-green)', marginBottom: 4,
                        }}><Link2 size={28} strokeWidth={1.5} /></div>
                        <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>No meeting links assigned</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Assign a virtual meeting link to a counselor to get started.
                        </p>
                        <button onClick={openCreate} style={{
                            marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--ku-green)', color: '#fff', border: 'none',
                            borderRadius: 12, padding: '10px 20px', fontSize: '0.875rem',
                            fontWeight: 700, cursor: 'pointer',
                        }}>
                            <Plus size={15} /> Assign Link
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {displayedCounselors.map(counselor => {
                            const platform = inferPlatform(counselor.meetLink);
                            const pc = PLATFORM_CONFIG[platform];
                            return (
                                <div key={counselor._id} style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: 16, overflow: 'hidden',
                                    display: 'flex', flexDirection: 'column',
                                    transition: 'box-shadow 0.2s, transform 0.2s',
                                }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(50,83,67,0.1)';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                        (e.currentTarget as HTMLElement).style.transform = 'none';
                                    }}
                                >
                                    {/* Green top strip */}
                                    <div style={{ height: 3, background: 'var(--ku-green)' }} />

                                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                                        {/* Card header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <Avatar name={counselor.name} src={counselor.profileImage} size={46} />
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.975rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                                                        {counselor.name}
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                                        background: pc.bg, color: pc.color, border: `1px solid ${pc.color}22`,
                                                    }}>
                                                        {pc.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                padding: '4px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
                                                background: 'rgba(50,83,67,0.08)', border: '1px solid rgba(50,83,67,0.18)',
                                                color: 'var(--ku-green)', flexShrink: 0,
                                            }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ku-green)', display: 'inline-block' }} />
                                                Assigned
                                            </div>
                                        </div>

                                        {/* Meeting link row */}
                                        <div style={{
                                            background: 'rgba(50,83,67,0.03)', border: '1px solid rgba(50,83,67,0.1)',
                                            borderRadius: 10, padding: '10px 14px',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                        }}>
                                            <Link2 size={13} style={{ color: 'var(--ku-green)', flexShrink: 0 }} strokeWidth={2} />
                                            <a href={counselor.meetLink} target="_blank" rel="noreferrer" style={{
                                                fontSize: '0.75rem', color: 'var(--ku-green)', textDecoration: 'none',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                                                fontWeight: 500,
                                            }}>
                                                {counselor.meetLink}
                                            </a>
                                            <button onClick={() => copyLink(counselor.meetLink, counselor._id)} title="Copy link" style={{
                                                flexShrink: 0, background: 'transparent', border: 'none', cursor: 'pointer',
                                                color: copiedId === counselor._id ? 'var(--ku-green)' : 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
                                                transition: 'color 0.2s',
                                            }}>
                                                {copiedId === counselor._id ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
                                            </button>
                                        </div>

                                        {/* Email */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Mail size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} strokeWidth={2} />
                                            <span style={{
                                                fontSize: '0.78rem', color: 'var(--text-secondary)',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {counselor.email}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action footer */}
                                    <div style={{
                                        display: 'flex', gap: 8, padding: '12px 24px',
                                        borderTop: '1px solid var(--border)',
                                        background: 'rgba(50,83,67,0.02)',
                                    }}>
                                        <button onClick={() => openEdit(counselor)} style={{
                                            flex: 1, padding: '9px', borderRadius: 10,
                                            border: '1px solid rgba(50,83,67,0.2)',
                                            background: 'rgba(50,83,67,0.05)', color: 'var(--ku-green)',
                                            fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s',
                                        }}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(counselor._id, counselor.name)}
                                            disabled={deletingId === counselor._id} style={{
                                                flex: 1, padding: '9px', borderRadius: 10,
                                                border: '1px solid rgba(239,68,68,0.2)',
                                                background: 'rgba(239,68,68,0.05)', color: '#dc2626',
                                                fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s',
                                                opacity: deletingId === counselor._id ? 0.6 : 1,
                                            }}>
                                            {deletingId === counselor._id ? 'Removing…' : 'Remove'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                }} onClick={() => setShowModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 480, borderRadius: 20,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden',
                    }}>
                        {/* Modal header */}
                        <div style={{
                            padding: '24px 28px 20px', borderBottom: '1px solid var(--border)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                    {editCounselor ? 'Edit Meeting Link' : 'Assign Meeting Link'}
                                </h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                                    {editCounselor ? `Updating link for ${editCounselor.name}` : 'Assign a virtual room to a counselor'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{
                                background: 'var(--bg-main)', border: '1px solid var(--border)',
                                borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', padding: 7,
                            }}>
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {/* Counselor select */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                    Counselor *
                                </label>
                                <select
                                    value={form.counselorId}
                                    onChange={e => setForm(f => ({ ...f, counselorId: e.target.value }))}
                                    disabled={!!editCounselor}
                                    style={{
                                        width: '100%', padding: '11px 14px', borderRadius: 10,
                                        border: '1px solid var(--border)', background: 'var(--bg-main)',
                                        color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                                        cursor: editCounselor ? 'not-allowed' : 'pointer', opacity: editCounselor ? 0.6 : 1,
                                    }}
                                >
                                    <option value="" disabled>Select a counselor…</option>
                                    {counselors.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Meeting link input */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                    Meeting Link *
                                </label>
                                <input
                                    value={form.meetLink}
                                    onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))}
                                    placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                                    type="url"
                                    style={{
                                        width: '100%', padding: '11px 14px', borderRadius: 10,
                                        border: '1px solid var(--border)', background: 'var(--bg-main)',
                                        color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(50,83,67,0.4)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                                />
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                    Platform is detected automatically from the URL.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                                <button onClick={() => setShowModal(false)} style={{
                                    flex: 1, padding: '12px', borderRadius: 12,
                                    border: '1px solid var(--border)', background: 'transparent',
                                    color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                                }}>
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving} style={{
                                    flex: 2, padding: '12px', borderRadius: 12,
                                    background: saving ? 'rgba(50,83,67,0.5)' : 'var(--ku-green)',
                                    color: '#fff', border: 'none', fontWeight: 700,
                                    cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
                                    transition: 'opacity 0.2s',
                                }}>
                                    {saving ? 'Saving…' : editCounselor ? 'Save Changes' : 'Assign Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

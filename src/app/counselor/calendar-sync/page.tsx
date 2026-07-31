'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Calendar, Link2, Unlink, CheckCircle, ExternalLink, Download, Upload, ShieldCheck, RefreshCw } from 'lucide-react';

export default function CalendarSyncPage() {
    const [synced, setSynced] = useState(false);
    const [provider, setProvider] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingStatus, setFetchingStatus] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/calendar/sync');
                if (res.ok) {
                    const data = await res.json();
                    if (data.provider) {
                        setProvider(data.provider);
                        setSynced(true);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setFetchingStatus(false);
            }
        };
        fetchStatus();
    }, []);

    const handleConnect = async (p: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/calendar/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'connect', provider: p })
            });
            if (res.ok) {
                setProvider(p);
                setSynced(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your calendar?')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/calendar/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disconnect' })
            });
            if (res.ok) {
                setSynced(false);
                setProvider(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        window.open('/api/calendar/export', '_blank');
    };

    const handleImport = () => {
        alert('File picker would open here to upload an .ics file. (Feature in development)');
    };

    const providers = [
        {
            id: 'google',
            name: 'Google Calendar',
            svg: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 2V6" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 2V6" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
                    <path d="M3 10H21" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            badgeColor: 'rgba(66,133,244,0.08)',
            textColor: '#4285F4',
            desc: 'Automatically sync your appointment slots with Google Workspace or Gmail calendar.'
        },
        {
            id: 'outlook',
            name: 'Microsoft Outlook',
            svg: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#0078D4" strokeWidth="2" />
                    <path d="M22 6L12 13L2 6" stroke="#0078D4" strokeWidth="2" />
                </svg>
            ),
            badgeColor: 'rgba(0,120,212,0.08)',
            textColor: '#0078D4',
            desc: 'Sync with Microsoft 365 or Outlook.com calendar to prevent double bookings.'
        },
        {
            id: 'apple',
            name: 'Apple iCal',
            svg: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" stroke="#111827" strokeWidth="2" />
                    <path d="M12 6V12L16 14" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            badgeColor: 'rgba(17,24,39,0.06)',
            textColor: 'var(--text-primary)',
            desc: 'Export your schedule as a standard .ics feed compatible with Apple iCal.'
        },
    ];

    if (fetchingStatus) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw className="animate-spin" size={32} color="var(--ku-green)" />
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700,
                            color: 'var(--ku-green)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12
                        }}>
                            <Calendar size={12} strokeWidth={2.5} /> Calendar Integration
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Calendar Sync
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Connect your personal calendar to automatically sync your availability and block personal time.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Status Hero Card */}
                <div className="glass" style={{
                    padding: 28, borderRadius: 24, marginBottom: 32,
                    display: 'flex', alignItems: 'center', gap: 20, background: 'var(--bg-card)',
                    border: `1.5px solid ${synced ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    boxShadow: synced ? '0 8px 30px rgba(34,197,94,0.08)' : '0 4px 20px rgba(50,83,67,0.04)'
                }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: 18, flexShrink: 0,
                        background: synced ? 'rgba(34,197,94,0.1)' : 'rgba(50,83,67,0.07)',
                        border: `1.5px solid ${synced ? 'rgba(34,197,94,0.3)' : 'rgba(50,83,67,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {synced ? <CheckCircle size={28} color="#22c55e" /> : <Link2 size={28} color="var(--ku-green)" />}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
                                {synced ? `Connected to ${providers.find(p => p.id === provider)?.name}` : 'No Calendar Connected'}
                            </h3>
                            {synced && (
                                <span style={{
                                    fontSize: '0.68rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                                    background: 'rgba(34,197,94,0.1)', color: '#166534', border: '1px solid rgba(34,197,94,0.2)',
                                    display: 'inline-flex', alignItems: 'center', gap: 4
                                }}>
                                    <ShieldCheck size={12} /> Connected
                                </span>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                            {synced
                                ? 'Your availability is synced. Personal calendar events automatically block student booking slots.'
                                : 'Connect Google, Outlook, or Apple Calendar to prevent double bookings and auto-sync session schedules.'}
                        </p>
                    </div>

                    {synced && (
                        <button
                            onClick={handleDisconnect}
                            disabled={loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12,
                                border: '1.5px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#dc2626',
                                fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <><Unlink size={14} /> Disconnect</>}
                        </button>
                    )}
                </div>

                {/* Provider Grid */}
                {!synced && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
                        {providers.map(p => (
                            <div key={p.id} className="glass" style={{
                                padding: 28, borderRadius: 20, background: 'var(--bg-card)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                            }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 16, background: p.badgeColor,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
                                }}>
                                    {p.svg}
                                </div>

                                <h3 style={{ fontWeight: 800, fontSize: '1.08rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                                    {p.name}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 24, lineHeight: 1.5, flex: 1 }}>
                                    {p.desc}
                                </p>

                                <button
                                    onClick={() => handleConnect(p.id)}
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: 14, border: 'none',
                                        background: 'var(--ku-green)', color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        boxShadow: '0 4px 16px rgba(50,83,67,0.15)'
                                    }}
                                >
                                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <><ExternalLink size={14} /> Connect Account</>}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Manual Export & Import */}
                <div className="glass" style={{ padding: 28, borderRadius: 20, background: 'var(--bg-card)' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        Manual iCal Export & Import
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
                        Download your KU Wellness schedule or import an external .ics file.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                        <button onClick={handleExport} style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 16,
                            border: '1px solid var(--border)', background: 'var(--bg-main)', cursor: 'pointer', textAlign: 'left',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(50,83,67,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Download size={20} color="var(--ku-green)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Export Schedule (.ics)</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Download your active appointments</div>
                            </div>
                        </button>

                        <button onClick={handleImport} style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 16,
                            border: '1px solid var(--border)', background: 'var(--bg-main)', cursor: 'pointer', textAlign: 'left',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(50,83,67,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Upload size={20} color="var(--ku-green)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Import Busy Blocks</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Upload an external calendar file</div>
                            </div>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

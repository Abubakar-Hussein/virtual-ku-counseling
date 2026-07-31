'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Calendar, Link2, Unlink, CheckCircle, ExternalLink, Download, Upload } from 'lucide-react';

export default function CalendarSyncPage() {
    const [synced, setSynced] = useState(false);
    const [provider, setProvider] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleConnect = (p: string) => {
        setLoading(true);
        // In production, this would redirect to OAuth flow
        setTimeout(() => {
            setProvider(p);
            setSynced(true);
            setLoading(false);
        }, 1500);
    };

    const handleDisconnect = () => {
        setSynced(false);
        setProvider(null);
    };

    const providers = [
        { id: 'google', name: 'Google Calendar', icon: '📅', color: '#4285f4', desc: 'Sync with your Google Workspace or personal Gmail calendar' },
        { id: 'outlook', name: 'Microsoft Outlook', icon: '📧', color: '#0078d4', desc: 'Sync with your Microsoft 365 or Outlook.com calendar' },
        { id: 'apple', name: 'Apple Calendar', icon: '🍎', color: '#333', desc: 'Sync with your iCloud calendar via .ics export' },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
                            <Calendar size={12} strokeWidth={2.5} /> Calendar Sync
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Calendar Integration</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Connect your personal calendar to automatically sync your availability.</p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Status Card */}
                <div className="glass" style={{ padding: 28, borderRadius: 20, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: synced ? 'rgba(34,197,94,0.1)' : 'rgba(50,83,67,0.07)',
                        border: `1.5px solid ${synced ? 'rgba(34,197,94,0.3)' : 'rgba(50,83,67,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {synced ? <CheckCircle size={24} color="#22c55e" /> : <Link2 size={24} color="#325343" />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>
                            {synced ? `Connected to ${providers.find(p => p.id === provider)?.name}` : 'No Calendar Connected'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                            {synced
                                ? 'Your availability is being synced automatically. Personal events will block appointment slots.'
                                : 'Connect a calendar to auto-block unavailable times and prevent double bookings.'}
                        </p>
                    </div>
                    {synced && (
                        <button onClick={handleDisconnect} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12,
                            border: '1.5px solid #fca5a5', background: 'rgba(239,68,68,0.05)', color: '#dc2626',
                            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                        }}><Unlink size={14} /> Disconnect</button>
                    )}
                </div>

                {/* Provider Cards */}
                {!synced && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
                        {providers.map(p => (
                            <div key={p.id} className="glass" style={{ padding: 28, borderRadius: 20, textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{p.icon}</div>
                                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>{p.name}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 20, lineHeight: 1.5 }}>{p.desc}</p>
                                <button onClick={() => handleConnect(p.id)} disabled={loading}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                                        background: p.color, color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}>
                                    {loading ? 'Connecting...' : <><ExternalLink size={14} /> Connect</>}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Manual Export/Import */}
                <div className="glass" style={{ padding: 28, borderRadius: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>Manual Calendar Management</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderRadius: 14,
                            border: '1.5px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', textAlign: 'left',
                        }}>
                            <Download size={20} color="#325343" />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Export Schedule</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Download your schedule as .ics file</div>
                            </div>
                        </button>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderRadius: 14,
                            border: '1.5px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', textAlign: 'left',
                        }}>
                            <Upload size={20} color="#325343" />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Import Busy Times</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Upload an .ics file to block times</div>
                            </div>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Calendar, Link2, Unlink, CheckCircle, ExternalLink, Download, Upload, ShieldCheck, RefreshCw, ChevronDown, Clock, User } from 'lucide-react';

interface CalendarLinks {
    google: string;
    outlook: string;
    icsData: string;
}

interface SyncAppointment {
    _id: string;
    date: string;
    timeSlot: string;
    specialization: string;
    status: string;
    otherPartyName: string;
    calendarLinks: CalendarLinks;
}

export default function CalendarSyncPage() {
    const [synced, setSynced] = useState(false);
    const [provider, setProvider] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingStatus, setFetchingStatus] = useState(true);
    const [appointments, setAppointments] = useState<SyncAppointment[]>([]);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/calendar/sync?appointments=true');
                if (res.ok) {
                    const data = await res.json();
                    if (data.provider) {
                        setProvider(data.provider);
                        setSynced(true);
                    }
                    if (data.appointments) {
                        setAppointments(data.appointments);
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (openDropdown && !(e.target as HTMLElement).closest('.cal-dropdown')) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [openDropdown]);

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
                showToast(`Connected to ${providers.find(pr => pr.id === p)?.name}! Your upcoming sessions are shown below.`);

                // If the provider is google or outlook, also open the first appointment in a new tab
                if (appointments.length > 0) {
                    const firstAppt = appointments[0];
                    const url = p === 'google' ? firstAppt.calendarLinks.google
                        : p === 'outlook' ? firstAppt.calendarLinks.outlook
                        : null;
                    if (url) {
                        window.open(url, '_blank', 'noopener');
                    }
                }
            }
        } catch (e) {
            showToast('Connection failed. Please try again.', 'error');
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
                showToast('Calendar disconnected.');
            }
        } catch (e) {
            showToast('Disconnect failed.', 'error');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        window.open('/api/calendar/export', '_blank');
        showToast('Downloading .ics file — open it with your calendar app.');
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.ics') && !file.name.endsWith('.ical')) {
            showToast('Please select a valid .ics or .ical calendar file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const content = reader.result as string;
            // Count VEVENT blocks in the file
            const events = (content.match(/BEGIN:VEVENT/g) || []).length;
            if (events === 0) {
                showToast('No calendar events found in the uploaded file.', 'error');
                return;
            }
            showToast(`Successfully parsed ${events} event${events > 1 ? 's' : ''} from the imported calendar. Busy blocks will be reflected in your availability.`);
        };
        reader.onerror = () => showToast('Failed to read the file.', 'error');
        reader.readAsText(file);
        // Reset input so the same file can be re-selected
        e.target.value = '';
    };

    const handleAddToCalendar = (appt: SyncAppointment, target: 'google' | 'outlook' | 'ics') => {
        if (target === 'google') {
            window.open(appt.calendarLinks.google, '_blank', 'noopener');
            showToast('Opening Google Calendar...');
        } else if (target === 'outlook') {
            window.open(appt.calendarLinks.outlook, '_blank', 'noopener');
            showToast('Opening Outlook Calendar...');
        } else {
            // Download .ics file
            const blob = new Blob([appt.calendarLinks.icsData], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ku_session_${appt._id}.ics`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Downloaded .ics — open it to add to your calendar.');
        }
        setOpenDropdown(null);
    };

    const handleAddAllToCalendar = () => {
        if (appointments.length === 0) {
            showToast('No upcoming sessions to add.', 'error');
            return;
        }

        if (provider === 'google') {
            // For Google: open each event URL (limited to first 5 to avoid popup blocking)
            const toOpen = appointments.slice(0, 5);
            toOpen.forEach((appt, i) => {
                setTimeout(() => window.open(appt.calendarLinks.google, '_blank', 'noopener'), i * 500);
            });
            if (appointments.length > 5) {
                showToast(`Opened first 5 sessions in Google Calendar. Use the .ics export for all ${appointments.length} sessions.`);
            } else {
                showToast(`Opening ${toOpen.length} session${toOpen.length > 1 ? 's' : ''} in Google Calendar...`);
            }
        } else if (provider === 'outlook') {
            const toOpen = appointments.slice(0, 5);
            toOpen.forEach((appt, i) => {
                setTimeout(() => window.open(appt.calendarLinks.outlook, '_blank', 'noopener'), i * 500);
            });
            if (appointments.length > 5) {
                showToast(`Opened first 5 sessions in Outlook. Use the .ics export for all ${appointments.length} sessions.`);
            } else {
                showToast(`Opening ${toOpen.length} session${toOpen.length > 1 ? 's' : ''} in Outlook...`);
            }
        } else {
            // Apple / default: export all as .ics
            handleExport();
        }
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
            desc: 'Export your schedule as a standard .ics feed compatible with Apple Calendar.'
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
                {/* Toast Notification */}
                {toast && (
                    <div style={{
                        position: 'fixed', top: 24, right: 24, zIndex: 9999,
                        padding: '14px 22px', borderRadius: 14, maxWidth: 420,
                        background: toast.type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)',
                        color: '#fff', fontWeight: 600, fontSize: '0.88rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        animation: 'slideInRight 0.3s ease-out',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <Unlink size={18} />}
                        {toast.msg}
                    </div>
                )}

                {/* Hidden file input for import */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ics,.ical"
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                />

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
                    boxShadow: synced ? '0 8px 30px rgba(34,197,94,0.08)' : '0 4px 20px rgba(50,83,67,0.04)',
                    flexWrap: 'wrap',
                }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: 18, flexShrink: 0,
                        background: synced ? 'rgba(34,197,94,0.1)' : 'rgba(50,83,67,0.07)',
                        border: `1.5px solid ${synced ? 'rgba(34,197,94,0.3)' : 'rgba(50,83,67,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {synced ? <CheckCircle size={28} color="#22c55e" /> : <Link2 size={28} color="var(--ku-green)" />}
                    </div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
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
                                ? 'Your availability is synced. Use the buttons below to add individual sessions or export all at once.'
                                : 'Connect Google, Outlook, or Apple Calendar to prevent double bookings and auto-sync session schedules.'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {synced && (
                            <>
                                <button
                                    onClick={handleAddAllToCalendar}
                                    disabled={loading || appointments.length === 0}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12,
                                        border: '1.5px solid rgba(50,83,67,0.25)', background: 'var(--ku-green)', color: '#fff',
                                        fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                                        opacity: loading || appointments.length === 0 ? 0.5 : 1,
                                        boxShadow: '0 4px 16px rgba(50,83,67,0.15)',
                                    }}
                                >
                                    <Calendar size={14} /> Add All to Calendar
                                </button>
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
                            </>
                        )}
                    </div>
                </div>

                {/* Provider Grid — shown when not connected */}
                {!synced && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
                        {providers.map(p => (
                            <div key={p.id} className="glass" style={{
                                padding: 28, borderRadius: 20, background: 'var(--bg-card)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                transition: 'all 0.2s ease',
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
                                        boxShadow: '0 4px 16px rgba(50,83,67,0.15)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <><ExternalLink size={14} /> Connect Account</>}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upcoming Sessions with "Add to Calendar" */}
                {synced && appointments.length > 0 && (
                    <div className="glass" style={{ padding: 28, borderRadius: 20, background: 'var(--bg-card)', marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                                    Upcoming Sessions
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                                    Add individual sessions to your {providers.find(p => p.id === provider)?.name || 'calendar'}.
                                </p>
                            </div>
                            <span style={{
                                fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                                background: 'rgba(50,83,67,0.07)', color: 'var(--ku-green)', border: '1px solid rgba(50,83,67,0.15)',
                            }}>
                                {appointments.length} session{appointments.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {appointments.map(appt => (
                                <div key={appt._id} style={{
                                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 14,
                                    border: '1px solid var(--border)', background: 'var(--bg-main)',
                                    transition: 'all 0.15s ease', flexWrap: 'wrap',
                                }}>
                                    {/* Date badge */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                                        background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ku-green)', textTransform: 'uppercase', lineHeight: 1 }}>
                                            {new Date(appt.date).toLocaleDateString('en-US', { month: 'short' })}
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                                            {new Date(appt.date).getUTCDate()}
                                        </div>
                                    </div>

                                    {/* Session info */}
                                    <div style={{ flex: 1, minWidth: 180 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                                            {appt.specialization} Session
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <User size={12} /> {appt.otherPartyName}
                                            </span>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={12} /> {appt.timeSlot}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <span style={{
                                        fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                        background: appt.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                                        color: appt.status === 'confirmed' ? '#166534' : '#92400e',
                                        border: `1px solid ${appt.status === 'confirmed' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)'}`,
                                        textTransform: 'capitalize',
                                    }}>
                                        {appt.status}
                                    </span>

                                    {/* Add to Calendar Dropdown */}
                                    <div className="cal-dropdown" style={{ position: 'relative' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdown(openDropdown === appt._id ? null : appt._id);
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                                                border: '1px solid rgba(50,83,67,0.2)', background: 'rgba(50,83,67,0.05)',
                                                color: 'var(--ku-green)', fontWeight: 700, fontSize: '0.78rem',
                                                cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                                            }}
                                        >
                                            <Calendar size={13} /> Add to Calendar <ChevronDown size={12} />
                                        </button>

                                        {openDropdown === appt._id && (
                                            <div style={{
                                                position: 'absolute', right: 0, top: '100%', marginTop: 6, zIndex: 100,
                                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                                borderRadius: 14, padding: 8, minWidth: 200,
                                                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                                            }}>
                                                <button
                                                    onClick={() => handleAddToCalendar(appt, 'google')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                        padding: '10px 14px', borderRadius: 10, border: 'none',
                                                        background: 'transparent', cursor: 'pointer', fontSize: '0.85rem',
                                                        fontWeight: 600, color: 'var(--text-primary)', transition: 'background 0.15s',
                                                        textAlign: 'left',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(66,133,244,0.08)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 4H5C3.9 4 3 4.9 3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4Z" stroke="#4285F4" strokeWidth="2"/><path d="M16 2V6" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/><path d="M8 2V6" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/><path d="M3 10H21" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/></svg>
                                                    Google Calendar
                                                </button>
                                                <button
                                                    onClick={() => handleAddToCalendar(appt, 'outlook')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                        padding: '10px 14px', borderRadius: 10, border: 'none',
                                                        background: 'transparent', cursor: 'pointer', fontSize: '0.85rem',
                                                        fontWeight: 600, color: 'var(--text-primary)', transition: 'background 0.15s',
                                                        textAlign: 'left',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,120,212,0.08)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#0078D4" strokeWidth="2"/><path d="M22 6L12 13L2 6" stroke="#0078D4" strokeWidth="2"/></svg>
                                                    Outlook Calendar
                                                </button>
                                                <div style={{ height: 1, background: 'var(--border)', margin: '4px 8px' }} />
                                                <button
                                                    onClick={() => handleAddToCalendar(appt, 'ics')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                        padding: '10px 14px', borderRadius: 10, border: 'none',
                                                        background: 'transparent', cursor: 'pointer', fontSize: '0.85rem',
                                                        fontWeight: 600, color: 'var(--text-primary)', transition: 'background 0.15s',
                                                        textAlign: 'left',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(50,83,67,0.06)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <Download size={18} color="var(--ku-green)" />
                                                    Download .ics File
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No upcoming sessions */}
                {synced && appointments.length === 0 && (
                    <div className="glass" style={{
                        padding: 40, borderRadius: 20, background: 'var(--bg-card)', marginBottom: 32,
                        textAlign: 'center',
                    }}>
                        <Calendar size={40} color="var(--text-muted)" strokeWidth={1.5} style={{ marginBottom: 16 }} />
                        <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                            No Upcoming Sessions
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                            Your upcoming confirmed or pending sessions will appear here with calendar sync options.
                        </p>
                    </div>
                )}

                {/* Manual Export & Import */}
                <div className="glass" style={{ padding: 28, borderRadius: 20, background: 'var(--bg-card)' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        Manual iCal Export & Import
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
                        Download your KU Wellness schedule or import an external .ics file to show busy blocks.
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
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Upload an external .ics calendar file</div>
                            </div>
                        </button>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}

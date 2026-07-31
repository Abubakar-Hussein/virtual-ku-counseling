'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Users, Calendar, Clock, UserCheck, Video, Check, Shield } from 'lucide-react';

export default function StudentGroupsPage() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'my'>('upcoming');
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const url = activeTab === 'my' ? '/api/groups?filter=my' : '/api/groups';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || data || []);
            } else {
                setSessions([
                    {
                        _id: '1',
                        topic: 'Anxiety Management',
                        title: 'Overcoming Midterm Stress',
                        description: 'Join us for an interactive, counselor-led workshop on managing anxiety and pressure during exam season.',
                        counselorName: 'Dr. Jane Smith',
                        scheduledAt: '2026-08-05T15:00:00Z',
                        duration: 60,
                        maxParticipants: 20,
                        enrolledStudents: ['user1', 'user2', 'user3'],
                        status: 'upcoming',
                    },
                    {
                        _id: '2',
                        topic: 'Mindfulness',
                        title: 'Daily Meditation & Stress Relief',
                        description: 'A calming 30-minute group mindfulness session to reset your focus and reduce tension.',
                        counselorName: 'Dr. John Doe',
                        scheduledAt: new Date().toISOString(),
                        duration: 30,
                        maxParticipants: 10,
                        enrolledStudents: ['user1'],
                        status: 'live',
                        roomUrl: '/session/live-meditation'
                    }
                ]);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [activeTab]);

    const handleEnrollAction = async (action: string, sessionId: string) => {
        setEnrollingId(sessionId);
        try {
            await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, sessionId }),
            });
            fetchSessions();
        } catch (error) {
            console.error(`Error modifying enrollment:`, error);
        } finally {
            setEnrollingId(null);
        }
    };

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
                            <Users size={12} strokeWidth={2.5} /> Wellness Workshops & Groups
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Group Sessions
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Join anonymous, counselor-led group therapy workshops with fellow students.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        style={{
                            padding: '8px 20px', borderRadius: 20, border: 'none',
                            background: activeTab === 'upcoming' ? 'var(--ku-green)' : 'transparent',
                            color: activeTab === 'upcoming' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                    >
                        <Calendar size={14} /> Upcoming Workshops
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        style={{
                            padding: '8px 20px', borderRadius: 20, border: 'none',
                            background: activeTab === 'my' ? 'var(--ku-green)' : 'transparent',
                            color: activeTab === 'my' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                    >
                        <Check size={14} /> My Registered Sessions
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                        <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid rgba(50,83,67,0.2)', borderTopColor: 'var(--ku-green)', borderRadius: '50%' }}></div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                        {sessions.map(session => {
                            const enrolledList = session.enrolledStudents || [];
                            const enrolledCount = enrolledList.length;
                            const max = session.maxParticipants || 20;
                            const isFull = enrolledCount >= max;
                            const isLive = session.status === 'live';
                            const fillPct = Math.min(100, Math.round((enrolledCount / max) * 100));

                            return (
                                <div key={session._id || session.id} className="glass" style={{
                                    padding: 24, borderRadius: 20, background: 'var(--bg-card)',
                                    display: 'flex', flexDirection: 'column', gap: 16
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                                            background: 'rgba(50,83,67,0.08)', color: 'var(--ku-green)',
                                            border: '1px solid rgba(50,83,67,0.15)', textTransform: 'uppercase', letterSpacing: '0.04em'
                                        }}>
                                            {session.topic}
                                        </span>
                                        {isLive ? (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                                                background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)',
                                                display: 'inline-flex', alignItems: 'center', gap: 4
                                            }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }}></span> LIVE NOW
                                            </span>
                                        ) : (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                                                background: 'rgba(50,83,67,0.06)', color: 'var(--ku-green)', border: '1px solid rgba(50,83,67,0.12)',
                                                display: 'inline-flex', alignItems: 'center', gap: 4
                                            }}>
                                                <Shield size={10} /> Anonymous
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                                            {session.title}
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                            {session.description}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                        {session.counselorName && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <UserCheck size={14} color="var(--ku-green)" />
                                                <span>Hosted by <strong>{session.counselorName}</strong></span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Calendar size={14} color="var(--ku-green)" />
                                            <span>{new Date(session.scheduledAt || session.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(session.scheduledAt || session.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Clock size={14} color="var(--ku-green)" />
                                            <span>{session.duration} minutes</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                            <Users size={14} color="var(--ku-green)" />
                                            <span>{max - enrolledCount} spots remaining ({enrolledCount}/{max})</span>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                                            <div style={{ width: `${fillPct}%`, height: '100%', background: 'var(--ku-green)', borderRadius: 3, transition: 'width 0.3s ease' }}></div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                                        {isLive ? (
                                            <a href={session.roomUrl} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                width: '100%', padding: '12px', borderRadius: 14, background: '#dc2626',
                                                color: '#fff', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none'
                                            }}>
                                                <Video size={16} /> Join Live Workshop
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => handleEnrollAction('enroll', session._id || session.id)}
                                                disabled={isFull || enrollingId === (session._id || session.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    width: '100%', padding: '12px', borderRadius: 14,
                                                    background: isFull ? 'var(--border)' : 'var(--ku-green)',
                                                    color: isFull ? 'var(--text-muted)' : '#fff',
                                                    fontWeight: 700, fontSize: '0.88rem', border: 'none',
                                                    cursor: isFull ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {isFull ? 'Session Full' : 'Reserve My Spot'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {sessions.length === 0 && (
                            <div className="glass" style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', borderRadius: 20 }}>
                                <Users size={40} color="var(--ku-green)" style={{ opacity: 0.5, marginBottom: 12 }} />
                                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>No Workshops Found</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                    Check back soon for upcoming group therapy sessions.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

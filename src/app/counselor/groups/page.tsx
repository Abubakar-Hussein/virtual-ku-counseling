'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Users, Calendar, Clock, Plus, Video, Sparkles, Check, Tag } from 'lucide-react';

export default function CounselorGroupsPage() {
    const [activeTab, setActiveTab] = useState<'my' | 'create'>('my');
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [topic, setTopic] = useState('General Wellness');
    const [datetime, setDatetime] = useState('');
    const [duration, setDuration] = useState('60');
    const [maxParticipants, setMaxParticipants] = useState('20');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [tags, setTags] = useState('');

    const TOPICS = [
        'Anxiety Management', 'Stress Relief', 'Exam Preparation', 'Grief Support',
        'Self-Esteem Building', 'Mindfulness', 'Career Guidance', 'Relationship Skills', 'General Wellness'
    ];

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/groups?filter=my');
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
                        scheduledAt: '2026-08-05T15:00:00Z',
                        duration: 60,
                        maxParticipants: 20,
                        enrolledStudents: ['s1', 's2', 's3', 's4', 's5'],
                        status: 'upcoming',
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
        if (activeTab === 'my') {
            fetchSessions();
        }
    }, [activeTab]);

    const handleLaunch = async (sessionId: string) => {
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'launch', sessionId }),
            });
            const data = await res.json();
            if (data.roomUrl) {
                window.location.href = data.roomUrl;
            } else {
                window.location.href = `/session/${sessionId}`;
            }
        } catch (error) {
            console.error('Failed to launch session:', error);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    topic,
                    scheduledAt: datetime,
                    duration: parseInt(duration),
                    maxParticipants: parseInt(maxParticipants),
                    isAnonymous,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean)
                }),
            });
            if (res.ok) {
                setActiveTab('my');
                setTitle(''); setDescription(''); setTopic('General Wellness'); setDatetime('');
                setDuration('60'); setMaxParticipants('20'); setIsAnonymous(true); setTags('');
            } else {
                alert('Failed to create session');
            }
        } catch (error) {
            console.error('Failed to create session:', error);
            alert('Failed to create session');
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
                            <Users size={12} strokeWidth={2.5} /> Group Therapy & Workshops
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Group Sessions
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Host counselor-led group workshops and group therapy sessions for students.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
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
                        <Users size={14} /> My Sessions
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        style={{
                            padding: '8px 20px', borderRadius: 20, border: 'none',
                            background: activeTab === 'create' ? 'var(--ku-green)' : 'transparent',
                            color: activeTab === 'create' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                    >
                        <Plus size={14} /> Create New Workshop
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'my' ? (
                    loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid rgba(50,83,67,0.2)', borderTopColor: 'var(--ku-green)', borderRadius: '50%' }}></div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                            {sessions.map(session => {
                                const enrolled = session.enrolledStudents?.length || 0;
                                const isLive = session.status === 'live';
                                return (
                                    <div key={session._id || session.id} className="glass" style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-card)' }}>
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
                                                    background: 'rgba(59,130,246,0.08)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.15)'
                                                }}>
                                                    Upcoming
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Calendar size={14} color="var(--ku-green)" />
                                                <span>{new Date(session.scheduledAt || session.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(session.scheduledAt || session.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Clock size={14} color="var(--ku-green)" />
                                                <span>{session.duration} minutes</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Users size={14} color="var(--ku-green)" />
                                                <span>{enrolled} / {session.maxParticipants} students registered</span>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                                            {isLive ? (
                                                <a href={session.roomUrl} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    width: '100%', padding: '12px', borderRadius: 14, background: '#dc2626',
                                                    color: '#fff', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none'
                                                }}>
                                                    <Video size={16} /> Enter Live Room
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={() => handleLaunch(session._id || session.id)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                        width: '100%', padding: '12px', borderRadius: 14, background: 'var(--ku-green)',
                                                        color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer'
                                                    }}
                                                >
                                                    <Video size={16} /> Launch Video Room
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {sessions.length === 0 && (
                                <div className="glass" style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', borderRadius: 20 }}>
                                    <Users size={40} color="var(--ku-green)" style={{ opacity: 0.5, marginBottom: 12 }} />
                                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>No Group Sessions Created Yet</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 }}>
                                        Create your first workshop to host group therapy for students.
                                    </p>
                                    <button onClick={() => setActiveTab('create')} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                                        <Plus size={14} /> Create Workshop
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    /* Create Form */
                    <div className="glass" style={{ maxWidth: 720, padding: 32, borderRadius: 24, background: 'var(--bg-card)', boxShadow: '0 8px 30px rgba(50,83,67,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(50,83,67,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={20} color="var(--ku-green)" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Schedule New Group Session</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Set up a topic, time, and participant limit.</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="form-group">
                                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Session Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Navigating Midterm Exam Anxiety"
                                    style={{
                                        padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                        background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="What will be covered in this session? What techniques or discussions will take place?"
                                    style={{
                                        padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                        background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                                        resize: 'vertical', fontFamily: 'inherit'
                                    }}
                                ></textarea>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Topic Category</label>
                                    <select
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        style={{
                                            padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                            background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                                        }}
                                    >
                                        {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={datetime}
                                        onChange={e => setDatetime(e.target.value)}
                                        style={{
                                            padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                            background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Duration (minutes)</label>
                                    <select
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                        style={{
                                            padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                            background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                                        }}
                                    >
                                        <option value="30">30 min</option>
                                        <option value="45">45 min</option>
                                        <option value="60">60 min</option>
                                        <option value="90">90 min</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Max Participants</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        value={maxParticipants}
                                        onChange={e => setMaxParticipants(e.target.value)}
                                        style={{
                                            padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                            background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Tag size={14} color="var(--ku-green)" /> Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={e => setTags(e.target.value)}
                                    placeholder="e.g. mindfulness, stress, exams"
                                    style={{
                                        padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                        background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div
                                onClick={() => setIsAnonymous(!isAnonymous)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                                    borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-main)',
                                    cursor: 'pointer', userSelect: 'none'
                                }}
                            >
                                <div style={{
                                    width: 20, height: 20, borderRadius: 6,
                                    border: `2px solid ${isAnonymous ? 'var(--ku-green)' : 'var(--border)'}`,
                                    background: isAnonymous ? 'var(--ku-green)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'
                                }}>
                                    {isAnonymous && <Check size={14} color="#fff" strokeWidth={3} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Allow Anonymous Participation</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Students can keep their names hidden during the video session</div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    marginTop: 8, padding: '14px 28px', borderRadius: 14, border: 'none',
                                    background: 'var(--ku-green)', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                                    cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(50,83,67,0.2)'
                                }}
                            >
                                <Sparkles size={16} /> Create Group Session
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

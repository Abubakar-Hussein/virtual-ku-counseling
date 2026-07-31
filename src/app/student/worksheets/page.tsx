'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ClipboardList, CheckCircle, Clock, Send, ChevronRight, X, FileText, Check } from 'lucide-react';

export default function StudentWorksheetsPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [activeWorksheet, setActiveWorksheet] = useState<any>(null);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const res = await fetch('/api/worksheets');
            if (res.ok) {
                const data = await res.json();
                setAssignments(data.assignments || []);
            } else {
                setAssignments([
                    {
                        _id: 'a1',
                        worksheetTitle: 'CBT Thought Record',
                        counselorName: 'Dr. Smith',
                        assignedAt: new Date().toISOString(),
                        status: 'pending',
                        questions: [
                            { id: 'q1', text: 'What situation triggered your emotional response?', type: 'text' },
                            { id: 'q2', text: 'What automatic thoughts went through your mind?', type: 'text' },
                            { id: 'q3', text: 'Rate your emotion intensity (1-10)', type: 'scale' }
                        ]
                    }
                ]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleResponseChange = (questionId: string, value: any) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmitResponses = async () => {
        if (!activeWorksheet) return;

        // Get questions from the populated worksheetId or from the assignment itself
        const questions = activeWorksheet.worksheetId?.questions || activeWorksheet.questions || [];
        const formattedResponses = questions.map((q: any) => ({
            questionId: q.id,
            answer: responses[q.id]
        })) || [];

        try {
            const res = await fetch('/api/worksheets', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: activeWorksheet._id || activeWorksheet.id,
                    responses: formattedResponses,
                })
            });
            if (res.ok) {
                setActiveWorksheet(null);
                setResponses({});
                fetchAssignments();
            } else {
                alert('Failed to submit responses.');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to submit responses.');
        }
    };

    const pending = assignments.filter(a => a.status === 'pending');
    const completed = assignments.filter(a => a.status === 'completed' || a.status === 'reviewed');

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
                            <ClipboardList size={12} strokeWidth={2.5} /> Therapeutic Homework
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            My Worksheets
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Complete therapeutic exercises and CBT worksheets assigned by your counselor.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <button
                        onClick={() => setActiveTab('pending')}
                        style={{
                            padding: '8px 20px', borderRadius: 20, border: 'none',
                            background: activeTab === 'pending' ? 'var(--ku-green)' : 'transparent',
                            color: activeTab === 'pending' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                    >
                        <Clock size={14} /> Pending ({pending.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        style={{
                            padding: '8px 20px', borderRadius: 20, border: 'none',
                            background: activeTab === 'completed' ? 'var(--ku-green)' : 'transparent',
                            color: activeTab === 'completed' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                    >
                        <CheckCircle size={14} /> Completed ({completed.length})
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'pending' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {pending.map(a => (
                            <div key={a._id || a.id} className="glass" style={{
                                padding: 24, borderRadius: 20, background: 'var(--bg-card)',
                                display: 'flex', flexDirection: 'column', gap: 16
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                                        background: 'rgba(245,158,11,0.1)', color: '#854d0e',
                                        border: '1px solid rgba(245,158,11,0.2)', textTransform: 'uppercase'
                                    }}>
                                        To Do
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {new Date(a.assignedAt || a.date || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        {a.worksheetId?.title || a.worksheetTitle}
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                        Assigned by <strong>{a.counselorId?.name || a.counselorName || 'Counselor'}</strong>
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setActiveWorksheet(a);
                                        setResponses({});
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        width: '100%', padding: '12px', borderRadius: 14, background: 'var(--ku-green)',
                                        color: '#fff', fontWeight: 700, fontSize: '0.88rem', border: 'none',
                                        cursor: 'pointer', marginTop: 'auto'
                                    }}
                                >
                                    Start Exercise <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                        {pending.length === 0 && (
                            <div className="glass" style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', borderRadius: 20 }}>
                                <CheckCircle size={40} color="var(--ku-green)" style={{ opacity: 0.5, marginBottom: 12 }} />
                                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>All Caught Up!</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                    You have no pending worksheets to complete.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {completed.map(a => (
                            <div key={a._id || a.id} className="glass" style={{
                                padding: 24, borderRadius: 20, background: 'var(--bg-card)',
                                display: 'flex', flexDirection: 'column', gap: 16
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                                        background: 'rgba(34,197,94,0.1)', color: '#166534',
                                        border: '1px solid rgba(34,197,94,0.2)', textTransform: 'uppercase'
                                    }}>
                                        Completed
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {new Date(a.completedAt || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        {a.worksheetId?.title || a.worksheetTitle}
                                    </h3>
                                    {a.counselorFeedback && (
                                        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(50,83,67,0.06)', border: '1px solid rgba(50,83,67,0.15)', marginTop: 8 }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ku-green)', marginBottom: 2 }}>Counselor Feedback:</div>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0 }}>{a.counselorFeedback}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Worksheet Modal Form */}
                {activeWorksheet && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                        <div className="glass" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 32, borderRadius: 24, background: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                        {activeWorksheet.worksheetId?.title || activeWorksheet.worksheetTitle || activeWorksheet.title}
                                    </h2>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Please answer the questions below.</p>
                                </div>
                                <button onClick={() => setActiveWorksheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 28 }}>
                                {(activeWorksheet.worksheetId?.questions || activeWorksheet.questions || []).map((q: any, idx: number) => (
                                    <div key={q.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <label style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                            <span style={{ color: 'var(--ku-green)', fontWeight: 800, marginRight: 6 }}>{idx + 1}.</span>
                                            {q.label || q.text}
                                        </label>

                                        {q.type === 'text' && (
                                            <textarea
                                                rows={4}
                                                value={responses[q.id] || ''}
                                                onChange={e => handleResponseChange(q.id, e.target.value)}
                                                placeholder="Type your response here..."
                                                style={{
                                                    padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                                    background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.9rem',
                                                    outline: 'none', resize: 'vertical', fontFamily: 'inherit'
                                                }}
                                            ></textarea>
                                        )}

                                        {q.type === 'scale' && (
                                            <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={responses[q.id] || 5}
                                                    onChange={e => handleResponseChange(q.id, parseInt(e.target.value))}
                                                    style={{ width: '100%', accentColor: 'var(--ku-green)', cursor: 'pointer' }}
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 700 }}>
                                                    <span>1 (Low)</span>
                                                    <span style={{ color: 'var(--ku-green)', fontSize: '0.95rem', background: 'rgba(50,83,67,0.1)', padding: '2px 10px', borderRadius: 12 }}>
                                                        Score: {responses[q.id] || 5} / 10
                                                    </span>
                                                    <span>10 (Severe)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button onClick={() => setActiveWorksheet(null)} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleSubmitResponses} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'var(--ku-green)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Send size={15} /> Submit Responses
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

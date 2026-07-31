'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ClipboardList, Plus, Send, Eye, CheckCircle, Clock, X, Trash2, FileText } from 'lucide-react';

export default function CounselorWorksheetsPage() {
    const [activeTab, setActiveTab] = useState<'templates' | 'assigned'>('templates');
    const [templates, setTemplates] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedWorksheet, setSelectedWorksheet] = useState<any>(null);
    const [studentId, setStudentId] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newWorksheet, setNewWorksheet] = useState({
        title: '',
        description: '',
        category: 'CBT',
        questions: [] as any[]
    });

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [feedback, setFeedback] = useState('');

    const defaultTemplates = [
        {
            _id: 'ws-1',
            title: 'CBT Thought Record',
            description: 'Cognitive Behavioral Therapy worksheet for identifying and reframing automatic negative thoughts.',
            category: 'CBT',
            questions: [
                { id: 'q1', text: 'What situation triggered your emotional response?', type: 'text' },
                { id: 'q2', text: 'What automatic thoughts went through your mind?', type: 'text' },
                { id: 'q3', text: 'Rate the intensity of your distress (1-10)', type: 'scale' }
            ]
        },
        {
            _id: 'ws-2',
            title: 'Daily Stress & Coping Log',
            description: 'Track daily stressors, physical reactions, and effective coping strategies.',
            category: 'Stress',
            questions: [
                { id: 'q1', text: 'What caused you stress or anxiety today?', type: 'text' },
                { id: 'q2', text: 'What coping technique did you try?', type: 'text' }
            ]
        },
        {
            _id: 'ws-3',
            title: 'Mindfulness & Gratitude Journal',
            description: 'Promotes positive focus and grounding through daily gratitude reflection.',
            category: 'Mindfulness',
            questions: [
                { id: 'q1', text: 'List three positive moments from your day.', type: 'text' }
            ]
        }
    ];

    useEffect(() => {
        fetchWorksheets();
    }, []);

    const fetchWorksheets = async () => {
        try {
            const res = await fetch('/api/worksheets');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.worksheets?.length ? data.worksheets : defaultTemplates);
                setAssignments(data.assignments || []);
            } else {
                setTemplates(defaultTemplates);
            }
        } catch (e) {
            console.error(e);
            setTemplates(defaultTemplates);
        }
    };

    const handleAssign = async () => {
        if (!studentId || !selectedWorksheet) return;
        try {
            const res = await fetch('/api/worksheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'assign',
                    worksheetId: selectedWorksheet._id || selectedWorksheet.id,
                    studentId
                })
            });
            if (res.ok) {
                setIsAssignModalOpen(false);
                setStudentId('');
                fetchWorksheets();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateTemplate = async () => {
        try {
            const res = await fetch('/api/worksheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newWorksheet.title,
                    description: newWorksheet.description,
                    category: newWorksheet.category,
                    questions: newWorksheet.questions
                })
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                setNewWorksheet({ title: '', description: '', category: 'CBT', questions: [] });
                fetchWorksheets();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addQuestion = () => {
        setNewWorksheet(prev => ({
            ...prev,
            questions: [...prev.questions, { id: Date.now().toString(), text: '', type: 'text', options: [] }]
        }));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...newWorksheet.questions];
        updated[index] = { ...updated[index], [field]: value };
        setNewWorksheet({ ...newWorksheet, questions: updated });
    };

    const removeQuestion = (index: number) => {
        const updated = [...newWorksheet.questions];
        updated.splice(index, 1);
        setNewWorksheet({ ...newWorksheet, questions: updated });
    };

    const handleReviewFeedback = async () => {
        if (!selectedAssignment) return;
        try {
            const res = await fetch('/api/worksheets', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: selectedAssignment._id || selectedAssignment.id,
                    feedback
                })
            });
            if (res.ok) {
                setIsReviewModalOpen(false);
                setFeedback('');
                fetchWorksheets();
            }
        } catch (e) {
            console.error(e);
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
                            <ClipboardList size={12} strokeWidth={2.5} /> Clinical Tools & Exercises
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Clinical Worksheets
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Create CBT exercises and assign therapeutic homework to your students.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 14,
                                border: 'none', background: 'var(--ku-green)', color: '#fff', fontWeight: 700,
                                fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(50,83,67,0.15)'
                            }}
                        >
                            <Plus size={16} /> Create Template
                        </button>
                        <NotificationBell />
                    </div>
                </header>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <button
                        onClick={() => setActiveTab('templates')}
                        style={{
                            padding: '8px 20px', borderRadius: 20, border: 'none',
                            background: activeTab === 'templates' ? 'var(--ku-green)' : 'transparent',
                            color: activeTab === 'templates' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                    >
                        <FileText size={14} /> Template Library
                    </button>
                    <button
                        onClick={() => setActiveTab('assigned')}
                        style={{
                            padding: '8px 20px', borderRadius: 20, border: 'none',
                            background: activeTab === 'assigned' ? 'var(--ku-green)' : 'transparent',
                            color: activeTab === 'assigned' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                    >
                        <Clock size={14} /> Assigned Worksheets ({assignments.length})
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'templates' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {templates.map(template => (
                            <div key={template._id || template.id} className="glass" style={{
                                padding: 24, borderRadius: 20, background: 'var(--bg-card)',
                                display: 'flex', flexDirection: 'column', gap: 16
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                                        background: 'rgba(50,83,67,0.08)', color: 'var(--ku-green)',
                                        border: '1px solid rgba(50,83,67,0.15)', textTransform: 'uppercase', letterSpacing: '0.04em'
                                    }}>
                                        {template.category}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <ClipboardList size={14} color="var(--ku-green)" />
                                        {template.questions?.length || 0} Questions
                                    </span>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                                        {template.title}
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                        {template.description}
                                    </p>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                                    <button
                                        onClick={() => {
                                            setSelectedWorksheet(template);
                                            setIsAssignModalOpen(true);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            width: '100%', padding: '12px', borderRadius: 14, background: 'rgba(50,83,67,0.08)',
                                            color: 'var(--ku-green)', border: '1px solid rgba(50,83,67,0.2)',
                                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Send size={15} /> Assign to Student
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass" style={{ borderRadius: 20, background: 'var(--bg-card)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-secondary)' }}>Student</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-secondary)' }}>Worksheet</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-secondary)' }}>Assigned Date</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.length > 0 ? assignments.map(a => (
                                    <tr key={a._id || a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {a.studentId?.name || a.studentName || 'Student'}
                                        </td>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>
                                            {a.worksheetId?.title || a.worksheetTitle}
                                        </td>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                                            {new Date(a.assignedAt || a.date || Date.now()).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            {a.status === 'completed' ? (
                                                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: '#166534', border: '1px solid rgba(34,197,94,0.2)' }}>
                                                    Completed
                                                </span>
                                            ) : a.status === 'reviewed' ? (
                                                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: 'rgba(59,130,246,0.1)', color: '#1e40af', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                    Reviewed
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#854d0e', border: '1px solid rgba(245,158,11,0.2)' }}>
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            {a.status === 'completed' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAssignment(a);
                                                        setIsReviewModalOpen(true);
                                                    }}
                                                    style={{
                                                        padding: '6px 14px', borderRadius: 10, border: 'none',
                                                        background: 'var(--ku-green)', color: '#fff', fontWeight: 700,
                                                        fontSize: '0.8rem', cursor: 'pointer'
                                                    }}
                                                >
                                                    Review & Feedback
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No worksheets assigned yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Assign Modal */}
                {isAssignModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                        <div className="glass" style={{ width: '100%', maxWidth: 440, padding: 28, borderRadius: 24, background: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>Assign Worksheet</h3>
                                <button onClick={() => setIsAssignModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
                                Assign "{selectedWorksheet?.title}" to a student on your caseload.
                            </p>
                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Student ID or Name</label>
                                <input
                                    type="text"
                                    value={studentId}
                                    onChange={e => setStudentId(e.target.value)}
                                    placeholder="Enter student ID..."
                                    style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-main)', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button onClick={() => setIsAssignModalOpen(false)} style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleAssign} disabled={!studentId} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: 'var(--ku-green)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: !studentId ? 0.5 : 1 }}>Assign</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

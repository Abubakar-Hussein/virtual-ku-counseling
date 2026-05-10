'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import Avatar from '@/components/Avatar';

const PROGRESS_COLORS: Record<string, string> = {
    'Improved':     '#4ade80',
    'Stable':       '#60a5fa',
    'Declined':     '#f87171',
    'Not Evaluated':'#94a3b8',
};

const PROGRESS_ICONS: Record<string, string> = {
    'Improved':     '↑',
    'Stable':       '→',
    'Declined':     '↓',
    'Not Evaluated':'—',
};

function formatDate(d: any) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatSpec(s: string) {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function MoodBar({ value }: { value: number }) {
    const color = value < 4 ? '#f87171' : value > 7 ? '#4ade80' : '#facc15';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${value * 10}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color, minWidth: 28 }}>{value}/10</span>
        </div>
    );
}

export default function SessionRecordsPage() {
    const { showToast } = useToast();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [progressFilter, setProgressFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Signature modal state
    const [sigRecord, setSigRecord] = useState<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    const openSignModal = (record: any) => setSigRecord(record);
    const closeSignModal = () => { setSigRecord(null); };

    const clearCanvas = () => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, c.width, c.height);
    };

    // Canvas drawing handlers
    const startDraw = (x: number, y: number) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        isDrawing.current = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };
    const draw = (x: number, y: number) => {
        if (!isDrawing.current) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#111';
        ctx.lineTo(x, y);
        ctx.stroke();
    };
    const stopDraw = () => { isDrawing.current = false; };

    const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const t = e.touches[0];
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };

    const isCanvasBlank = () => {
        const c = canvasRef.current;
        if (!c) return true;
        const ctx = c.getContext('2d');
        if (!ctx) return true;
        const px = ctx.getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < px.length; i += 4) { if (px[i] !== 0) return false; }
        return true;
    };

    const printRecord = (record: any, signatureDataUrl?: string) => {
        const w = window.open('', '_blank');
        if (!w) return;
        const appt = record.appointment;
        const intake = record.intake;
        const sigBlock = signatureDataUrl
            ? `<h2>Counselor Verification</h2>
               <div style="margin-top:8px;">
                 <img src="${signatureDataUrl}" style="max-width:260px;height:auto;border-bottom:1px solid #333;" />
                 <p style="margin:4px 0 0;font-size:0.85rem;"><strong>${record.counselorId?.name || 'Counselor'}</strong></p>
                 <p style="font-size:0.78rem;color:#666;">Digitally signed — ${new Date().toLocaleString()}</p>
               </div>`
            : `<h2>Counselor Verification</h2>
               <div style="margin-top:16px;border-bottom:1px solid #333;width:260px;height:1px;"></div>
               <p style="font-size:0.85rem;margin-top:4px;"><strong>${record.counselorId?.name || 'Counselor'}</strong></p>
               <p style="font-size:0.78rem;color:#666;">Signature line</p>`;
        w.document.write(`
            <html><head><title>Clinical Record — ${record.studentId?.name}</title>
            <style>
                body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; color: #111; line-height: 1.6; }
                h1 { font-size: 1.4rem; border-bottom: 2px solid #006633; padding-bottom: 8px; }
                h2 { font-size: 1rem; color: #006633; margin-top: 24px; }
                .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; background: #eee; }
                .meta { display: flex; gap: 32px; margin: 16px 0; font-size: 0.9rem; color: #555; }
                .confidential { color: #c00; font-weight: bold; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; }
                p { margin: 8px 0; }
                pre { background: #f5f5f5; padding: 12px; border-radius: 4px; white-space: pre-wrap; font-family: inherit; }
            </style></head><body>
            <p class="confidential">🔒 Confidential — Clinical Record — Not for Unauthorised Distribution</p>
            <h1>Session Record — ${record.studentId?.name || 'Unknown'}</h1>
            <div class="meta">
                <span><strong>Date:</strong> ${formatDate(appt?.date)}</span>
                <span><strong>Time:</strong> ${appt?.timeSlot || '—'}</span>
                <span><strong>Session #${record.sessionNumber || '?'}</strong></span>
                <span><strong>Type:</strong> ${formatSpec(appt?.specialization)}</span>
                <span><strong>Status:</strong> ${appt?.status || '—'}</span>
            </div>
            ${intake?.isUrgent ? '<p style="color:red;font-weight:bold">⚠ CRISIS TRIAGE — Urgent Care Flagged</p>' : ''}
            <h2>Pre-Session Intake</h2>
            <p><strong>Self-Reported Mood:</strong> ${intake?.mood ?? '—'}/10</p>
            <p><strong>Primary Concerns:</strong> ${(intake?.concerns || []).join(', ') || 'None'}</p>
            <p><strong>Prior Therapy:</strong> ${intake?.previousTherapy ? 'Yes' : 'No'}</p>
            <p><strong>Reason for Visit:</strong> ${appt?.reason || '—'}</p>
            <h2>Clinical Notes</h2>
            <pre>${record.notes || 'No notes recorded.'}</pre>
            <h2>Action Items / Homework</h2>
            <pre>${record.actionItems || 'None specified.'}</pre>
            <h2>Progress Indicator</h2>
            <p><span class="badge">${record.progressIndicator}</span></p>
            ${appt?.rating ? `<h2>Student Feedback</h2><p>Rating: ${'★'.repeat(appt.rating)}${'☆'.repeat(5 - appt.rating)} (${appt.rating}/5)</p>${appt.feedback ? `<p>${appt.feedback}</p>` : ''}` : ''}
            ${sigBlock}
            <br/><hr/><p style="font-size:0.75rem;color:#999">Generated by KU Wellness System — ${new Date().toLocaleString()}</p>
            </body></html>`);
        w.document.close();
        w.print();
    };

    const handleSignAndPrint = () => {
        if (!sigRecord) return;
        const dataUrl = isCanvasBlank() ? undefined : canvasRef.current?.toDataURL('image/png');
        printRecord(sigRecord, dataUrl);
        closeSignModal();
    };

    const handleSkipSignature = () => {
        if (!sigRecord) return;
        printRecord(sigRecord);
        closeSignModal();
    };
    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (progressFilter !== 'all') params.set('progress', progressFilter);
            if (dateRange.start) params.set('startDate', dateRange.start);
            if (dateRange.end) params.set('endDate', dateRange.end);
            const res = await fetch(`/api/counselors/records?${params}`);
            const data = await res.json();
            if (Array.isArray(data)) setRecords(data);
        } catch {
            showToast('Failed to load session records', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, progressFilter, dateRange]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);



    const statCounts = {
        total: records.length,
        improved: records.filter(r => r.progressIndicator === 'Improved').length,
        stable: records.filter(r => r.progressIndicator === 'Stable').length,
        declined: records.filter(r => r.progressIndicator === 'Declined').length,
        urgent: records.filter(r => r.intake?.isUrgent).length,
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Session Records</h1>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', textTransform: 'uppercase' }}>
                                🔒 Confidential
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Clinical notes, intake data and session outcomes for your caseload.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Summary Stats */}
                {!loading && records.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                        {[
                            { label: 'Total Sessions', value: statCounts.total, color: '#60a5fa' },
                            { label: 'Improved', value: statCounts.improved, color: '#4ade80' },
                            { label: 'Stable', value: statCounts.stable, color: '#60a5fa' },
                            { label: 'Declined', value: statCounts.declined, color: '#f87171' },
                            { label: 'Urgent Flags', value: statCounts.urgent, color: '#fb923c' },
                        ].map(s => (
                            <div key={s.label} className="glass" style={{ padding: '10px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }} className="glass" >
                    <div style={{ padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="🔍  Search student, notes, concern type..."
                            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                        />
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>→</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }} />
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {['all', 'Improved', 'Stable', 'Declined', 'Not Evaluated'].map(p => {
                                const col = PROGRESS_COLORS[p] || 'var(--ku-green-light)';
                                const active = progressFilter === p;
                                return (
                                    <button key={p} onClick={() => setProgressFilter(p)} style={{
                                        padding: '6px 12px', borderRadius: 16, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                                        border: `1px solid ${active ? col : 'var(--border)'}`,
                                        background: active ? `${col}22` : 'transparent',
                                        color: active ? col : 'var(--text-muted)',
                                        fontWeight: active ? 700 : 400,
                                    }}>
                                        {p === 'all' ? 'All' : `${PROGRESS_ICONS[p]} ${p}`}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Result count */}
                {!loading && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                        {records.length} record{records.length !== 1 ? 's' : ''} found
                    </div>
                )}

                {/* Records List */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1,2,3,4].map(i => <div key={i} className="glass skeleton" style={{ height: 72, borderRadius: 12 }} />)}
                    </div>
                ) : records.length === 0 ? (
                    <EmptyState icon="📁" title="No session records found"
                        description="No clinical records match your filters, or you haven't saved any session notes yet." />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Column headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', gap: 12, padding: '0 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            <span>Patient</span>
                            <span>Session Date</span>
                            <span>Type</span>
                            <span>Progress</span>
                            <span></span>
                        </div>

                        {records.map(record => {
                            const appt = record.appointment;
                            const intake = record.intake;
                            const color = PROGRESS_COLORS[record.progressIndicator] || '#94a3b8';
                            const isOpen = expandedId === record._id;

                            return (
                                <div key={record._id} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${isOpen ? color + '55' : 'var(--border)'}`, transition: 'border-color 0.2s', background: 'rgba(255,255,255,0.02)' }}>
                                    {/* Row */}
                                    <div
                                        onClick={() => toggle(record._id)}
                                        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', gap: 12, padding: '14px 16px', alignItems: 'center', cursor: 'pointer', borderLeft: `3px solid ${color}` }}
                                    >
                                        {/* Patient */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Avatar name={record.studentId?.name || '?'} src={record.studentId?.profileImage} size={34} fontSize="0.75rem" />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{record.studentId?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                    Session #{record.sessionNumber || '?'}
                                                    {intake?.isUrgent && <span style={{ marginLeft: 6, color: '#f87171', fontWeight: 700 }}>⚠ Urgent</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Date */}
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{formatDate(appt?.date)}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{appt?.timeSlot || '—'}</div>
                                        </div>
                                        {/* Type */}
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{formatSpec(appt?.specialization)}</div>
                                        {/* Progress */}
                                        <div>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${color}22`, color, border: `1px solid ${color}44` }}>
                                                {PROGRESS_ICONS[record.progressIndicator]} {record.progressIndicator}
                                            </span>
                                        </div>
                                        {/* Expand */}
                                        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', userSelect: 'none' }}>
                                            {isOpen ? '▲ Collapse' : '▼ Expand'}
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {isOpen && (
                                        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>

                                                {/* Left: Clinical Notes + Action Items */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Clinical Notes</div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
                                                            {record.notes || 'No notes recorded.'}
                                                        </div>
                                                    </div>
                                                    {record.actionItems && (
                                                        <div>
                                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Action Items / Homework</div>
                                                            <div style={{ fontSize: '0.875rem', color: '#fbbf24', lineHeight: 1.6, background: 'rgba(251,191,36,0.05)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                                                                {record.actionItems}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {appt?.rating && (
                                                        <div>
                                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Student Feedback</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ color: '#facc15', fontSize: '1rem' }}>{'★'.repeat(appt.rating)}{'☆'.repeat(5 - appt.rating)}</span>
                                                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{appt.rating}/5</span>
                                                            </div>
                                                            {appt.feedback && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6 }}>"{appt.feedback}"</p>}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Intake Data */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Pre-Session Intake</div>

                                                    {intake?.isUrgent && (
                                                        <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600 }}>
                                                            ⚠ CRISIS TRIAGE — Urgent Care Flagged
                                                        </div>
                                                    )}

                                                    {intake ? (
                                                        <>
                                                            <div>
                                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>Self-Reported Mood</div>
                                                                <MoodBar value={intake.mood} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>Primary Concerns</div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                    {(intake.concerns || []).length > 0 ? intake.concerns.map((c: string) => (
                                                                        <span key={c} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, background: 'rgba(0,102,51,0.12)', color: 'var(--ku-green-light)', border: '1px solid rgba(0,102,51,0.2)' }}>{c}</span>
                                                                    )) : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None specified</span>}
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 16 }}>
                                                                <div>
                                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Prior Therapy</div>
                                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 2 }}>{intake.previousTherapy ? 'Yes' : 'No'}</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Student Email</div>
                                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{record.studentId?.email || '—'}</div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Reason for Visit</div>
                                                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 6 }}>"{appt?.reason || '—'}"</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No intake data for this session.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                                                <button onClick={() => openSignModal(record)} style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                    🖨 Print Record
                                                </button>
                                                <a href={`https://mail.google.com/mail/?view=cm&to=${record.studentId?.email}`} target="_blank" rel="noopener noreferrer"
                                                    style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s' }}>
                                                    📧 Email Student
                                                </a>
                                                <a href={`/counselor/appointments/${record.appointmentId}`}
                                                    style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--ku-green-light)', color: 'var(--ku-green-light)', textDecoration: 'none', transition: 'all 0.2s' }}>
                                                    Open Clinical Workspace →
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Signature Modal ── */}
                {sigRecord && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
                         onClick={closeSignModal}>
                        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '90%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>✍️ Sign Session Record</h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                Draw your signature below to verify this clinical record for <strong>{sigRecord.studentId?.name}</strong>.
                            </p>

                            {/* Canvas */}
                            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff', position: 'relative' }}>
                                <canvas
                                    ref={canvasRef}
                                    width={420} height={140}
                                    style={{ width: '100%', height: 140, cursor: 'crosshair', touchAction: 'none' }}
                                    onMouseDown={e => { const p = getCanvasPos(e); startDraw(p.x, p.y); }}
                                    onMouseMove={e => { const p = getCanvasPos(e); draw(p.x, p.y); }}
                                    onMouseUp={stopDraw}
                                    onMouseLeave={stopDraw}
                                    onTouchStart={e => { e.preventDefault(); const p = getTouchPos(e); startDraw(p.x, p.y); }}
                                    onTouchMove={e => { e.preventDefault(); const p = getTouchPos(e); draw(p.x, p.y); }}
                                    onTouchEnd={stopDraw}
                                />
                                <span style={{ position: 'absolute', bottom: 8, left: 12, fontSize: '0.68rem', color: '#bbb', pointerEvents: 'none' }}>Sign here</span>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                                <button onClick={clearCanvas} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
                                    Clear
                                </button>
                                <button onClick={handleSkipSignature} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                                    Skip Signature
                                </button>
                                <button onClick={handleSignAndPrint} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #006633, #00994d)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}>
                                    ✅ Sign & Print
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

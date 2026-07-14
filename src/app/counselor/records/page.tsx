'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import Avatar from '@/components/Avatar';
import { Lock, ArrowUp, ArrowRight, ArrowDown, Minus, Star, Search, X, ClipboardList, ChevronDown, ChevronUp, Printer, Mail, ExternalLink, AlertTriangle } from 'lucide-react';

const PROGRESS_CFG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    'Improved':     { color: 'var(--ku-green)', bg: 'rgba(50,83,67,0.08)',  border: 'rgba(50,83,67,0.2)',  icon: <ArrowUp size={11} strokeWidth={2.5} /> },
    'Stable':       { color: '#3b82f6',          bg: 'rgba(59,130,246,0.08)',border: 'rgba(59,130,246,0.2)',icon: <ArrowRight size={11} strokeWidth={2.5} /> },
    'Declined':     { color: '#dc2626',           bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: <ArrowDown size={11} strokeWidth={2.5} /> },
    'Not Evaluated':{ color: 'var(--text-muted)', bg: 'rgba(148,163,184,0.08)',border: 'rgba(148,163,184,0.2)',icon: <Minus size={11} strokeWidth={2.5} /> },
};

function formatDate(d: any) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatSpec(s: string) {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function MoodBar({ value }: { value: number }) {
    const color = value < 4 ? '#dc2626' : value > 7 ? 'var(--ku-green)' : '#f59e0b';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${value * 10}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color, minWidth: 32 }}>{value}/10</span>
        </div>
    );
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>{children}</div>
);

export default function SessionRecordsPage() {
    const { showToast } = useToast();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [progressFilter, setProgressFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [sigRecord, setSigRecord] = useState<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    const clearCanvas = () => {
        const c = canvasRef.current; if (!c) return;
        c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    };
    const startDraw = (x: number, y: number) => {
        const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return;
        isDrawing.current = true; ctx.beginPath(); ctx.moveTo(x, y);
    };
    const draw = (x: number, y: number) => {
        if (!isDrawing.current) return;
        const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return;
        ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
        ctx.lineTo(x, y); ctx.stroke();
    };
    const stopDraw = () => { isDrawing.current = false; };
    const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const r = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const r = canvasRef.current!.getBoundingClientRect();
        return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    };
    const isCanvasBlank = () => {
        const c = canvasRef.current; if (!c) return true;
        const px = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data;
        if (!px) return true;
        for (let i = 3; i < px.length; i += 4) { if (px[i] !== 0) return false; }
        return true;
    };

    const printRecord = (record: any, sig?: string) => {
        const w = window.open('', '_blank'); if (!w) return;
        const appt = record.appointment; const intake = record.intake;
        const sigBlock = sig
            ? `<h2>Counselor Verification</h2><div style="margin-top:8px;"><img src="${sig}" style="max-width:260px;height:auto;border-bottom:1px solid #333;"/><p style="font-size:0.85rem;margin:4px 0 0;"><strong>${record.counselorId?.name || 'Counselor'}</strong></p><p style="font-size:0.78rem;color:#666;">Digitally signed — ${new Date().toLocaleString()}</p></div>`
            : `<h2>Counselor Verification</h2><div style="margin-top:16px;border-bottom:1px solid #333;width:260px;height:1px;"></div><p style="font-size:0.85rem;margin-top:4px;"><strong>${record.counselorId?.name || 'Counselor'}</strong></p><p style="font-size:0.78rem;color:#666;">Signature line</p>`;
        w.document.write(`<html><head><title>Clinical Record — ${record.studentId?.name}</title>
            <style>
                body{font-family:'Segoe UI',system-ui,sans-serif;max-width:820px;margin:40px auto;color:#111;line-height:1.6;padding:0 24px;}
                h1{font-size:1.4rem;border-bottom:3px solid #325343;padding-bottom:8px;color:#325343;}
                h2{font-size:0.9rem;color:#325343;margin-top:24px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;}
                .meta{display:flex;gap:32px;margin:16px 0;font-size:0.88rem;color:#555;flex-wrap:wrap;}
                .confidential{color:#325343;font-weight:700;font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;}
                p{margin:8px 0;}
                pre{background:#f6f9f7;padding:12px 16px;border-radius:6px;white-space:pre-wrap;font-family:inherit;font-size:0.875rem;border-left:3px solid #325343;}
                .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:0.78rem;background:#eef5f0;color:#325343;font-weight:700;}
                th{background:#325343!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color:#fff!important;padding:8px 12px;text-align:left;font-size:0.72rem;text-transform:uppercase;}
                td{padding:7px 12px;border-bottom:1px solid #e5e5e5;}
                @media print{body{margin:16px;}}
            </style></head><body>
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
                <div style="width:48px;height:48px;border-radius:12px;background:#325343;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10h18'/><path d='M8 2v4m8-4v4'/><rect x='3' y='4' width='18' height='18' rx='2'/><path d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01'/><path d='M12 14c.667-.667 2-1 2-2.5a1.5 1.5 0 0 0-3 0'/></svg></div>
                <div><p class="confidential" style="margin:0 0 4px;">Confidential — Clinical Record — Not for Unauthorised Distribution</p>
                <h1 style="margin:0;border:none;">KU Wellness</h1></div>
            </div>
            <h1 style="margin-top:12px;">Session Record — ${record.studentId?.name || 'Unknown'}</h1>
            <div class="meta">
                <span><strong>Date:</strong> ${formatDate(appt?.date)}</span>
                <span><strong>Time:</strong> ${appt?.timeSlot || '—'}</span>
                <span><strong>Session #${record.sessionNumber || '?'}</strong></span>
                <span><strong>Type:</strong> ${formatSpec(appt?.specialization)}</span>
                <span><strong>Progress:</strong> ${record.progressIndicator}</span>
            </div>
            ${intake?.isUrgent ? '<p style="color:#dc2626;font-weight:bold;background:#fef2f2;padding:8px 12px;border-radius:6px;border-left:3px solid #dc2626;">⚠ CRISIS TRIAGE — Urgent Care Flagged</p>' : ''}
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
            ${appt?.rating ? `<h2>Student Feedback</h2><p>Rating: ${'★'.repeat(appt.rating)}${'☆'.repeat(5-appt.rating)} (${appt.rating}/5)</p>${appt.feedback ? `<p><em>${appt.feedback}</em></p>` : ''}` : ''}
            ${sigBlock}
            <br/><hr/><p style="font-size:0.72rem;color:#999;">Generated by KU Wellness — ${new Date().toLocaleString()}</p>
            </body></html>`);
        w.document.close(); w.print();
    };

    const handleSignAndPrint = () => {
        if (!sigRecord) return;
        const dataUrl = isCanvasBlank() ? undefined : canvasRef.current?.toDataURL('image/png');
        printRecord(sigRecord, dataUrl);
        setSigRecord(null);
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
        } catch { showToast('Failed to load session records', 'error'); }
        finally { setLoading(false); }
    }, [search, progressFilter, dateRange]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

    const statCounts = {
        total:    records.length,
        improved: records.filter(r => r.progressIndicator === 'Improved').length,
        stable:   records.filter(r => r.progressIndicator === 'Stable').length,
        declined: records.filter(r => r.progressIndicator === 'Declined').length,
        urgent:   records.filter(r => r.intake?.isUrgent).length,
    };

    const PROGRESS_FILTERS = [
        { value: 'all',          label: 'All' },
        { value: 'Improved',     label: 'Improved' },
        { value: 'Stable',       label: 'Stable' },
        { value: 'Declined',     label: 'Declined' },
        { value: 'Not Evaluated',label: 'Not Evaluated' },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                                borderRadius: 20, padding: '4px 12px',
                                fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)',
                                letterSpacing: '0.07em', textTransform: 'uppercase',
                            }}>
                                <ClipboardList size={12} strokeWidth={2.5} /> Caseload
                            </div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 20, padding: '4px 10px',
                                fontSize: '0.68rem', fontWeight: 700, color: '#dc2626',
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>
                                <Lock size={10} strokeWidth={2.5} /> Confidential
                            </div>
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Session Records
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Clinical notes, intake data and session outcomes for your caseload.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Stats row */}
                {!loading && records.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
                        {[
                            { label: 'Total Sessions', value: statCounts.total,    color: 'var(--ku-green)', bg: 'rgba(50,83,67,0.07)',   border: 'rgba(50,83,67,0.15)' },
                            { label: 'Improved',       value: statCounts.improved, color: 'var(--ku-green)', bg: 'rgba(50,83,67,0.07)',   border: 'rgba(50,83,67,0.15)' },
                            { label: 'Stable',         value: statCounts.stable,   color: '#3b82f6',          bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.15)' },
                            { label: 'Declined',       value: statCounts.declined, color: '#dc2626',          bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.15)' },
                            { label: 'Urgent Flags',   value: statCounts.urgent,   color: statCounts.urgent > 0 ? '#b45309' : 'var(--text-muted)', bg: statCounts.urgent > 0 ? 'rgba(245,158,11,0.08)' : 'var(--bg-card)', border: statCounts.urgent > 0 ? 'rgba(245,158,11,0.2)' : 'var(--border)' },
                        ].map(s => (
                            <div key={s.label} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                background: s.bg, border: `1px solid ${s.border}`,
                                borderRadius: 12, padding: '10px 16px',
                            }}>
                                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter bar */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Search + date row */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} strokeWidth={2.2} />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search student, notes, concern type…"
                                style={{
                                    width: '100%', paddingLeft: 36, paddingRight: search ? 32 : 12,
                                    paddingTop: 9, paddingBottom: 9, borderRadius: 10,
                                    border: '1px solid var(--border)', background: 'var(--bg-main)',
                                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(50,83,67,0.4)')}
                                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                            />
                            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={14} strokeWidth={2.5} /></button>}
                        </div>

                        {/* Date range */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                                style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>→</span>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                                style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }} />
                        </div>
                    </div>

                    {/* Progress filter pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {PROGRESS_FILTERS.map(f => {
                            const cfg = PROGRESS_CFG[f.value];
                            const active = progressFilter === f.value;
                            return (
                                <button key={f.value} onClick={() => setProgressFilter(f.value)} style={{
                                    padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.18s',
                                    fontWeight: active ? 700 : 500,
                                    background: active ? (cfg?.bg ?? 'rgba(50,83,67,0.08)') : 'transparent',
                                    color: active ? (cfg?.color ?? 'var(--ku-green)') : 'var(--text-muted)',
                                    border: active ? `1px solid ${cfg?.border ?? 'rgba(50,83,67,0.2)'}` : '1px solid var(--border)',
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                }}>
                                    {cfg && active && cfg.icon}
                                    {f.label}
                                </button>
                            );
                        })}

                        {!loading && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(50,83,67,0.05)', border: '1px solid rgba(50,83,67,0.1)', borderRadius: 20, padding: '4px 12px' }}>
                                {records.length} record{records.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* Records list */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1,2,3,4].map(i => (
                            <div key={i} style={{ height: 72, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-card)', opacity: 0.5 }} />
                        ))}
                    </div>
                ) : records.length === 0 ? (
                    <EmptyState icon="" title="No session records found"
                        description="No clinical records match your filters, or you haven't saved any session notes yet." />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Column headers */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1.1fr 80px',
                            gap: 12, padding: '0 20px',
                            fontSize: '0.68rem', fontWeight: 700, color: 'var(--ku-green)',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                            <span>Patient</span><span>Session Date</span><span>Type</span><span>Progress</span><span></span>
                        </div>

                        {records.map(record => {
                            const appt = record.appointment;
                            const intake = record.intake;
                            const cfg = PROGRESS_CFG[record.progressIndicator] ?? PROGRESS_CFG['Not Evaluated'];
                            const isOpen = expandedId === record._id;

                            return (
                                <div key={record._id} style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderLeft: `3px solid ${cfg.color}`,
                                    borderRadius: 14, overflow: 'hidden',
                                    transition: 'box-shadow 0.2s',
                                    boxShadow: isOpen ? '0 4px 20px rgba(50,83,67,0.08)' : 'none',
                                }}>
                                    {/* Row */}
                                    <div onClick={() => toggle(record._id)} style={{
                                        display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1.1fr 80px',
                                        gap: 12, padding: '15px 20px', alignItems: 'center',
                                        cursor: 'pointer', transition: 'background 0.15s',
                                    }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(50,83,67,0.02)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                    >
                                        {/* Patient */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Avatar name={record.studentId?.name || '?'} src={record.studentId?.profileImage} size={38} fontSize="0.78rem" />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                    {record.studentId?.name || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                                                    Session #{record.sessionNumber || '?'}
                                                    {intake?.isUrgent && (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#dc2626', fontWeight: 700, fontSize: '0.68rem' }}>
                                                            <AlertTriangle size={9} strokeWidth={2.5} /> Urgent
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(appt?.date)}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{appt?.timeSlot || '—'}</div>
                                        </div>

                                        {/* Type */}
                                        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{formatSpec(appt?.specialization)}</div>

                                        {/* Progress badge */}
                                        <div>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 800, padding: '4px 11px', borderRadius: 20,
                                                background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                            }}>
                                                {cfg.icon} {record.progressIndicator}
                                            </span>
                                        </div>

                                        {/* Expand toggle */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
                                            {isOpen ? <ChevronUp size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
                                        </div>
                                    </div>

                                    {/* Expanded */}
                                    {isOpen && (
                                        <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                                                {/* Left: notes */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div>
                                                        <SectionLabel>Clinical Notes</SectionLabel>
                                                        <div style={{
                                                            fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65,
                                                            background: 'rgba(50,83,67,0.03)', border: '1px solid rgba(50,83,67,0.08)',
                                                            padding: '12px 14px', borderRadius: 10, whiteSpace: 'pre-wrap',
                                                            maxHeight: 200, overflowY: 'auto',
                                                        }}>
                                                            {record.notes || 'No notes recorded.'}
                                                        </div>
                                                    </div>

                                                    {record.actionItems && (
                                                        <div>
                                                            <SectionLabel>Action Items / Homework</SectionLabel>
                                                            <div style={{
                                                                fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65,
                                                                background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)',
                                                                borderLeft: '3px solid #f59e0b', padding: '12px 14px', borderRadius: 10,
                                                                whiteSpace: 'pre-wrap',
                                                            }}>
                                                                {record.actionItems}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {appt?.rating && (
                                                        <div>
                                                            <SectionLabel>Student Feedback</SectionLabel>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <div style={{ display: 'flex', gap: 2 }}>
                                                                    {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= appt.rating ? '#f59e0b' : 'none'} stroke={s <= appt.rating ? '#f59e0b' : 'var(--border)'} />)}
                                                                </div>
                                                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{appt.rating}/5</span>
                                                            </div>
                                                            {appt.feedback && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6 }}>"{appt.feedback}"</p>}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: intake */}
                                                <div style={{
                                                    background: 'rgba(50,83,67,0.02)', border: '1px solid var(--border)',
                                                    borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
                                                }}>
                                                    <SectionLabel>Pre-Session Intake</SectionLabel>

                                                    {intake?.isUrgent && (
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                                            background: 'rgba(239,68,68,0.07)', color: '#dc2626',
                                                            border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
                                                            fontSize: '0.8rem', fontWeight: 700,
                                                        }}>
                                                            <AlertTriangle size={14} strokeWidth={2.5} /> CRISIS TRIAGE — Urgent Care Flagged
                                                        </div>
                                                    )}

                                                    {intake ? (<>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Self-Reported Mood</div>
                                                            <MoodBar value={intake.mood} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Primary Concerns</div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                {(intake.concerns || []).length > 0
                                                                    ? intake.concerns.map((c: string) => (
                                                                        <span key={c} style={{ fontSize: '0.7rem', padding: '2px 9px', borderRadius: 20, background: 'rgba(50,83,67,0.07)', color: 'var(--ku-green)', border: '1px solid rgba(50,83,67,0.15)' }}>{c}</span>
                                                                    ))
                                                                    : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None specified</span>
                                                                }
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 20 }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Prior Therapy</div>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{intake.previousTherapy ? 'Yes' : 'No'}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Student Email</div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{record.studentId?.email || '—'}</div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Reason for Visit</div>
                                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(50,83,67,0.04)', padding: '8px 10px', borderRadius: 8, margin: 0 }}>"{appt?.reason || '—'}"</p>
                                                        </div>
                                                    </>) : (
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No intake data for this session.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action footer */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                                <button onClick={() => setSigRecord(record)} style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem',
                                                    border: '1px solid var(--border)', background: 'transparent',
                                                    color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600,
                                                }}>
                                                    <Printer size={14} strokeWidth={2} /> Print Record
                                                </button>
                                                <a href={`https://mail.google.com/mail/?view=cm&to=${record.studentId?.email}`} target="_blank" rel="noopener noreferrer" style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem',
                                                    border: '1px solid var(--border)', background: 'transparent',
                                                    color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600,
                                                }}>
                                                    <Mail size={14} strokeWidth={2} /> Email Student
                                                </a>
                                                <a href={`/counselor/appointments/${record.appointmentId}`} style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem',
                                                    background: 'rgba(50,83,67,0.08)', border: '1px solid rgba(50,83,67,0.2)',
                                                    color: 'var(--ku-green)', textDecoration: 'none', fontWeight: 700,
                                                }}>
                                                    Clinical Workspace <ExternalLink size={13} strokeWidth={2} />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Signature modal */}
                {sigRecord && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
                        onClick={() => setSigRecord(null)}>
                        <div onClick={e => e.stopPropagation()} style={{
                            width: '90%', maxWidth: 500, borderRadius: 20,
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden',
                        }}>
                            <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sign Session Record</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Verifying record for <strong style={{ color: 'var(--text-primary)' }}>{sigRecord.studentId?.name}</strong>
                                    </p>
                                </div>
                                <button onClick={() => setSigRecord(null)} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 7 }}>
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                            <div style={{ padding: '22px 26px' }}>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>Draw your signature below (optional):</div>
                                <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fff', position: 'relative' }}>
                                    <canvas ref={canvasRef} width={440} height={140}
                                        style={{ width: '100%', height: 140, cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                                        onMouseDown={e => { const p = getPos(e); startDraw(p.x, p.y); }}
                                        onMouseMove={e => { const p = getPos(e); draw(p.x, p.y); }}
                                        onMouseUp={stopDraw} onMouseLeave={stopDraw}
                                        onTouchStart={e => { e.preventDefault(); const p = getTouchPos(e); startDraw(p.x, p.y); }}
                                        onTouchMove={e => { e.preventDefault(); const p = getTouchPos(e); draw(p.x, p.y); }}
                                        onTouchEnd={stopDraw}
                                    />
                                    <span style={{ position: 'absolute', bottom: 8, left: 12, fontSize: '0.68rem', color: '#bbb', pointerEvents: 'none' }}>Sign here</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                    <button onClick={clearCanvas} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                                    <button onClick={() => { printRecord(sigRecord); setSigRecord(null); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>Skip Signature</button>
                                    <button onClick={handleSignAndPrint} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--ku-green)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                                        Sign & Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

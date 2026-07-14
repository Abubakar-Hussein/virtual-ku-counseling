'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, FileText } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';

export default function ClinicalProgressPage() {
    const { showToast } = useToast();
    const [printing, setPrinting] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [clinicalProgress, setClinicalProgress] = useState<string>('all');
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    // Signature pad
    const [sigOpen, setSigOpen] = useState(false);
    const [pendingPrint, setPendingPrint] = useState<{ data: any[]; title: string; range: string } | null>(null);
    const sigCanvasRef = useRef<HTMLCanvasElement>(null);
    const sigDrawing = useRef(false);

    const clearSig = () => { const c = sigCanvasRef.current; if (!c) return; c.getContext('2d')?.clearRect(0, 0, c.width, c.height); };
    const sigStart = (x: number, y: number) => { const ctx = sigCanvasRef.current?.getContext('2d'); if (!ctx) return; sigDrawing.current = true; ctx.beginPath(); ctx.moveTo(x, y); };
    const sigMove = (x: number, y: number) => { if (!sigDrawing.current) return; const ctx = sigCanvasRef.current?.getContext('2d'); if (!ctx) return; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111'; ctx.lineTo(x, y); ctx.stroke(); };
    const sigStop = () => { sigDrawing.current = false; };
    const sigMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => { const r = sigCanvasRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const sigTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => { const r = sigCanvasRef.current!.getBoundingClientRect(); const t = e.touches[0]; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
    const isSigBlank = () => { const c = sigCanvasRef.current; if (!c) return true; const px = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < px.length; i += 4) { if (px[i] !== 0) return false; } return true; };

    const openSigModal = (data: any[], title: string, range: string) => { setPendingPrint({ data, title, range }); setSigOpen(true); };
    const closeSigModal = () => { setSigOpen(false); setPendingPrint(null); };
    const handleSignAndPrint = () => { if (!pendingPrint) return; const sig = isSigBlank() ? undefined : sigCanvasRef.current?.toDataURL('image/png'); handlePrintReport(pendingPrint.data, pendingPrint.title, pendingPrint.range, sig); closeSigModal(); };
    const handleSkipSignature = () => { if (!pendingPrint) return; handlePrintReport(pendingPrint.data, pendingPrint.title, pendingPrint.range); closeSigModal(); };

    const generateVerifyId = () => {
        const now = new Date();
        const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randPart = Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        return `KU-RPT-${datePart}-${randPart}`;
    };

    const handlePrintReport = (data: any[], title: string, rangeLabel: string, signatureDataUrl?: string) => {
        const w = window.open('', '_blank'); if (!w) return;
        const verifyId = generateVerifyId();
        const generatedAt = new Date().toLocaleString();
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        const tableRows = data.map(row => `<tr>${headers.map(h => `<td>${typeof row[h] === 'object' ? (row[h]?.name || row[h]?.email || JSON.stringify(row[h])) : String(row[h] ?? '—')}</td>`).join('')}</tr>`).join('');
        w.document.write(`<html><head><title>${title} — KU Wellness</title>
            <style>
                body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 1100px; margin: 32px auto; color: #111; line-height: 1.5; padding: 0 24px; }
                .header { border-bottom: 3px solid #325343; padding-bottom: 12px; margin-bottom: 20px; }
                .header h1 { font-size: 1.5rem; color: #325343; margin: 0 0 4px; letter-spacing: 0.04em; }
                .header h2 { font-size: 1.1rem; color: #333; margin: 0 0 8px; font-weight: 600; }
                .meta { display: flex; gap: 24px; font-size: 0.82rem; color: #666; }
                .confidential { color: #325343; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 0.8rem; }
                th { background: #325343 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #fff !important; padding: 10px 12px; text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #1e3a2a; }
                td { padding: 7px 10px; border-bottom: 1px solid #e5e5e5; vertical-align: top; max-width: 220px; overflow-wrap: break-word; }
                tr:nth-child(even) { background: #f6f9f7; }
                .count { font-size: 0.82rem; color: #555; margin-top: 12px; }
                .verify-footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 0.68rem; color: #999; display: flex; justify-content: space-between; align-items: center; }
                @media print { body { margin: 16px; } }
            </style></head><body>
            <div class="header">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                    <div style="width:56px;height:56px;border-radius:14px;background:#325343;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10h18'/><path d='M8 2v4m8-4v4'/><rect x='3' y='4' width='18' height='18' rx='2'/><path d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01'/><path d='M12 14c.667-.667 2-1 2-2.5a1.5 1.5 0 0 0-3 0'/></svg></div>
                    <div>
                        <p class="confidential" style="margin: 0 0 4px 0;">Confidential — Administrative Report</p>
                        <h1 style="margin: 0;">KU Wellness</h1>
                    </div>
                </div>
                <h2>${title}</h2>
                <div class="meta"><span><strong>Report Range:</strong> ${rangeLabel}</span><span><strong>Generated:</strong> ${generatedAt}</span><span><strong>Records:</strong> ${data.length}</span><span><strong>Verify ID:</strong> ${verifyId}</span></div>
            </div>
            ${data.length > 0 ? `<table><thead><tr>${headers.map(h => `<th>${h.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table><p class="count">${data.length} record${data.length !== 1 ? 's' : ''} total</p>` : '<p style="color:#888;margin-top:32px;">No data available for the selected period.</p>'}
            ${signatureDataUrl ? `<div style="margin-top:28px;"><h3 style="font-size:0.9rem;color:#325343;margin-bottom:4px;">Administrator Verification</h3><img src="${signatureDataUrl}" style="max-width:240px;height:auto;border-bottom:1px solid #333;" /><p style="font-size:0.8rem;margin:4px 0 0;">Digitally signed — ${generatedAt}</p></div>` : ''}
            <div class="verify-footer"><span>Generated by KU Wellness — Administrative Reports</span><span>Verify ID: ${verifyId}</span><span>${generatedAt}</span></div>
            </body></html>`);
        w.document.close(); w.print();
    };

    const buildUrl = () => {
        const params = new URLSearchParams({ startDate: dateRange.start, endDate: dateRange.end });
        if (clinicalProgress && clinicalProgress !== 'all') params.set('progress', clinicalProgress);
        return `/api/admin/reports/clinical-summary?${params.toString()}`;
    };

    const fetchPreview = async () => {
        setPreviewLoading(true);
        try {
            const res = await fetch(buildUrl(), { cache: 'no-store' });
            const data = await res.json();
            setPreviewData(Array.isArray(data) ? data : []);
        } catch { showToast('Failed to load preview data', 'error'); }
        finally { setPreviewLoading(false); }
    };

    const printReport = async () => {
        setPrinting(true);
        try {
            // Reuse previewed data if available, otherwise fetch fresh
            let data = previewData.length > 0 ? previewData : null;
            if (!data) {
                const res = await fetch(buildUrl(), { cache: 'no-store' });
                data = await res.json();
                if (!Array.isArray(data)) data = [];
            }
            if (data && data.length > 0) {
                const formatted = data.map((n: any) => {
                    const entry: any = {
                        Date: (() => { try { return new Date(n.createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' }) } catch { return new Date(n.createdAt).toLocaleDateString() } })(),
                        Student: n.studentId?.name || 'N/A', StudentID: n.studentId?.studentId || 'N/A',
                        Counselor: n.counselorId?.name || 'N/A',
                    };
                    if (clinicalProgress === 'all') entry.Progress = n.progressIndicator;
                    entry.Notes_Snippet = n.notes.substring(0, 50) + '...';
                    entry.ActionItems = n.actionItems;
                    return entry;
                });
                const progressLabel = clinicalProgress === 'all' ? 'All Indicators' : clinicalProgress;
                openSigModal(formatted, `Clinical Session Progress Summary — ${progressLabel}`, `${dateRange.start} → ${dateRange.end}`);
                showToast(`Clinical report ready — sign and print! (${formatted.length} records)`, 'success');
            } else { showToast('No clinical data found for the selected filters.', 'error'); }
        } catch { showToast('Failed to export clinical data', 'error'); }
        finally { setPrinting(false); }
    };

    const PROGRESS_OPTIONS = [
        { value: 'all', label: 'All', color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border)' },
        { value: 'Improved', label: 'Improved', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
        { value: 'Stable', label: 'Stable', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)' },
        { value: 'Declined', label: 'Declined', color: '#f87171', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' },
        { value: 'Not Evaluated', label: 'Not Evaluated', color: '#94a3b8', bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)' },
    ];

    const hiddenCols = ['_id', '__v', 'updatedAt'];
    if (clinicalProgress !== 'all') hiddenCols.push('progressIndicator');
    const headers = previewData.length > 0 ? Object.keys(previewData[0]).filter(k => !hiddenCols.includes(k)) : [];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                {/* Breadcrumb */}
                <div style={{ marginBottom: 24 }}>
                    <Link href="/admin/reports" style={{ color: 'var(--ku-green)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} strokeWidth={2.5} /> Back to Reports
                    </Link>
                </div>

                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
                            <FileText size={12} strokeWidth={2.5} /> Admin Reports
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Clinical Progress</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Filter, preview, and print clinical progress reports.</p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Filters */}
                <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Filter Progress By</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progress Date Range</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px' }}>
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progress Indicator</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {PROGRESS_OPTIONS.map(p => (
                                    <button key={p.value} onClick={() => setClinicalProgress(p.value)} style={{
                                        padding: '5px 12px', borderRadius: 20,
                                        border: `1px solid ${clinicalProgress === p.value ? p.border : 'var(--border)'}`,
                                        background: clinicalProgress === p.value ? p.bg : 'transparent',
                                        color: clinicalProgress === p.value ? p.color : 'var(--text-muted)',
                                        fontSize: '0.72rem', fontWeight: clinicalProgress === p.value ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s',
                                    }}>{p.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button className="btn-primary" onClick={fetchPreview} disabled={previewLoading} style={{ fontSize: '0.85rem' }}>
                            {previewLoading ? 'Loading...' : 'Preview Data'}
                        </button>
                        <button onClick={printReport} disabled={printing} style={{
                            padding: '10px 20px', borderRadius: 12, border: '1px solid var(--ku-green)', background: 'transparent',
                            color: 'var(--ku-green)', fontWeight: 600, fontSize: '0.85rem', cursor: printing ? 'not-allowed' : 'pointer',
                            opacity: printing ? 0.6 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                        }}>{printing ? 'Preparing...' : 'Print Report'}</button>
                    </div>
                </div>

                {/* Preview */}
                {previewData.length > 0 && (
                    <div className="glass" style={{ padding: 24, overflowX: 'auto' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Preview: Clinical Progress ({previewData.length} records)</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                                {headers.map(h => <th key={h} style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{h.replace(/[A-Z]/g, ' $&')}</th>)}
                            </tr></thead>
                            <tbody>{previewData.slice(0, 10).map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    {headers.map(h => {
                                        let val = row[h];
                                        if (typeof val === 'object') val = val?.name || val?.email || JSON.stringify(val);
                                        else if (h === 'createdAt' || h === 'date') {
                                            try {
                                                val = new Date(val).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: h === 'createdAt' ? 'short' : undefined });
                                            } catch {}
                                        }
                                        return <td key={h} style={{ padding: '12px 8px' }}>{String(val)}</td>;
                                    })}
                                </tr>
                            ))}</tbody>
                        </table>
                        {previewData.length > 10 && <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Showing first 10 of {previewData.length} records.</p>}
                    </div>
                )}

                {/* Signature Modal */}
                {sigOpen && pendingPrint && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} onClick={closeSigModal}>
                        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '90%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>Sign Report</h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>Draw your signature below to verify <strong>{pendingPrint.title}</strong>.</p>
                            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff', position: 'relative' }}>
                                <canvas ref={sigCanvasRef} width={420} height={140} style={{ width: '100%', height: 140, cursor: 'crosshair', touchAction: 'none' }}
                                    onMouseDown={e => { const p = sigMousePos(e); sigStart(p.x, p.y); }} onMouseMove={e => { const p = sigMousePos(e); sigMove(p.x, p.y); }}
                                    onMouseUp={sigStop} onMouseLeave={sigStop}
                                    onTouchStart={e => { e.preventDefault(); const p = sigTouchPos(e); sigStart(p.x, p.y); }} onTouchMove={e => { e.preventDefault(); const p = sigTouchPos(e); sigMove(p.x, p.y); }} onTouchEnd={sigStop}
                                />
                                <span style={{ position: 'absolute', bottom: 8, left: 12, fontSize: '0.68rem', color: '#bbb', pointerEvents: 'none' }}>Sign here</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                                <button onClick={clearSig} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>Clear</button>
                                <button onClick={handleSkipSignature} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>Skip Signature</button>
                                <button onClick={handleSignAndPrint} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'var(--ku-green)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Sign &amp; Print</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}


'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';

export default function AuditLogsPage() {
    const { showToast } = useToast();
    const [printing, setPrinting] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [auditAction, setAuditAction] = useState<string>('all');
    const [auditResource, setAuditResource] = useState<string>('all');
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
        w.document.write(`<html><head><title>${title} — Virtual Counseling Booking and Scheduling System</title>
            <style>
                body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 1100px; margin: 32px auto; color: #111; line-height: 1.5; padding: 0 24px; }
                .header { border-bottom: 3px solid #9b7e49; padding-bottom: 12px; margin-bottom: 20px; }
                .header h1 { font-size: 1.5rem; color: #9b7e49; margin: 0 0 4px; letter-spacing: 0.04em; }
                .header h2 { font-size: 1.1rem; color: #333; margin: 0 0 8px; font-weight: 600; }
                .meta { display: flex; gap: 24px; font-size: 0.82rem; color: #666; }
                .confidential { color: #9b7e49; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 0.8rem; }
                th { background: #9b7e49; color: #fff; padding: 8px 10px; text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; }
                td { padding: 7px 10px; border-bottom: 1px solid #e5e5e5; vertical-align: top; max-width: 220px; overflow-wrap: break-word; }
                tr:nth-child(even) { background: #fafaf8; }
                .count { font-size: 0.82rem; color: #555; margin-top: 12px; }
                .verify-footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 0.68rem; color: #999; display: flex; justify-content: space-between; align-items: center; }
                @media print { body { margin: 16px; } }
            </style></head><body>
            <div class="header">
                <p class="confidential">🔒 Confidential — Administrative Report</p>
                <h1>Virtual Counseling Booking and Scheduling System</h1><h2>${title}</h2>
                <div class="meta"><span><strong>Report Range:</strong> ${rangeLabel}</span><span><strong>Generated:</strong> ${generatedAt}</span><span><strong>Records:</strong> ${data.length}</span><span><strong>Verify ID:</strong> ${verifyId}</span></div>
            </div>
            ${data.length > 0 ? `<table><thead><tr>${headers.map(h => `<th>${h.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table><p class="count">${data.length} record${data.length !== 1 ? 's' : ''} total</p>` : '<p style="color:#888;margin-top:32px;">No data available for the selected period.</p>'}
            ${signatureDataUrl ? `<div style="margin-top:28px;"><h3 style="font-size:0.9rem;color:#9b7e49;margin-bottom:4px;">Administrator Verification</h3><img src="${signatureDataUrl}" style="max-width:240px;height:auto;border-bottom:1px solid #333;" /><p style="font-size:0.8rem;margin:4px 0 0;">Digitally signed — ${generatedAt}</p></div>` : ''}
            <div class="verify-footer"><span>Generated by Virtual Counseling Booking and Scheduling System — Administrative Reports</span><span>Verify ID: ${verifyId}</span><span>${generatedAt}</span></div>
            </body></html>`);
        w.document.close(); w.print();
    };

    const buildUrl = () => {
        const params = new URLSearchParams({ startDate: dateRange.start, endDate: dateRange.end });
        if (auditAction && auditAction !== 'all') params.set('action', auditAction);
        if (auditResource && auditResource !== 'all') params.set('resource', auditResource);
        return `/api/admin/reports/audit-logs?${params.toString()}`;
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
                const formatted = data.map((l: any) => {
                    const entry: any = { Timestamp: new Date(l.createdAt).toLocaleString(), User: l.userName };
                    if (auditAction === 'all') entry.Action = l.action;
                    if (auditResource === 'all') entry.Resource = l.resource;
                    entry.Details = l.details;
                    return entry;
                });
                const actionLabel = auditAction === 'all' ? 'All Actions' : auditAction;
                const resourceLabel = auditResource === 'all' ? 'All Resources' : auditResource;
                openSigModal(formatted, `System Audit Logs — ${actionLabel} / ${resourceLabel}`, `${dateRange.start} → ${dateRange.end}`);
                showToast(`Audit logs ready — sign and print! (${formatted.length} records)`, 'success');
            } else { showToast('No logs found for the selected filters.', 'error'); }
        } catch { showToast('Failed to export logs', 'error'); }
        finally { setPrinting(false); }
    };

    const hiddenCols = ['_id', '__v', 'updatedAt', 'ipAddress'];
    if (auditAction !== 'all') hiddenCols.push('action');
    if (auditResource !== 'all') hiddenCols.push('resource');
    const headers = previewData.length > 0 ? Object.keys(previewData[0]).filter(k => !hiddenCols.includes(k)) : [];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <div style={{ marginBottom: 24 }}>
                    <Link href="/admin/reports" style={{ color: 'var(--ku-gold)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Back to Reports</Link>
                </div>

                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontSize: '2rem', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>🛡️</div>
                        <div>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>System Audit Logs</h1>
                            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Filter, preview, and print security audit reports.</p>
                        </div>
                    </div>
                    <NotificationBell />
                </header>

                {/* Filters */}
                <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Filter Logs By</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' }}>
                        {/* Date range */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Log Date Range</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px' }}>
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }} />
                            </div>
                        </div>
                        {/* Action type */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action Type</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(['all', 'LOGIN', 'BOOK_APPOINTMENT', 'UPDATE_PROFILE', 'DELETE_USER'] as const).map(a => (
                                    <button key={a} onClick={() => setAuditAction(a)} style={{
                                        padding: '5px 10px', borderRadius: 20,
                                        border: `1px solid ${auditAction === a ? 'rgba(99,102,241,0.6)' : 'var(--border)'}`,
                                        background: auditAction === a ? 'rgba(99,102,241,0.15)' : 'transparent',
                                        color: auditAction === a ? '#818cf8' : 'var(--text-muted)',
                                        fontSize: '0.68rem', fontWeight: auditAction === a ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
                                    }}>{a === 'all' ? 'All Actions' : a.replace(/_/g, ' ')}</button>
                                ))}
                            </div>
                        </div>
                        {/* Resource type */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resource Type</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(['all', 'USER', 'APPOINTMENT', 'PROFILE'] as const).map(r => (
                                    <button key={r} onClick={() => setAuditResource(r)} style={{
                                        padding: '5px 10px', borderRadius: 20,
                                        border: `1px solid ${auditResource === r ? 'rgba(20,184,166,0.6)' : 'var(--border)'}`,
                                        background: auditResource === r ? 'rgba(20,184,166,0.15)' : 'transparent',
                                        color: auditResource === r ? '#2dd4bf' : 'var(--text-muted)',
                                        fontSize: '0.68rem', fontWeight: auditResource === r ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
                                    }}>{r === 'all' ? 'All' : r}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button className="btn-primary" onClick={fetchPreview} disabled={previewLoading} style={{ fontSize: '0.85rem', background: 'linear-gradient(135deg, #475569, #1e293b)' }}>
                            {previewLoading ? '⏳ Loading...' : '👁 Preview Data'}
                        </button>
                        <button onClick={printReport} disabled={printing} style={{
                            padding: '10px 20px', borderRadius: 12, border: '1px solid #475569', background: 'transparent',
                            color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem', cursor: printing ? 'not-allowed' : 'pointer',
                            opacity: printing ? 0.6 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                        }}>{printing ? '⏳ Preparing...' : '🖨 Print Report'}</button>
                    </div>
                </div>

                {/* Preview */}
                {previewData.length > 0 && (
                    <div className="glass" style={{ padding: 24, overflowX: 'auto' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Preview: Audit Logs ({previewData.length} records)</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                                {headers.map(h => <th key={h} style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{h.replace(/[A-Z]/g, ' $&')}</th>)}
                            </tr></thead>
                            <tbody>{previewData.slice(0, 10).map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    {headers.map(h => <td key={h} style={{ padding: '12px 8px' }}>{typeof row[h] === 'object' ? row[h]?.name || row[h]?.email || JSON.stringify(row[h]) : String(row[h])}</td>)}
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
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>✍️ Sign Report</h3>
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
                                <button onClick={handleSignAndPrint} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #9b7e49, #c9a84c)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>✅ Sign & Print</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

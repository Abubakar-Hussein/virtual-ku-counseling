'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Users, ArrowLeft, FileText, Printer, Eye } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';

export default function UserDemographicsPage() {
    const { showToast } = useToast();
    const [printing, setPrinting] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [userRole, setUserRole] = useState<string>('all');
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
                td { padding: 9px 12px; border-bottom: 1px solid #e5e5e5; vertical-align: top; max-width: 220px; overflow-wrap: break-word; }
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
        if (userRole && userRole !== 'all') params.set('role', userRole);
        return `/api/admin/users?${params.toString()}`;
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
            let formatted: any[] = [];

            if (previewData.length > 0) {
                // Reuse the already-formatted preview data — exactly what the admin sees on screen
                formatted = previewData.map((u: any) => {
                    const row: any = {
                        'Full Name': u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—',
                        'Student ID': u.studentId || '—',
                        'Email': u.email,
                        'Phone': u.phone || '—',
                    };
                    if (userRole === 'all') {
                        row['Role'] = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : '—';
                    }
                    row['Status'] = (u.approvalStatus || 'approved').toUpperCase();
                    try {
                        row['Joined Date'] = new Date(u.createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium' });
                    } catch {
                        row['Joined Date'] = new Date(u.createdAt).toLocaleDateString();
                    }
                    return row;
                });
            } else {
                // No preview — fetch fresh
                const res = await fetch(buildUrl(), { cache: 'no-store' });
                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) {
                    showToast('No user data found for the selected filters.', 'error');
                    return;
                }
                formatted = data.map((u: any) => {
                    const row: any = {
                        'Full Name': u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—',
                        'Student ID': u.studentId || '—',
                        'Email': u.email,
                        'Phone': u.phone || '—',
                    };
                    if (userRole === 'all') {
                        row['Role'] = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : '—';
                    }
                    row['Status'] = (u.approvalStatus || 'approved').toUpperCase();
                    try {
                        row['Joined Date'] = new Date(u.createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium' });
                    } catch {
                        row['Joined Date'] = new Date(u.createdAt).toLocaleDateString();
                    }
                    return row;
                });
            }

            if (formatted.length > 0) {
                const roleLabel = userRole === 'all' ? 'All Roles' : userRole.charAt(0).toUpperCase() + userRole.slice(1) + 's';
                openSigModal(formatted, `Users Demographic Report — ${roleLabel}`, `${dateRange.start} → ${dateRange.end}`);
                showToast(`Users report ready — sign and print! (${formatted.length} records)`, 'success');
            } else {
                showToast('No user data found for the selected filters.', 'error');
            }
        } catch { showToast('Failed to generate users report.', 'error'); }
        finally { setPrinting(false); }
    };


    const formatUserForTable = (u: any) => {
        const row: any = {
            'Full Name': u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—',
            'Student ID': u.studentId || '—',
            'Email': u.email,
            'Phone': u.phone || '—',
        };
        if (userRole === 'all') {
            row['Role'] = u.role.charAt(0).toUpperCase() + u.role.slice(1);
        }
        row['Status'] = (u.approvalStatus || 'approved').toUpperCase();
        row['Joined Date'] = new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        return row;
    };

    const tableData = previewData.map(formatUserForTable);
    const headers = tableData.length > 0 ? Object.keys(tableData[0]) : [];

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
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Users Demographics</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Filter, preview, and export user demographic data.</p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Filters */}
                <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Filter Users By</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' }}>
                        {/* Date range */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registration Date Range</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px' }}>
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }} />
                            </div>
                        </div>
                        {/* Role */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>User Role</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {(['all', 'student', 'counselor', 'admin'] as const).map(r => (
                                    <button key={r} onClick={() => setUserRole(r)} style={{
                                        padding: '6px 14px', borderRadius: 8,
                                        border: `1px solid ${userRole === r ? 'var(--ku-green)' : 'var(--border)'}`,
                                        background: userRole === r ? 'rgba(50,83,67,0.08)' : 'transparent',
                                        color: userRole === r ? 'var(--ku-green)' : 'var(--text-muted)',
                                        fontSize: '0.78rem', fontWeight: userRole === r ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
                                    }}>
                                        {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button className="btn-primary" onClick={fetchPreview} disabled={previewLoading} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Eye size={15} strokeWidth={2} />
                            {previewLoading ? 'Loading...' : 'Preview Data'}
                        </button>
                        <button onClick={printReport} disabled={printing} style={{
                            padding: '10px 20px', borderRadius: 12, border: '1px solid var(--ku-green)', background: 'rgba(50,83,67,0.06)',
                            color: 'var(--ku-green)', fontWeight: 600, fontSize: '0.85rem', cursor: printing ? 'not-allowed' : 'pointer',
                            opacity: printing ? 0.6 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <Printer size={15} strokeWidth={2} />
                            {printing ? 'Preparing...' : 'Export Report'}
                        </button>
                    </div>
                </div>


                {/* Preview Table */}
                {previewData.length > 0 && (
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        marginTop: 8,
                    }}>
                        {/* Table header bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '18px 24px',
                            borderBottom: '1px solid var(--border)',
                            background: 'rgba(50,83,67,0.03)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    Preview: Users Demographics
                                </h2>
                                <span style={{
                                    background: 'rgba(50,83,67,0.08)',
                                    border: '1px solid rgba(50,83,67,0.15)',
                                    color: 'var(--ku-green)',
                                    borderRadius: 20, padding: '2px 10px',
                                    fontSize: '0.72rem', fontWeight: 700,
                                }}>
                                    {previewData.length} records
                                </span>
                            </div>
                            {previewData.length > 10 && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Showing first 10 — export for full report
                                </span>
                            )}
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(50,83,67,0.04)', borderBottom: '1px solid var(--border)' }}>
                                        {headers.map(h => (
                                            <th key={h} style={{
                                                padding: '12px 16px', textAlign: 'left',
                                                fontSize: '0.7rem', fontWeight: 700,
                                                textTransform: 'uppercase', letterSpacing: '0.07em',
                                                color: 'var(--ku-green)', whiteSpace: 'nowrap',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.slice(0, 10).map((row: any, i: number) => (
                                        <tr key={i}
                                            style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(50,83,67,0.03)'}
                                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                                        >
                                            {headers.map(h => (
                                                <td key={h} style={{ padding: '14px 16px', color: 'var(--text-primary)', verticalAlign: 'middle' }}>
                                                    {h === 'Status' ? (
                                                        <span style={{
                                                            fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                                                            background: row[h] === 'APPROVED' ? 'rgba(50,83,67,0.1)' : 'rgba(250,204,21,0.1)',
                                                            color: row[h] === 'APPROVED' ? 'var(--ku-green)' : '#b45309',
                                                            border: row[h] === 'APPROVED' ? '1px solid rgba(50,83,67,0.2)' : '1px solid rgba(245,158,11,0.2)',
                                                            letterSpacing: '0.05em',
                                                        }}>
                                                            {row[h]}
                                                        </span>
                                                    ) : h === 'Role' ? (
                                                        <span style={{
                                                            fontSize: '0.78rem', fontWeight: 600,
                                                            color: 'var(--ku-green)',
                                                        }}>
                                                            {row[h]}
                                                        </span>
                                                    ) : h === 'Full Name' ? (
                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row[h]}</span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)' }}>{row[h]}</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '14px 24px',
                            borderTop: '1px solid var(--border)',
                            background: 'rgba(50,83,67,0.02)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {previewData.length > 10
                                    ? `Showing 10 of ${previewData.length} records. Use Export Report for the full dataset.`
                                    : `${previewData.length} record${previewData.length !== 1 ? 's' : ''} found.`
                                }
                            </span>
                        </div>
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
                                <button onClick={handleSkipSignature} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(50,83,67,0.25)', background: 'rgba(50,83,67,0.04)', color: 'var(--ku-green)', fontSize: '0.8rem', cursor: 'pointer' }}>Skip Signature</button>
                                <button onClick={handleSignAndPrint} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'var(--ku-green)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Sign & Export</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}


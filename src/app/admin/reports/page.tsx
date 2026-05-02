'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
    const { showToast } = useToast();
    const [generatingUsers, setGeneratingUsers] = useState(false);
    const [generatingAppointments, setGeneratingAppointments] = useState(false);
    const [generatingAuditLogs, setGeneratingAuditLogs] = useState(false);
    const [generatingClinical, setGeneratingClinical] = useState(false);
    
    // Preview States
    const [previewType, setPreviewType] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    
    // Global date filter (used by all reports & stats)
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // User-Demographics-specific filters
    const [userRole, setUserRole] = useState<string>('all');
    const [userDateRange, setUserDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Appointments History-specific filters
    const [apptStatus, setApptStatus] = useState<string>('all');
    const [apptDateRange, setApptDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Audit Logs-specific filters
    const [auditAction, setAuditAction] = useState<string>('all');
    const [auditResource, setAuditResource] = useState<string>('all');
    const [auditDateRange, setAuditDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Clinical Progress-specific filters
    const [clinicalDateRange, setClinicalDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

const downloadPDF = (data: any[], fileName: string, title: string) => {
        const doc = new jsPDF('l', 'mm', 'a4'); 
        doc.setFontSize(20);
        doc.setTextColor(155, 126, 73);
        doc.text('KU WELLNESS CONNECT', 14, 20);
        
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text(title, 14, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
        doc.text(`Report Range: ${dateRange.start} to ${dateRange.end}`, 14, 44);

        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const body = data.map(row => headers.map(h => String(row[h])));

            autoTable(doc, {
                startY: 52,
                head: [headers.map(h => h.replace(/([A-Z])/g, ' $1').toUpperCase())],
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [155, 126, 73], textColor: [255, 255, 255], fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
                margin: { horizontal: 14 },
            });
        } else {
            doc.text('No data available for the selected period.', 14, 60);
        }

        doc.save(fileName);
    };

    // Build the users API URL with all active filters
    const buildUsersUrl = () => {
        const params = new URLSearchParams({
            startDate: userDateRange.start,
            endDate:   userDateRange.end,
        });
        if (userRole && userRole !== 'all') params.set('role', userRole);
        return `/api/admin/users?${params.toString()}`;
    };

    const generateUsersReport = async () => {
        setGeneratingUsers(true);
        try {
            const res = await fetch(buildUsersUrl(), { cache: 'no-store' });
            const data = await res.json();
            if (data && data.length > 0) {
                const formattedData = data.map((u: any) => ({
                    ID: u._id,
                    Name: `${u.firstName || ''} ${u.lastName || u.name || ''}`.trim(),
                    Email: u.email,
                    Role: u.role,
                    StudentId: u.studentId || 'N/A',
                    JoinedDate: new Date(u.createdAt).toLocaleDateString()
                }));
                const roleLabel = userRole === 'all'
                    ? 'All Roles'
                    : userRole.charAt(0).toUpperCase() + userRole.slice(1) + 's';
                downloadPDF(
                    formattedData,
                    `Users_Report_${roleLabel}_${userDateRange.start}_to_${userDateRange.end}.pdf`,
                    `Users Demographic Report — ${roleLabel} (${userDateRange.start} → ${userDateRange.end})`
                );
                showToast(`Users report downloaded! (${formattedData.length} records)`, 'success');
            } else {
                showToast('No user data found for the selected filters.', 'error');
            }
        } catch (error) {
            console.error('Error generating users report:', error);
            showToast('Failed to generate users report.', 'error');
        } finally {
            setGeneratingUsers(false);
        }
    };

    // Build the appointments API URL with all active filters
    const buildAppointmentsUrl = () => {
        const params = new URLSearchParams({
            startDate: apptDateRange.start,
            endDate:   apptDateRange.end,
        });
        if (apptStatus && apptStatus !== 'all') params.set('status', apptStatus);
        return `/api/appointments?${params.toString()}`;
    };

    const generateAppointmentsReport = async () => {
        setGeneratingAppointments(true);
        try {
            const res = await fetch(buildAppointmentsUrl(), { cache: 'no-store' });
            const data = await res.json();
            if (data && data.length > 0) {
                const formattedData = data.map((a: any) => ({
                    StudentName: a.studentId?.name || 'Unknown',
                    StudentEmail: a.studentId?.email || 'Unknown',
                    CounselorName: a.counselorId?.name || 'Unknown',
                    AppointmentDate: new Date(a.date).toLocaleDateString(),
                    TimeSlot: a.timeSlot,
                    Status: a.status,
                    Specialization: a.specialization,
                    Reason: a.reason,
                    BookedOn: new Date(a.createdAt).toLocaleDateString()
                }));
                const statusLabel = apptStatus === 'all' ? 'All Statuses' : apptStatus.charAt(0).toUpperCase() + apptStatus.slice(1);
                downloadPDF(
                    formattedData,
                    `Appointments_Report_${statusLabel}_${apptDateRange.start}_to_${apptDateRange.end}.pdf`,
                    `Counseling Appointments History — ${statusLabel} (${apptDateRange.start} → ${apptDateRange.end})`
                );
                showToast(`Appointments report downloaded! (${formattedData.length} records)`, 'success');
            } else {
                showToast('No appointments found for the selected filters.', 'error');
            }
        } catch (error) {
            console.error('Error generating appointments report:', error);
            showToast('Failed to generate appointments report.', 'error');
        } finally {
            setGeneratingAppointments(false);
        }
    };

    // Build the audit logs API URL with all active filters
    const buildAuditLogsUrl = () => {
        const params = new URLSearchParams({
            startDate: auditDateRange.start,
            endDate:   auditDateRange.end,
        });
        if (auditAction   && auditAction   !== 'all') params.set('action',   auditAction);
        if (auditResource && auditResource !== 'all') params.set('resource', auditResource);
        return `/api/admin/reports/audit-logs?${params.toString()}`;
    };

    const generateAuditLogsReport = async () => {
        setGeneratingAuditLogs(true);
        try {
            const res = await fetch(buildAuditLogsUrl(), { cache: 'no-store' });
            const data = await res.json();
            if (data && data.length > 0) {
                const formattedData = data.map((l: any) => ({
                    Timestamp: new Date(l.createdAt).toLocaleString(),
                    User:      l.userName,
                    Action:    l.action,
                    Resource:  l.resource,
                    Details:   l.details,
                    IP:        l.ipAddress || 'N/A'
                }));
                const actionLabel   = auditAction   === 'all' ? 'All Actions'   : auditAction;
                const resourceLabel = auditResource === 'all' ? 'All Resources' : auditResource;
                downloadPDF(
                    formattedData,
                    `Audit_Logs_${actionLabel}_${resourceLabel}_${auditDateRange.start}_to_${auditDateRange.end}.pdf`,
                    `System Audit Logs — ${actionLabel} / ${resourceLabel} (${auditDateRange.start} → ${auditDateRange.end})`
                );
                showToast(`Audit logs downloaded! (${formattedData.length} records)`, 'success');
            } else {
                showToast('No logs found for the selected filters.', 'error');
            }
        } catch (err) {
            showToast('Failed to export logs', 'error');
        } finally {
            setGeneratingAuditLogs(false);
        }
    };

    const generateClinicalReport = async () => {
        setGeneratingClinical(true);
        try {
            const res = await fetch(`/api/admin/reports/clinical-summary?startDate=${clinicalDateRange.start}&endDate=${clinicalDateRange.end}`, { cache: 'no-store' });
            const data = await res.json();
            if (data && data.length > 0) {
                const formattedData = data.map((n: any) => ({
                    Date: new Date(n.createdAt).toLocaleDateString(),
                    Student: n.studentId?.name || 'N/A',
                    StudentID: n.studentId?.studentId || 'N/A',
                    Counselor: n.counselorId?.name || 'N/A',
                    Progress: n.progressIndicator,
                    Notes_Snippet: n.notes.substring(0, 50) + '...',
                    ActionItems: n.actionItems
                }));
                downloadPDF(
                    formattedData, 
                    `Clinical_Summary_${clinicalDateRange.start}_to_${clinicalDateRange.end}.pdf`, 
                    `Clinical Session Progress Summary (${clinicalDateRange.start} → ${clinicalDateRange.end})`
                );
                showToast(`Clinical report downloaded! (${formattedData.length} records)`, 'success');
            } else {
                showToast('No clinical data found for the selected filters.', 'error');
            }
        } catch (err) {
            showToast('Failed to export clinical data', 'error');
        } finally {
            setGeneratingClinical(false);
        }
    };

    const fetchPreview = async (type: string) => {
        setPreviewLoading(true);
        setPreviewType(type);
        try {
            let url = '';
            if (type === 'users') url = buildUsersUrl();
            else if (type === 'appointments') url = buildAppointmentsUrl();
            else if (type === 'audit') url = buildAuditLogsUrl();
            else if (type === 'clinical') url = `/api/admin/reports/clinical-summary?startDate=${clinicalDateRange.start}&endDate=${clinicalDateRange.end}`;

            const res = await fetch(url, { cache: 'no-store' });
            const data = await res.json();
            setPreviewData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch preview:', err);
            showToast('Failed to load preview data', 'error');
        } finally {
            setPreviewLoading(false);
        }
    };

    const getReportTitle = (type: string) => {
        const titles: any = { users: 'Users Demographics', appointments: 'Appointments History', audit: 'System Audit Logs', clinical: 'Clinical Progress' };
        return titles[type] || 'Report Data';
    };

    const renderPreviewTable = () => {
        if (!previewType || previewData.length === 0) return null;

        const headers = Object.keys(previewData[0]).filter(k => !['_id', '__v', 'password', 'updatedAt'].includes(k));

        return (
            <div className="glass" style={{ marginTop: 32, padding: 24, overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Preview: {getReportTitle(previewType)}</h2>
                    <button 
                        className="btn-primary" 
                        onClick={() => {
                            if (previewType === 'users') generateUsersReport();
                            else if (previewType === 'appointments') generateAppointmentsReport();
                            else if (previewType === 'audit') generateAuditLogsReport();
                            else if (previewType === 'clinical') generateClinicalReport();
                        }}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                        Download Full PDF
                    </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                            {headers.map(h => <th key={h} style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{h.replace(/[A-Z]/g, ' $&')}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {previewData.slice(0, 10).map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                {headers.map(h => (
                                    <td key={h} style={{ padding: '12px 8px' }}>
                                        {typeof row[h] === 'object' ? row[h]?.name || row[h]?.email || JSON.stringify(row[h]) : String(row[h])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {previewData.length > 10 && (
                    <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Showing first 10 of {previewData.length} records. Download PDF for full report.
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>System Reports</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Generate and download system-wide activity reports.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="glass" style={{ padding: '6px 12px', display: 'flex', gap: 12, alignItems: 'center', borderRadius: 12 }}>
                            <input 
                                type="date" 
                                value={dateRange.start} 
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                            <input 
                                type="date" 
                                value={dateRange.end} 
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                            />
                        </div>
                        <NotificationBell />
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                    {/* ── Users Demographics card with inline filters ── */}
                    <div className="glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                            <div style={{ fontSize: '2rem' }}>👥</div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 2 }}>Users Demographics</h2>
                                {/* Active filters badge */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        background: 'rgba(155,126,73,0.15)', border: '1px solid rgba(155,126,73,0.4)',
                                        borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', color: 'var(--ku-gold)'
                                    }}>
                                        📅 {userDateRange.start} → {userDateRange.end}
                                    </span>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        background: userRole === 'all' ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.15)',
                                        border: `1px solid ${userRole === 'all' ? 'var(--border)' : 'rgba(16,185,129,0.4)'}`,
                                        borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem',
                                        color: userRole === 'all' ? 'var(--text-muted)' : '#10b981'
                                    }}>
                                        🎭 {userRole === 'all' ? 'All Roles' : userRole.charAt(0).toUpperCase() + userRole.slice(1) + 's'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Export a filtered list of platform users by registration date and role.
                        </p>

                        {/* ── Filter Controls ── */}
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Filter Users By</p>

                            {/* Date range row */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registration Date Range</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px' }}>
                                    <input
                                        id="user-date-start"
                                        type="date"
                                        value={userDateRange.start}
                                        onChange={e => setUserDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }}
                                    />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                                    <input
                                        id="user-date-end"
                                        type="date"
                                        value={userDateRange.end}
                                        onChange={e => setUserDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Role filter row */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label htmlFor="user-role-filter" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>User Role</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(['all', 'student', 'counselor', 'admin'] as const).map(r => (
                                        <button
                                            key={r}
                                            id={`role-filter-${r}`}
                                            onClick={() => setUserRole(r)}
                                            style={{
                                                flex: 1,
                                                padding: '6px 4px',
                                                borderRadius: 8,
                                                border: `1px solid ${userRole === r ? 'var(--ku-gold)' : 'var(--border)'}`,
                                                background: userRole === r ? 'rgba(155,126,73,0.2)' : 'transparent',
                                                color: userRole === r ? 'var(--ku-gold)' : 'var(--text-muted)',
                                                fontSize: '0.72rem',
                                                fontWeight: userRole === r ? 700 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                            <button
                                className="btn-primary"
                                onClick={() => fetchPreview('users')}
                                disabled={previewLoading && previewType === 'users'}
                                style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                            >
                                {previewLoading && previewType === 'users' ? '⏳ Loading...' : '👁 Preview'}
                            </button>
                            <button
                                onClick={generateUsersReport}
                                disabled={generatingUsers}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    border: '1px solid var(--ku-gold)',
                                    background: 'transparent',
                                    color: 'var(--ku-gold)',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    cursor: generatingUsers ? 'not-allowed' : 'pointer',
                                    opacity: generatingUsers ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                {generatingUsers ? '⏳ Generating...' : '⬇ Download PDF'}
                            </button>
                        </div>
                    </div>

                    {/* ── Appointments History card with inline filters ── */}
                    <div className="glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                            <div style={{ fontSize: '2rem' }}>📅</div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 2 }}>Appointments History</h2>
                                {/* Active filters badge */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        background: 'rgba(155,126,73,0.15)', border: '1px solid rgba(155,126,73,0.4)',
                                        borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', color: 'var(--ku-gold)'
                                    }}>
                                        📅 {apptDateRange.start} → {apptDateRange.end}
                                    </span>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        background: apptStatus === 'all' ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.15)',
                                        border: `1px solid ${apptStatus === 'all' ? 'var(--border)' : 'rgba(59,130,246,0.5)'}`,
                                        borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem',
                                        color: apptStatus === 'all' ? 'var(--text-muted)' : '#60a5fa'
                                    }}>
                                        ◉ {apptStatus === 'all' ? 'All Statuses' : apptStatus.charAt(0).toUpperCase() + apptStatus.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Export a filtered log of counseling appointments by session date and status.
                        </p>

                        {/* ── Filter Controls ── */}
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Filter Appointments By</p>

                            {/* Date range */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Appointment Date Range</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px' }}>
                                    <input
                                        id="appt-date-start"
                                        type="date"
                                        value={apptDateRange.start}
                                        onChange={e => setApptDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }}
                                    />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                                    <input
                                        id="appt-date-end"
                                        type="date"
                                        value={apptDateRange.end}
                                        onChange={e => setApptDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Status filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Appointment Status</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {([
                                        { value: 'all',       label: 'All',       color: 'var(--text-muted)',  bg: 'transparent',            border: 'var(--border)' },
                                        { value: 'pending',   label: 'Pending',   color: '#f59e0b',           bg: 'rgba(245,158,11,0.15)',   border: 'rgba(245,158,11,0.4)' },
                                        { value: 'confirmed', label: 'Confirmed', color: '#3b82f6',           bg: 'rgba(59,130,246,0.15)',   border: 'rgba(59,130,246,0.4)' },
                                        { value: 'completed', label: 'Completed', color: '#10b981',           bg: 'rgba(16,185,129,0.15)',   border: 'rgba(16,185,129,0.4)' },
                                        { value: 'cancelled', label: 'Cancelled', color: '#ef4444',           bg: 'rgba(239,68,68,0.15)',    border: 'rgba(239,68,68,0.4)' },
                                    ] as const).map(s => (
                                        <button
                                            key={s.value}
                                            id={`appt-status-filter-${s.value}`}
                                            onClick={() => setApptStatus(s.value)}
                                            style={{
                                                padding: '5px 12px',
                                                borderRadius: 20,
                                                border: `1px solid ${apptStatus === s.value ? s.border : 'var(--border)'}`,
                                                background: apptStatus === s.value ? s.bg : 'transparent',
                                                color: apptStatus === s.value ? s.color : 'var(--text-muted)',
                                                fontSize: '0.72rem',
                                                fontWeight: apptStatus === s.value ? 700 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                            <button
                                className="btn-primary"
                                onClick={() => fetchPreview('appointments')}
                                disabled={previewLoading && previewType === 'appointments'}
                                style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', background: 'linear-gradient(135deg, var(--ku-gold), #d97706)' }}
                            >
                                {previewLoading && previewType === 'appointments' ? '⏳ Loading...' : '👁 Preview'}
                            </button>
                            <button
                                onClick={generateAppointmentsReport}
                                disabled={generatingAppointments}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    border: '1px solid var(--ku-gold)',
                                    background: 'transparent',
                                    color: 'var(--ku-gold)',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    cursor: generatingAppointments ? 'not-allowed' : 'pointer',
                                    opacity: generatingAppointments ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                {generatingAppointments ? '⏳ Generating...' : '⬇ Download PDF'}
                            </button>
                        </div>
                    </div>

                    {/* ── System Audit Logs card with inline filters ── */}
                    <div className="glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                            <div style={{ fontSize: '2rem' }}>🛡️</div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 2 }}>System Audit Logs</h2>
                                {/* Active filter badges */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        background: 'rgba(155,126,73,0.15)', border: '1px solid rgba(155,126,73,0.4)',
                                        borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', color: 'var(--ku-gold)'
                                    }}>
                                        📅 {auditDateRange.start} → {auditDateRange.end}
                                    </span>
                                    {auditAction !== 'all' && (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
                                            borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', color: '#818cf8'
                                        }}>
                                            ⚡ {auditAction}
                                        </span>
                                    )}
                                    {auditResource !== 'all' && (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.4)',
                                            borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', color: '#2dd4bf'
                                        }}>
                                            🎯 {auditResource}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Download filtered security logs by date, action type, and resource for compliance monitoring.
                        </p>

                        {/* ── Filter Controls ── */}
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Filter Logs By</p>

                            {/* Date range */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Log Date Range</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px' }}>
                                    <input
                                        id="audit-date-start"
                                        type="date"
                                        value={auditDateRange.start}
                                        onChange={e => setAuditDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }}
                                    />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                                    <input
                                        id="audit-date-end"
                                        type="date"
                                        value={auditDateRange.end}
                                        onChange={e => setAuditDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Action type filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action Type</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {(['all', 'LOGIN', 'BOOK_APPOINTMENT', 'UPDATE_PROFILE', 'DELETE_USER'] as const).map(a => (
                                        <button
                                            key={a}
                                            id={`audit-action-${a}`}
                                            onClick={() => setAuditAction(a)}
                                            style={{
                                                padding: '5px 10px',
                                                borderRadius: 20,
                                                border: `1px solid ${auditAction === a ? 'rgba(99,102,241,0.6)' : 'var(--border)'}`,
                                                background: auditAction === a ? 'rgba(99,102,241,0.15)' : 'transparent',
                                                color: auditAction === a ? '#818cf8' : 'var(--text-muted)',
                                                fontSize: '0.68rem',
                                                fontWeight: auditAction === a ? 700 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.03em'
                                            }}
                                        >
                                            {a === 'all' ? 'All Actions' : a.replace(/_/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Resource type filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resource Type</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {(['all', 'USER', 'APPOINTMENT', 'PROFILE'] as const).map(r => (
                                        <button
                                            key={r}
                                            id={`audit-resource-${r}`}
                                            onClick={() => setAuditResource(r)}
                                            style={{
                                                flex: 1,
                                                padding: '5px 8px',
                                                borderRadius: 8,
                                                border: `1px solid ${auditResource === r ? 'rgba(20,184,166,0.6)' : 'var(--border)'}`,
                                                background: auditResource === r ? 'rgba(20,184,166,0.15)' : 'transparent',
                                                color: auditResource === r ? '#2dd4bf' : 'var(--text-muted)',
                                                fontSize: '0.68rem',
                                                fontWeight: auditResource === r ? 700 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {r === 'all' ? 'All' : r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                            <button
                                className="btn-primary"
                                onClick={() => fetchPreview('audit')}
                                disabled={previewLoading && previewType === 'audit'}
                                style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', background: 'linear-gradient(135deg, #475569, #1e293b)' }}
                            >
                                {previewLoading && previewType === 'audit' ? '⏳ Loading...' : '👁 Preview'}
                            </button>
                            <button
                                onClick={generateAuditLogsReport}
                                disabled={generatingAuditLogs}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    border: '1px solid #475569',
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    cursor: generatingAuditLogs ? 'not-allowed' : 'pointer',
                                    opacity: generatingAuditLogs ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                {generatingAuditLogs ? '⏳ Generating...' : '⬇ Download PDF'}
                            </button>
                        </div>
                    </div>

                    {/* ── Clinical Progress card with inline filters ── */}
                    <div className="glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                            <div style={{ fontSize: '2rem' }}>🩹</div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 2 }}>Clinical Progress</h2>
                                {/* Active filter badge */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        background: 'rgba(155,126,73,0.15)', border: '1px solid rgba(155,126,73,0.4)',
                                        borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', color: 'var(--ku-gold)'
                                    }}>
                                        📅 {clinicalDateRange.start} → {clinicalDateRange.end}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Export longitudinal clinical progress indicators and summaries for population health analysis.
                        </p>

                        {/* ── Filter Controls ── */}
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Filter Progress By</p>

                            {/* Date range */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progress Date Range</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 10px' }}>
                                    <input
                                        id="clinical-date-start"
                                        type="date"
                                        value={clinicalDateRange.start}
                                        onChange={e => setClinicalDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }}
                                    />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                                    <input
                                        id="clinical-date-end"
                                        type="date"
                                        value={clinicalDateRange.end}
                                        onChange={e => setClinicalDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', flex: 1 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                            <button
                                className="btn-primary"
                                onClick={() => fetchPreview('clinical')}
                                disabled={previewLoading && previewType === 'clinical'}
                                style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
                            >
                                {previewLoading && previewType === 'clinical' ? '⏳ Loading...' : '👁 Preview'}
                            </button>
                            <button
                                onClick={generateClinicalReport}
                                disabled={generatingClinical}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    border: '1px solid #ec4899',
                                    background: 'transparent',
                                    color: '#f472b6',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    cursor: generatingClinical ? 'not-allowed' : 'pointer',
                                    opacity: generatingClinical ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                {generatingClinical ? '⏳ Generating...' : '⬇ Download PDF'}
                            </button>
                        </div>
                    </div>
                </div>

                {renderPreviewTable()}
            </main>
        </div>
    );
}

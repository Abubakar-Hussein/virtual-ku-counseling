'use client';
import React from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';

const REPORT_CARDS = [
    {
        href: '/admin/reports/user-demographics',
        icon: '👥',
        title: 'Users Demographics',
        description: 'Export a filtered list of platform users by registration date and role.',
        gradient: 'linear-gradient(135deg, rgba(155,126,73,0.2), rgba(155,126,73,0.05))',
        border: 'rgba(155,126,73,0.35)',
        accentColor: '#c9a84c',
    },
    {
        href: '/admin/reports/appointments-history',
        icon: '📅',
        title: 'Appointments History',
        description: 'Export a filtered log of counseling appointments by session date and status.',
        gradient: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
        border: 'rgba(245,158,11,0.35)',
        accentColor: '#f59e0b',
    },
    {
        href: '/admin/reports/audit-logs',
        icon: '🛡️',
        title: 'System Audit Logs',
        description: 'Download filtered security logs by date, action type, and resource for compliance.',
        gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))',
        border: 'rgba(99,102,241,0.35)',
        accentColor: '#818cf8',
    },
    {
        href: '/admin/reports/clinical-progress',
        icon: '🩹',
        title: 'Clinical Progress',
        description: 'Export longitudinal clinical progress indicators and summaries for population health analysis.',
        gradient: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))',
        border: 'rgba(236,72,153,0.35)',
        accentColor: '#ec4899',
    },
];

export default function ReportsPage() {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>System Reports</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Select a report type to filter, preview, and print.</p>
                    </div>
                    <NotificationBell />
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
                    {REPORT_CARDS.map((card) => (
                        <Link key={card.href} href={card.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div
                                className="glass"
                                style={{
                                    padding: 32, display: 'flex', flexDirection: 'column', gap: 16,
                                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    border: `1px solid ${card.border}`, background: card.gradient,
                                    position: 'relative', overflow: 'hidden',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'; e.currentTarget.style.boxShadow = `0 12px 40px ${card.border}`; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${card.border}, transparent 70%)`, opacity: 0.4, pointerEvents: 'none' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ fontSize: '2.2rem', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: `1px solid ${card.border}`, flexShrink: 0 }}>
                                        {card.icon}
                                    </div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{card.title}</h2>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{card.description}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 8, fontSize: '0.85rem', fontWeight: 600, color: card.accentColor }}>
                                    View Report <span>→</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}

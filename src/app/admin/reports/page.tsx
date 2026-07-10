'use client';
import React from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Users, Calendar, Shield, Activity, ArrowRight, FileText } from 'lucide-react';

const REPORT_CARDS = [
    {
        href: '/admin/reports/user-demographics',
        icon: <Users size={22} strokeWidth={1.8} />,
        title: 'Users Demographics',
        description: 'Export a filtered list of platform users by registration date and role.',
        stat: '4 filters available',
    },
    {
        href: '/admin/reports/appointments-history',
        icon: <Calendar size={22} strokeWidth={1.8} />,
        title: 'Appointments History',
        description: 'Export a filtered log of counseling appointments by session date and status.',
        stat: 'Date & status filters',
    },
    {
        href: '/admin/reports/audit-logs',
        icon: <Shield size={22} strokeWidth={1.8} />,
        title: 'System Audit Logs',
        description: 'Download filtered security logs by date, action type, and resource for compliance.',
        stat: 'Compliance-ready',
    },
    {
        href: '/admin/reports/clinical-progress',
        icon: <Activity size={22} strokeWidth={1.8} />,
        title: 'Clinical Progress',
        description: 'Export longitudinal clinical progress indicators and summaries for population health analysis.',
        stat: 'Population analytics',
    },
];

export default function ReportsPage() {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(50,83,67,0.07)',
                            border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 20, padding: '4px 12px',
                            fontSize: '0.72rem', fontWeight: 700,
                            color: 'var(--ku-green)',
                            letterSpacing: '0.07em', textTransform: 'uppercase',
                            marginBottom: 12,
                        }}>
                            <FileText size={12} strokeWidth={2.5} />
                            Admin Reports
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            System Reports
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Select a report type to filter, preview, and export data.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Report Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {REPORT_CARDS.map((card, i) => (
                        <Link key={card.href} href={card.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 20,
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderLeft: '3px solid var(--ku-green)',
                                    borderRadius: 14,
                                    padding: '24px 28px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(50,83,67,0.09)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(50,83,67,0.3)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'none';
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                                }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: 52, height: 52, borderRadius: 13, flexShrink: 0,
                                    background: 'rgba(50,83,67,0.07)',
                                    border: '1px solid rgba(50,83,67,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--ku-green)',
                                }}>
                                    {card.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                            {card.title}
                                        </h2>
                                        <span style={{
                                            background: 'rgba(50,83,67,0.06)',
                                            border: '1px solid rgba(50,83,67,0.12)',
                                            color: 'var(--ku-green)',
                                            borderRadius: 20, padding: '1px 10px',
                                            fontSize: '0.7rem', fontWeight: 600,
                                        }}>
                                            {card.stat}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.55, margin: 0 }}>
                                        {card.description}
                                    </p>
                                </div>

                                {/* CTA */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    color: 'var(--ku-green)', fontSize: '0.85rem', fontWeight: 600,
                                    flexShrink: 0, whiteSpace: 'nowrap',
                                }}>
                                    View Report
                                    <ArrowRight size={15} strokeWidth={2.2} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Info strip */}
                <div style={{
                    marginTop: 40,
                    background: 'rgba(50,83,67,0.04)',
                    border: '1px solid rgba(50,83,67,0.1)',
                    borderRadius: 12,
                    padding: '16px 24px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    color: 'var(--text-secondary)', fontSize: '0.85rem',
                }}>
                    <Shield size={16} strokeWidth={1.8} style={{ color: 'var(--ku-green)', flexShrink: 0 }} />
                    All reports are exported as CSV files and are subject to the KU Wellness data protection and privacy policy.
                </div>
            </main>
        </div>
    );
}

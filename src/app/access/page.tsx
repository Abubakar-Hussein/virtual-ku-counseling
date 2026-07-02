'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Check, GraduationCap, UserCheck, Shield, ArrowRight } from 'lucide-react';

const roles = [
    {
        key: 'student',
        title: 'Student Access',
        subtitle: 'Book sessions & manage your appointments',
        icon: <GraduationCap size={30} strokeWidth={1.5} style={{ color: 'var(--ku-green)' }} />,
        features: [
            'AI-powered booking assistant',
            'Book counseling sessions',
            'Manage your schedule',
            'Join video sessions',
        ],
        href: '/login?role=student',
        btnLabel: 'Continue as Student',
    },
    {
        key: 'counselor',
        title: 'Counselor Portal',
        subtitle: 'Manage clients & clinical records',
        icon: <UserCheck size={30} strokeWidth={1.5} style={{ color: 'var(--ku-green)' }} />,
        features: [
            'View upcoming sessions',
            'Manage client information',
            'Join video sessions',
            'Session notes & records',
        ],
        href: '/login?role=counselor',
        btnLabel: 'Continue as Counselor',
    },
    {
        key: 'admin',
        title: 'Admin Dashboard',
        subtitle: 'System oversight & analytics',
        icon: <Shield size={30} strokeWidth={1.5} style={{ color: 'var(--ku-green)' }} />,
        features: [
            'Meeting room management',
            'User & counselor management',
            'System analytics',
            'Quality assurance',
        ],
        href: '/login?role=admin',
        btnLabel: 'Continue as Admin',
    },
];

export default function AccessDashboardPage() {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <main style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>

            {/* ─── Left Panel: Background image */}
            <div className="access-left-panel" style={{
                flex: '1.1',
                position: 'relative',
                display: 'none',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url(/wellness-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(160deg, rgba(30,60,45,0.7) 0%, rgba(10,25,20,0.55) 100%)',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '10%',
                }}>
                    <img src="/logo.jpg" alt="KU Logo" style={{ width: 52, height: 52, borderRadius: 14, marginBottom: 32, objectFit: 'contain' }} />
                    <h2 style={{
                        fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                        fontWeight: 800, color: '#fff',
                        lineHeight: 1.15, marginBottom: 16,
                        letterSpacing: '-0.02em',
                    }}>
                        Mental health is a priority. Your well-being matters.
                    </h2>
                    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, maxWidth: 380 }}>
                        Join the KU Wellness System — a safe, confidential space for Kenyatta University students.
                    </p>
                    <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {['Confidential', 'Secure', 'Student-Focused'].map(tag => (
                            <span key={tag} style={{
                                background: 'rgba(255,255,255,0.12)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                padding: '6px 14px',
                                borderRadius: 20,
                                fontSize: '0.8rem',
                                fontWeight: 600,
                            }}>{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Right Panel: Role cards */}
            <div style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-main)',
                padding: 'clamp(24px, 6vw, 72px)',
                minHeight: '100vh',
                position: 'relative',
            }}>
                {/* Top nav */}
                <div style={{
                    position: 'absolute', top: 28, right: 28,
                    display: 'flex', gap: 12, alignItems: 'center',
                }}>
                    <Link href="/" style={{
                        color: 'var(--text-muted)', fontSize: '0.875rem',
                        textDecoration: 'none', fontWeight: 500,
                    }}>
                        Home
                    </Link>
                    <Link href="/register" style={{
                        background: 'var(--ku-green)', color: '#fff',
                        padding: '8px 18px', borderRadius: 8,
                        fontSize: '0.875rem', fontWeight: 600,
                        textDecoration: 'none',
                    }}>
                        Register
                    </Link>
                </div>

                <div style={{ width: '100%', maxWidth: 460 }}>
                    {/* Logo + heading (mobile only) */}
                    <img src="/logo.jpg" alt="KU Logo" className="access-mobile-logo" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 20, display: 'none', objectFit: 'contain' }} />

                    <div style={{ marginBottom: 36 }}>
                        <h1 style={{
                            fontSize: '2rem', fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginBottom: 8, letterSpacing: '-0.02em',
                        }}>
                            Welcome back
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Select your role to sign in to the KU Wellness System.
                        </p>
                    </div>

                    {/* Role selection cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {roles.map((role) => (
                            <Link
                                href={role.href}
                                key={role.key}
                                onMouseEnter={() => setHovered(role.key)}
                                onMouseLeave={() => setHovered(null)}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '20px 22px',
                                    background: hovered === role.key ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                                    border: `1px solid ${hovered === role.key ? 'rgba(50,83,67,0.3)' : 'var(--border)'}`,
                                    borderRadius: 14,
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    transform: hovered === role.key ? 'translateX(4px)' : 'none',
                                    boxShadow: hovered === role.key ? '0 8px 24px rgba(50,83,67,0.08)' : 'none',
                                    gap: 16,
                                }}
                            >
                                <div style={{
                                    width: 52, height: 52, borderRadius: 12,
                                    background: 'rgba(50,83,67,0.06)',
                                    border: '1px solid rgba(50,83,67,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {role.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                                        {role.title}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        {role.subtitle}
                                    </div>
                                </div>
                                <ArrowRight
                                    size={18} strokeWidth={2}
                                    style={{
                                        color: hovered === role.key ? 'var(--ku-green)' : 'var(--border)',
                                        transition: 'color 0.2s',
                                        flexShrink: 0,
                                    }}
                                />
                            </Link>
                        ))}
                    </div>

                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 40 }}>
                        © {new Date().getFullYear()} Kenyatta University — KU Wellness System &nbsp;·&nbsp; All sessions are 100% confidential
                    </p>
                </div>
            </div>

            <style>{`
                @media (min-width: 860px) {
                    .access-left-panel { display: block !important; }
                }
                @media (max-width: 859px) {
                    .access-mobile-logo { display: block !important; }
                }
            `}</style>
        </main>
    );
}

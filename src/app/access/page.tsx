'use client';
import Link from 'next/link';
import { useState } from 'react';

const roles = [
  {
    key: 'student',
    title: 'Student Dashboard',
    subtitle: 'Book sessions and manage your appointments',
    subtitleColor: '#60a5fa',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="16" r="8" stroke="#60a5fa" strokeWidth="2.5" fill="none"/>
        <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="36" cy="28" r="5" stroke="#60a5fa" strokeWidth="2" fill="none"/>
        <path d="M36 24v4l2 2" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    iconBg: 'rgba(96, 165, 250, 0.1)',
    iconBorder: 'rgba(96, 165, 250, 0.25)',
    features: [
      { icon: '✦', text: 'AI-powered booking assistant' },
      { icon: '📅', text: 'Book counseling sessions' },
      { icon: '🕐', text: 'Manage your schedule' },
      { icon: '🎥', text: 'Join video sessions' },
    ],
    href: '/login?role=student',
    btnLabel: 'Login as Student',
    btnColor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    btnShadow: 'rgba(59, 130, 246, 0.4)',
    hoverBorder: 'rgba(96, 165, 250, 0.4)',
  },
  {
    key: 'counselor',
    title: 'Counselor Dashboard',
    subtitle: 'Manage sessions and client appointments',
    subtitleColor: '#4ade80',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="19" cy="16" r="7" stroke="#4ade80" strokeWidth="2.5" fill="none"/>
        <path d="M6 38c0-7.732 5.82-14 13-14" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="32" cy="30" r="8" stroke="#4ade80" strokeWidth="2.5" fill="none"/>
        <path d="M29 30l2 2 4-4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    iconBg: 'rgba(74, 222, 128, 0.1)',
    iconBorder: 'rgba(74, 222, 128, 0.25)',
    features: [
      { icon: '📋', text: 'View upcoming sessions' },
      { icon: '👤', text: 'Manage client information' },
      { icon: '🎥', text: 'Join video sessions' },
      { icon: '📝', text: 'Session notes & records' },
    ],
    href: '/login?role=counselor',
    btnLabel: 'Login as Counselor',
    btnColor: 'linear-gradient(135deg, #22c55e, #16a34a)',
    btnShadow: 'rgba(34, 197, 94, 0.4)',
    hoverBorder: 'rgba(74, 222, 128, 0.4)',
  },
  {
    key: 'admin',
    title: 'Admin Dashboard',
    subtitle: 'System management and oversight',
    subtitleColor: '#f87171',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 6L28 16H40L30 22L34 34L24 28L14 34L18 22L8 16H20L24 6Z" stroke="#f87171" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    iconBg: 'rgba(248, 113, 113, 0.1)',
    iconBorder: 'rgba(248, 113, 113, 0.25)',
    features: [
      { icon: '🏢', text: 'Meeting room management' },
      { icon: '👥', text: 'User and counselor management' },
      { icon: '📊', text: 'System analytics' },
      { icon: '✅', text: 'Quality assurance' },
    ],
    href: '/login?role=admin',
    btnLabel: 'Login as Admin',
    btnColor: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    btnShadow: 'rgba(239, 68, 68, 0.4)',
    hoverBorder: 'rgba(248, 113, 113, 0.4)',
  },
];

export default function AccessDashboardPage() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
    }}>
      {/* Background decorative blobs */}
      <div style={{
        position: 'fixed', top: '-15%', left: '-10%',
        width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(0,102,51,0.08) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', right: '-10%',
        width: '55vw', height: '55vw',
        background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', top: '40%', left: '40%',
        width: '30vw', height: '30vw',
        background: 'radial-gradient(circle, rgba(255,204,0,0.04) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5vw', height: 72,
        borderBottom: '1px solid var(--border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(0,102,51,0.35)',
          }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Virtual Counseling Booking and Scheduling System</span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login?role=student" style={{
            color: 'var(--text-secondary)', textDecoration: 'none',
            fontWeight: 500, fontSize: '0.9rem',
            padding: '8px 18px', borderRadius: 8,
            border: '1px solid var(--border)',
            transition: 'all 0.2s ease',
          }}>
            Sign In
          </Link>
          <Link href="/register" className="btn-primary" style={{ fontSize: '0.875rem', padding: '9px 22px', textDecoration: 'none' }}>
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Header */}
      <section style={{
        textAlign: 'center',
        padding: '72px 5vw 48px',
        position: 'relative', zIndex: 1,
      }}>
        <div className="fade-up" style={{ animationDelay: '0.05s' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,204,0,0.08)',
            color: 'var(--ku-gold)',
            border: '1px solid rgba(255,204,0,0.2)',
            borderRadius: 20, padding: '5px 16px',
            fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            Role-Based Access
          </span>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800, lineHeight: 1.15,
            marginBottom: 16, letterSpacing: '-0.02em',
          }}>
            Access Your <span className="gradient-text">Dashboard</span>
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem', maxWidth: 520, margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Choose your role to access the appropriate dashboard and features
          </p>
        </div>
      </section>

      {/* Cards Grid */}
      <section style={{
        padding: '0 5vw 80px',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 28,
          width: '100%',
          maxWidth: 1080,
        }}>
          {roles.map((role, i) => (
            <div
              key={role.key}
              onMouseEnter={() => setHovered(role.key)}
              onMouseLeave={() => setHovered(null)}
              className="fade-up"
              style={{
                animationDelay: `${0.1 + i * 0.08}s`,
                background: hovered === role.key
                  ? 'var(--bg-card-hover)'
                  : 'var(--bg-card)',
                border: `1px solid ${hovered === role.key ? role.hoverBorder : 'var(--border)'}`,
                borderRadius: 20,
                padding: '36px 32px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                backdropFilter: 'blur(20px)',
                transition: 'all 0.3s ease',
                transform: hovered === role.key ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hovered === role.key
                  ? `0 24px 60px rgba(0,0,0,0.15), 0 0 0 1px ${role.hoverBorder}`
                  : '0 8px 32px rgba(0,0,0,0.08)',
                cursor: 'default',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 76, height: 76,
                borderRadius: '50%',
                background: role.iconBg,
                border: `1.5px solid ${role.iconBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
                transition: 'all 0.3s ease',
              }}>
                {role.icon}
              </div>

              {/* Title & Subtitle */}
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 8,
                letterSpacing: '-0.01em',
              }}>
                {role.title}
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: role.subtitleColor,
                fontWeight: 500,
                marginBottom: 28,
              }}>
                {role.subtitle}
              </p>

              {/* Divider */}
              <div style={{
                height: 1,
                background: 'var(--border)',
                marginBottom: 24,
              }} />

              {/* Feature list */}
              <ul style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 32,
                flex: 1,
              }}>
                {role.features.map((feat, fi) => (
                  <li key={fi} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: 'var(--text-secondary)',
                    fontSize: '0.88rem',
                    fontWeight: 400,
                  }}>
                    <span style={{
                      flexShrink: 0,
                      width: 20, height: 20,
                      borderRadius: '50%',
                      background: role.iconBg,
                      border: `1px solid ${role.iconBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem',
                    }}>{feat.icon}</span>
                    {feat.text}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={role.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: role.btnColor,
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '14px 28px',
                  borderRadius: 12,
                  transition: 'all 0.25s ease',
                  boxShadow: hovered === role.key
                    ? `0 8px 28px ${role.btnShadow}`
                    : '0 4px 12px rgba(0,0,0,0.2)',
                  letterSpacing: '0.01em',
                }}
              >
                {role.btnLabel}
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <div style={{
        textAlign: 'center',
        paddingBottom: 40,
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        position: 'relative', zIndex: 1,
      }}>
        <span>All sessions are 100% confidential · </span>
        <span>© {new Date().getFullYear()} Kenyatta University</span>
      </div>
    </main>
  );
}

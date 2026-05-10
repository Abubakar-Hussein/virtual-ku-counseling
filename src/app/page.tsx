'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';

const dashboardRoles = [
  {
    key: 'student',
    title: 'Student Dashboard',
    subtitle: 'Book sessions and manage your appointments',
    subtitleColor: '#60a5fa',
    iconBg: 'rgba(96, 165, 250, 0.1)',
    iconBorder: 'rgba(96, 165, 250, 0.25)',
    hoverBorder: 'rgba(96, 165, 250, 0.45)',
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="16" r="8" stroke="#60a5fa" strokeWidth="2.5" fill="none"/>
        <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    features: [
      { icon: '✦', text: 'AI-powered booking assistant' },
      { icon: '📅', text: 'Book counseling sessions' },
      { icon: '🕐', text: 'Manage your schedule' },
      { icon: '🎥', text: 'Join video sessions' },
    ],
    href: '/login?role=student',
    btnLabel: 'Login as Student',
    btnGradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    btnShadow: 'rgba(59, 130, 246, 0.45)',
  },
  {
    key: 'counselor',
    title: 'Counselor Dashboard',
    subtitle: 'Manage sessions and client appointments',
    subtitleColor: '#4ade80',
    iconBg: 'rgba(74, 222, 128, 0.1)',
    iconBorder: 'rgba(74, 222, 128, 0.25)',
    hoverBorder: 'rgba(74, 222, 128, 0.45)',
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <circle cx="19" cy="16" r="7" stroke="#4ade80" strokeWidth="2.5" fill="none"/>
        <path d="M6 38c0-7.732 5.82-14 13-14" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="33" cy="31" r="8" stroke="#4ade80" strokeWidth="2.5" fill="none"/>
        <path d="M30 31l2 2 4-4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    features: [
      { icon: '📋', text: 'View upcoming sessions' },
      { icon: '👤', text: 'Manage client information' },
      { icon: '🎥', text: 'Join video sessions' },
      { icon: '📝', text: 'Session notes & records' },
    ],
    href: '/login?role=counselor',
    btnLabel: 'Login as Counselor',
    btnGradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    btnShadow: 'rgba(34, 197, 94, 0.45)',
  },
  {
    key: 'admin',
    title: 'Admin Dashboard',
    subtitle: 'System management and oversight',
    subtitleColor: '#f87171',
    iconBg: 'rgba(248, 113, 113, 0.1)',
    iconBorder: 'rgba(248, 113, 113, 0.25)',
    hoverBorder: 'rgba(248, 113, 113, 0.45)',
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <path d="M24 4l5 12h13l-10.5 7.5 4 12.5L24 29l-11.5 7 4-12.5L6 16h13z" stroke="#f87171" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    features: [
      { icon: '🏢', text: 'Meeting room management' },
      { icon: '👥', text: 'User and counselor management' },
      { icon: '📊', text: 'System analytics' },
      { icon: '✅', text: 'Quality assurance' },
    ],
    href: '/login?role=admin',
    btnLabel: 'Login as Admin',
    btnGradient: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    btnShadow: 'rgba(239, 68, 68, 0.45)',
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-main)', overflowX: 'hidden', color: 'var(--text-primary)' }}>
      {/* Background Decorative Blobs */}
      <div style={{
        position: 'fixed', top: '-10%', left: '-5%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(0, 102, 51, 0.15) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none', filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(255, 204, 0, 0.08) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none', filter: 'blur(80px)'
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5vw', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0, 102, 51, 0.3)',
          }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>KU Wellness System</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <ThemeToggle />
          {session ? (
            <Link href={`/${(session.user as any).role}/dashboard`} className="btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login?role=student" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '160px 5vw 100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div className="fade-up" style={{ animationDelay: '0.1s' }}>
          <span style={{
            background: 'rgba(0, 102, 51, 0.1)',
            color: 'var(--ku-green-light)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            border: '1px solid rgba(0, 102, 51, 0.2)',
            marginBottom: 24,
            display: 'inline-block'
          }}>
            Dedicated to Kenyatta University Students
          </span>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 24,
            letterSpacing: '-0.02em',
          }}>
            Support for Your <br />
            <span className="gradient-text">Academic &amp; Mental</span> Wellbeing
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.2rem',
            maxWidth: 600,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            Book confidential counseling sessions with professional university counselors. We offer support for academic, career, and personal challenges.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/login?role=student" className="btn-gold" style={{ padding: '16px 40px', fontSize: '1rem', textDecoration: 'none' }}>
              Book a Session
            </Link>
            <Link href="#features" className="btn-secondary" style={{ padding: '16px 40px', fontSize: '1rem', textDecoration: 'none' }}>
              Learn More
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="fade-up" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 32, width: '100%', maxWidth: 1000, marginTop: 100,
          animationDelay: '0.3s'
        }}>
          {[
            { label: 'Licensed Counselors', value: '25+' },
            { label: 'Students Supported', value: '10k+' },
            { label: 'Confidentiality', value: '100%' },
            { label: 'Response Time', value: '< 24h' }
          ].map((stat, i) => (
            <div key={i} className="glass" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ku-gold)', marginBottom: 8 }}>{stat.value}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '100px 5vw', position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16 }}>Why Choose Wellness System?</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}>Designed to ensure every student has access to the support they need to succeed.</p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 32, maxWidth: 1200, margin: '0 auto'
        }}>
          {[
            { title: 'Academic Support', icon: '📚', desc: 'Overcome study-related stress, exam anxiety, and time management hurdles.' },
            { title: 'Mental Wellbeing', icon: '🧠', desc: 'Confidential mental health support for personal issues, stress, and anxiety.' },
            { title: 'Career Guidance', icon: '🚀', desc: 'Plan your future path with professional career mapping and advice.' },
            { title: 'Quick Booking', icon: '⚡', desc: 'View real-time counselor availability and book slots in seconds.' },
            { title: 'Reminders', icon: '🔔', desc: 'Never miss a session with automatic in-app and email notifications.' },
            { title: 'Secure Notes', icon: '🔒', desc: 'Private, encrypted session history accessible only to your counselor.' }
          ].map((feat, i) => (
            <div key={i} className="glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: '2.5rem' }}>{feat.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{feat.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Access Your Dashboard Section ── */}
      <section
        id="dashboard-access"
        style={{
          padding: '100px 5vw 110px',
          position: 'relative', zIndex: 1,
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Subtle accent blob behind this section */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%',
          transform: 'translateX(-50%)',
          width: '60vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 64, position: 'relative' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,204,0,0.08)',
            color: 'var(--ku-gold)',
            border: '1px solid rgba(255,204,0,0.2)',
            borderRadius: 20, padding: '5px 16px',
            fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Role-Based Access
          </span>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.75rem)',
            fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em',
          }}>
            Access Your <span className="gradient-text">Dashboard</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
            Choose your role to access the appropriate dashboard and features
          </p>
        </div>

        {/* Role cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 28,
          maxWidth: 1080,
          margin: '0 auto',
        }}>
          {dashboardRoles.map((role, i) => (
            <div
              key={role.key}
              onMouseEnter={() => setHoveredRole(role.key)}
              onMouseLeave={() => setHoveredRole(null)}
              style={{
                background: hoveredRole === role.key ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: `1px solid ${hoveredRole === role.key ? role.hoverBorder : 'var(--border)'}`,
                borderRadius: 20,
                padding: '36px 30px 30px',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.3s ease',
                transform: hoveredRole === role.key ? 'translateY(-8px)' : 'translateY(0)',
                boxShadow: hoveredRole === role.key
                  ? `0 28px 60px rgba(0,0,0,0.15), 0 0 0 1px ${role.hoverBorder}`
                  : '0 4px 24px rgba(0,0,0,0.05)',
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: role.iconBg,
                border: `1.5px solid ${role.iconBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 22,
                transition: 'transform 0.3s ease',
                transform: hoveredRole === role.key ? 'scale(1.08)' : 'scale(1)',
              }}>
                {role.icon}
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>
                {role.title}
              </h3>

              {/* Subtitle */}
              <p style={{ fontSize: '0.875rem', color: role.subtitleColor, fontWeight: 500, marginBottom: 24 }}>
                {role.subtitle}
              </p>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

              {/* Feature list */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 28, flex: 1 }}>
                {role.features.map((feat, fi) => (
                  <li key={fi} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--text-secondary)', fontSize: '0.875rem',
                  }}>
                    <span style={{
                      flexShrink: 0, width: 22, height: 22,
                      borderRadius: '50%',
                      background: role.iconBg,
                      border: `1px solid ${role.iconBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem',
                    }}>{feat.icon}</span>
                    {feat.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={role.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: role.btnGradient,
                  color: '#fff', textDecoration: 'none',
                  fontWeight: 700, fontSize: '0.95rem',
                  padding: '13px 24px', borderRadius: 12,
                  transition: 'all 0.25s ease',
                  boxShadow: hoveredRole === role.key
                    ? `0 8px 28px ${role.btnShadow}`
                    : '0 3px 10px rgba(0,0,0,0.25)',
                  letterSpacing: '0.01em',
                }}
              >
                {role.btnLabel}
                <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 5vw', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', margin: '0 auto 24px',
        }}>🌱</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>© {new Date().getFullYear()} Kenyatta University — Wellness System Hub</p>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Link href="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Privacy Policy</Link>
          <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Contact Support</Link>
        </div>
      </footer>
    </main>
  );
}

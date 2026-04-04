'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-dark)', overflowX: 'hidden' }}>
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
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>KU Counseling</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {session ? (
            <Link href={`/${(session.user as any).role}/dashboard`} className="btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
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
            <span className="gradient-text">Academic & Mental</span> Wellbeing
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
            <Link href="/register" className="btn-gold" style={{ padding: '16px 40px', fontSize: '1rem', textDecoration: 'none' }}>
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
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16 }}>Why Choose KU Counseling?</h2>
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

      {/* Footer */}
      <footer style={{ padding: '60px 5vw', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', margin: '0 auto 24px',
        }}>🎓</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>© {new Date().getFullYear()} Kenyatta University — Student Well-being Center</p>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <span>Privacy Policy</span>
          <span>Contact Support</span>
          <span>KU Main Site</span>
        </div>
      </footer>
    </main>
  );
}

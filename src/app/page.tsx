'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Logo from '@/components/Logo';
import { ArrowRight, BookOpen, Heart, Briefcase, Calendar, Bell, Lock } from 'lucide-react';



export default function LandingPage() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-main)', overflowX: 'hidden', color: 'var(--text-primary)' }}>


      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5vw',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={40} />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>KU Wellness System</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/privacy-policy" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1rem', fontWeight: 700 }}>Privacy Policy</Link>
          <Link href="/contact" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1rem', fontWeight: 700 }}>Contact Support</Link>
          <ThemeToggle />
          {session ? (
            <Link href={`/${(session.user as any).role}/dashboard`} className="btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/access" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
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
        padding: '160px 5vw 140px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        background: 'var(--ku-green)',
        color: '#FFFFFF'
      }}>
        <div className="fade-up" style={{ animationDelay: '0.1s' }}>
          <span style={{
            color: 'var(--ku-green-light)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
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
            <span style={{ color: 'var(--ku-green-light)' }}>Academic &amp; Mental</span> Wellbeing
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '1.2rem',
            maxWidth: 600,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            Book confidential counseling sessions with professional university counselors. We offer support for academic, career, and personal challenges.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/access" className="btn-gold" style={{ padding: '16px 40px', fontSize: '1rem', textDecoration: 'none' }}>
              Book a Session
            </Link>
            <Link href="#features" className="btn-secondary" style={{ padding: '16px 40px', fontSize: '1rem', textDecoration: 'none', borderColor: 'var(--ku-green-light)', color: 'var(--ku-green-light)' }}>
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
            <div key={i} className="glass" style={{ padding: 24, textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ku-green-light)', marginBottom: 8 }}>{stat.value}</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Wave Divider */}
        <div style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0 }}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '80px' }}>
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C50.68,18.3,109.84,33.15,168.4,45.4,220.15,56.23,272.76,65.34,321.39,56.44Z" fill="var(--bg-main)"></path>
          </svg>
        </div>
      </section>


      {/* ── Why Choose Section ── */}
      <section id="features" style={{ padding: '100px 5vw', background: 'var(--bg-main)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Section heading */}
          <div style={{ marginBottom: 72 }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(50,83,67,0.08)',
              color: 'var(--ku-green)',
              border: '1px solid rgba(50,83,67,0.15)',
              borderRadius: 20, padding: '5px 16px',
              fontSize: '0.78rem', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 20,
            }}>
              Built for Students
            </span>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800, letterSpacing: '-0.02em',
              color: 'var(--text-primary)', marginBottom: 16,
              lineHeight: 1.15,
            }}>
              Why choose the<br />
              <span style={{ color: 'var(--ku-green)' }}>KU Wellness System?</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 520, lineHeight: 1.7 }}>
              Designed to ensure every Kenyatta University student has access to the support they need to succeed academically and personally.
            </p>
          </div>

          {/* Feature rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                icon: <BookOpen size={24} strokeWidth={1.8} style={{ color: 'var(--ku-green)' }} />,
                title: 'Academic Support',
                desc: 'Overcome study-related stress, exam anxiety, and time management hurdles with expert academic counseling.',
                tag: 'Top Feature',
              },
              {
                icon: <Heart size={24} strokeWidth={1.8} style={{ color: 'var(--ku-green)' }} />,
                title: 'Mental Wellbeing',
                desc: 'Confidential mental health support for personal issues, stress, and anxiety in a safe, judgment-free space.',
                tag: 'Most Used',
              },
              {
                icon: <Briefcase size={24} strokeWidth={1.8} style={{ color: 'var(--ku-green)' }} />,
                title: 'Career Guidance',
                desc: 'Plan your future path with professional career mapping, CV advice, and industry counseling.',
              },
              {
                icon: <Calendar size={24} strokeWidth={1.8} style={{ color: 'var(--ku-green)' }} />,
                title: 'Quick Booking',
                desc: 'View real-time counselor availability and book a session in seconds — no emails, no queues.',
              },
              {
                icon: <Bell size={24} strokeWidth={1.8} style={{ color: 'var(--ku-green)' }} />,
                title: 'Smart Reminders',
                desc: 'Never miss a session with automatic in-app and email notifications tailored to your schedule.',
              },
              {
                icon: <Lock size={24} strokeWidth={1.8} style={{ color: 'var(--ku-green)' }} />,
                title: 'Secure & Private',
                desc: 'Private, encrypted session history accessible only to you and your counselor. Your privacy is our promise.',
              },
            ].map((feat, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 24,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: '3px solid var(--ku-green)',
                borderRadius: 16,
                padding: '28px 32px',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(50,83,67,0.08)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(50,83,67,0.06)',
                  border: '1px solid rgba(50,83,67,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {feat.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {feat.title}
                    </h3>
                    {feat.tag && (
                      <span style={{
                        background: 'rgba(50,83,67,0.08)',
                        color: 'var(--ku-green)',
                        border: '1px solid rgba(50,83,67,0.15)',
                        borderRadius: 20, padding: '2px 10px',
                        fontSize: '0.7rem', fontWeight: 700,
                      }}>
                        {feat.tag}
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
                    {feat.desc}
                  </p>
                </div>
                <ArrowRight size={18} strokeWidth={1.8} style={{ color: 'var(--border)', flexShrink: 0, marginTop: 4 }} />
              </div>
            ))}
          </div>

          {/* CTA strip */}
          <div style={{
            marginTop: 64,
            background: 'var(--ku-green)',
            borderRadius: 20,
            padding: '48px 5%',
            display: 'flex', flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'space-between',
            gap: 24,
          }}>
            <div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em' }}>
                Ready to get started?
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '1rem', margin: 0 }}>
                Join thousands of KU students already using the platform.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/access" style={{
                background: '#fff', color: 'var(--ku-green)',
                padding: '14px 32px', borderRadius: 10,
                fontWeight: 700, fontSize: '0.95rem',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                Book a Session <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link href="/register" style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                padding: '14px 28px', borderRadius: 10,
                fontWeight: 600, fontSize: '0.95rem',
                textDecoration: 'none',
              }}>
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer style={{ padding: '60px 5vw', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Logo size={48} style={{ margin: '0 auto 24px' }} />
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>© {new Date().getFullYear()} Kenyatta University — KU Wellness System Hub</p>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', color: 'var(--text-muted)' }}>
          <Link href="/privacy-policy" style={{ color: 'var(--text-primary)', textDecoration: 'none', transition: 'color 0.2s', fontSize: '1rem', fontWeight: 700 }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ku-green)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}>Privacy Policy</Link>
          <Link href="/contact" style={{ color: 'var(--text-primary)', textDecoration: 'none', transition: 'color 0.2s', fontSize: '1rem', fontWeight: 700 }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ku-green)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}>Contact Support</Link>
        </div>
      </footer>
    </main>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

const CONTACT_TYPES = [
    { value: 'I am a registered student and need support', icon: '🎓' },
    { value: 'I am a counselor and need technical help', icon: '🧑‍⚕️' },
    { value: 'I have a question about the platform', icon: '❓' },
    { value: 'I want to report a bug or issue', icon: '🐛' },
    { value: 'I have a suggestion or feedback', icon: '💡' },
    { value: 'I need help with my account', icon: '🔑' },
    { value: 'Other inquiry', icon: '📝' },
];

export default function ContactSupportPage() {
    const [form, setForm] = useState({ name: '', email: '', contactType: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.name || !form.email || !form.contactType || !form.message) {
            setError('Please fill in all fields.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 16px',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
    };

    return (
        <main style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
            {/* Decorative blobs */}
            <div style={{
                position: 'fixed', top: '-10%', right: '-5%', width: '40vw', height: '40vw',
                background: 'radial-gradient(circle, rgba(0,102,51,0.12) 0%, transparent 70%)',
                zIndex: 0, pointerEvents: 'none', filter: 'blur(60px)'
            }} />
            <div style={{
                position: 'fixed', bottom: '-10%', left: '-5%', width: '50vw', height: '50vw',
                background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
                zIndex: 0, pointerEvents: 'none', filter: 'blur(80px)'
            }} />

            {/* Navbar */}
            <nav style={{
                position: 'relative', top: 0, left: 0, right: 0, height: 80,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 5vw', zIndex: 10,
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0, 102, 51, 0.3)',
                    }}>🎓</div>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Virtual Counseling Booking and Scheduling System</span>
                </Link>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <ThemeToggle />
                    <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Sign In</Link>
                </div>
            </nav>

            {/* Hero header */}
            <section style={{
                textAlign: 'center', padding: '40px 5vw 48px', position: 'relative', zIndex: 1,
                background: 'linear-gradient(180deg, rgba(0,102,51,0.06) 0%, transparent 100%)',
                borderBottom: '1px solid var(--border)',
            }}>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: 12 }}>
                    Contact <span className="gradient-text">Support</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
                    Use this form to reach out to our support team regarding any questions, concerns, or feedback.
                </p>
            </section>

            {/* Content */}
            <section style={{
                maxWidth: 960, margin: '0 auto', padding: '48px 5vw 80px',
                display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40,
                position: 'relative', zIndex: 1,
            }}>
                {/* Left: Form */}
                {submitted ? (
                    <div className="glass" style={{
                        padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 20, minHeight: 400,
                    }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem',
                        }}>✅</div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Message Sent!</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.6 }}>
                            Thank you for reaching out. We've sent a confirmation to your email.
                            Our team will get back to you within <strong>24–48 hours</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                            <button
                                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', contactType: '', message: '' }); }}
                                style={{
                                    padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border)',
                                    background: 'transparent', color: 'var(--text-primary)', fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}
                            >Send Another Message</button>
                            <Link href="/" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px' }}>Back to Home</Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Contact type */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                                Type of contact
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {CONTACT_TYPES.map(ct => (
                                    <label
                                        key={ct.value}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                                            border: `1px solid ${form.contactType === ct.value ? 'var(--ku-green-light)' : 'var(--border)'}`,
                                            background: form.contactType === ct.value ? 'rgba(0,102,51,0.08)' : 'var(--bg-card)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="contactType"
                                            value={ct.value}
                                            checked={form.contactType === ct.value}
                                            onChange={e => setForm({ ...form, contactType: e.target.value })}
                                            style={{ accentColor: 'var(--ku-green-light)', width: 18, height: 18 }}
                                        />
                                        <span style={{ fontSize: '1.1rem' }}>{ct.icon}</span>
                                        <span style={{
                                            fontSize: '0.9rem',
                                            color: form.contactType === ct.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            fontWeight: form.contactType === ct.value ? 600 : 400,
                                        }}>{ct.value}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Name & Email */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label htmlFor="contact-name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Full Name</label>
                                <input
                                    id="contact-name"
                                    type="text"
                                    placeholder="Your full name"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--ku-green-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,102,51,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div>
                                <label htmlFor="contact-email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Email Address</label>
                                <input
                                    id="contact-email"
                                    type="email"
                                    placeholder="your.email@ku.ac.ke"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = 'var(--ku-green-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,102,51,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label htmlFor="contact-message" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Message</label>
                            <textarea
                                id="contact-message"
                                placeholder="Describe your question, issue, or feedback in detail..."
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                rows={6}
                                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                                onFocus={e => { e.target.style.borderColor = 'var(--ku-green-light)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,102,51,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* Privacy consent */}
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            By clicking "Submit" you agree to the processing of your personal information for the
                            purpose of responding to this inquiry. For more information, see our{' '}
                            <Link href="/privacy-policy" style={{ color: 'var(--ku-green-light)', textDecoration: 'underline' }}>Privacy Policy</Link>.
                        </p>

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '12px 16px', borderRadius: 10,
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                color: '#f87171', fontSize: '0.85rem', fontWeight: 500,
                            }}>⚠ {error}</div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary"
                            style={{
                                width: '100%', padding: '16px', fontSize: '1rem',
                                justifyContent: 'center', opacity: submitting ? 0.6 : 1,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {submitting ? '⏳ Sending...' : '📨 Submit'}
                        </button>
                    </form>
                )}

                {/* Right: Info sidebar */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Contact info card */}
                    <div className="glass" style={{
                        padding: 28, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16,
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Virtual Counseling Booking and Scheduling System</h3>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            <p style={{ margin: '0 0 4px' }}>Kenyatta University</p>
                            <p style={{ margin: '0 0 4px' }}>Main Campus, Nairobi</p>
                            <p style={{ margin: '0 0 4px' }}>P.O. Box 43844 – 00100</p>
                            <p style={{ margin: 0 }}>Kenya</p>
                        </div>
                        <a
                            href="mailto:abumubarak430@gmail.com"
                            style={{
                                color: 'var(--ku-green-light)', fontWeight: 600, fontSize: '0.9rem',
                                textDecoration: 'none', transition: 'opacity 0.2s',
                            }}
                        >
                            abumubarak430@gmail.com
                        </a>
                    </div>

                    {/* Hours card */}
                    <div className="glass" style={{
                        padding: 28, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14,
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>🕐 Support Hours</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Monday – Friday</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>8:00 AM – 5:00 PM</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Saturday</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>9:00 AM – 1:00 PM</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Sunday</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Closed</span>
                            </div>
                        </div>
                    </div>

                    {/* Response time */}
                    <div className="glass" style={{
                        padding: 28, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10,
                        background: 'rgba(0,102,51,0.04)', border: '1px solid rgba(0,102,51,0.15)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1.2rem' }}>⚡</span>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Quick Response</h3>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                            We typically respond within <strong style={{ color: 'var(--ku-green-light)' }}>24 hours</strong> on business days.
                            For urgent matters, please indicate so in your message.
                        </p>
                    </div>
                </aside>
            </section>

            {/* Footer */}
            <footer style={{ padding: '40px 5vw', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    © {new Date().getFullYear()} Kenyatta University — Virtual Counseling Booking and Scheduling System
                </p>
            </footer>

            {/* Responsive styles */}
            <style>{`
                @media (max-width: 768px) {
                    section[style*="grid-template-columns: 1fr 320px"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </main>
    );
}

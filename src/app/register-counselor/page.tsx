'use client';
import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';

export default function CounselorRegisterPage() {
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const nameRegex = /^[A-Za-z\s\-\']+$/;
        if (!nameRegex.test(form.firstName.trim())) {
            setError('First name can only contain letters, spaces, hyphens, and apostrophes.');
            return;
        }

        if (!nameRegex.test(form.lastName.trim())) {
            setError('Last name can only contain letters, spaces, hyphens, and apostrophes.');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    name: `${form.firstName} ${form.lastName}`,
                    email: form.email,
                    password: form.password,
                    phone: form.phone || undefined,
                    role: 'counselor',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Registration failed. Please try again.');
            } else {
                setSubmitted(true);
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '14px 16px', borderRadius: 12,
        border: '1.5px solid #e5e7eb', background: '#ffffff',
        fontSize: '0.95rem', color: '#111827', outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxSizing: 'border-box',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.85rem', fontWeight: 700,
        color: '#374151', marginBottom: 6,
    };

    if (submitted) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%)' }}>
                <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
                    <div style={{
                        width: 88, height: 88, borderRadius: '50%',
                        background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}>
                        <CheckCircle size={40} color="#22c55e" strokeWidth={2} />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, color: '#111827' }}>Application Submitted!</h1>
                    <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 28, fontSize: '1rem' }}>
                        Your counselor registration has been received and is <strong style={{ color: '#d97706' }}>pending admin review</strong>.
                        You will receive an email at <strong style={{ color: '#325343' }}>{form.email}</strong> once approved.
                    </p>
                    <div style={{ padding: '16px 24px', borderRadius: 14, marginBottom: 28, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.06)' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#16a34a', lineHeight: 1.6 }}>
                            <Shield size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                            For security, counselor accounts must be verified by an administrator before access is granted.
                        </p>
                    </div>
                    <Link href="/login?role=counselor" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        color: '#6b7280', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600,
                    }}>
                        <ArrowLeft size={16} /> Back to Counselor Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex' }}>
            <style>{`
                .cr-input:focus { border-color: #325343 !important; box-shadow: 0 0 0 3px rgba(50,83,67,0.1) !important; }
                .cr-input::placeholder { color: #9ca3af; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 860px) {
                    .cr-left-panel { display: none !important; }
                    .cr-right-panel { min-height: 100vh !important; }
                }
            `}</style>

            {/* Left Panel — Hero (desktop only) */}
            <div className="cr-left-panel" style={{
                flex: '0 0 42%', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url(/wellness-bg.png)',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(160deg, rgba(30,60,45,0.75) 0%, rgba(10,25,20,0.6) 100%)',
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'flex-end', padding: '10%',
                }}>
                    <Logo size={52} style={{ marginBottom: 32, background: 'rgba(255,255,255,0.15)' }} />
                    <h2 style={{
                        fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
                        fontWeight: 800, color: '#fff',
                        lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em',
                    }}>
                        Make a difference in students' lives.
                    </h2>
                    <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, maxWidth: 360 }}>
                        Join the KU Wellness team and provide professional counseling support to university students.
                    </p>
                    <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {['Verified', 'Professional', 'Impactful'].map(tag => (
                            <span key={tag} style={{
                                background: 'rgba(255,255,255,0.12)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff', padding: '6px 14px',
                                borderRadius: 99, fontSize: '0.8rem', fontWeight: 600,
                            }}>{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="cr-right-panel" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#ffffff', padding: '40px 24px', overflowY: 'auto',
            }}>
                <div style={{ width: '100%', maxWidth: 480 }}>
                    {/* Back link */}
                    <Link href="/login?role=counselor" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: '#6b7280', textDecoration: 'none', fontSize: '0.85rem',
                        fontWeight: 600, marginBottom: 28,
                    }}>
                        <ArrowLeft size={16} strokeWidth={2.5} /> Back to Login
                    </Link>

                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 8, color: '#111827' }}>
                            Join as a Counselor
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                            Your account will be reviewed and approved by an administrator before you can log in.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 12, padding: '12px 16px', color: '#dc2626',
                                fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{ fontWeight: 700 }}>!</span> {error}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={labelStyle} htmlFor="cr-first">First Name</label>
                                <input id="cr-first" type="text" className="cr-input" placeholder="Jane"
                                    style={inputStyle} value={form.firstName}
                                    onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                            </div>
                            <div>
                                <label style={labelStyle} htmlFor="cr-last">Last Name</label>
                                <input id="cr-last" type="text" className="cr-input" placeholder="Doe"
                                    style={inputStyle} value={form.lastName}
                                    onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="cr-email">Email Address</label>
                            <input id="cr-email" type="email" className="cr-input" placeholder="counselor@ku.ac.ke or @gmail.com"
                                style={inputStyle} value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })} required />
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 5 }}>Use your @ku.ac.ke or @gmail.com address</div>
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="cr-phone">Phone (optional)</label>
                            <input id="cr-phone" type="tel" className="cr-input" placeholder="+2547XXXXXXXX"
                                style={inputStyle} value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="cr-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input id="cr-password" type={showPassword ? 'text' : 'password'} className="cr-input"
                                    placeholder="Min. 8 characters (letters & numbers)"
                                    style={{ ...inputStyle, paddingRight: 48 }} value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} required />
                                <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0,
                                    display: 'flex', alignItems: 'center',
                                }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="cr-confirm">Confirm Password</label>
                            <input id="cr-confirm" type={showPassword ? 'text' : 'password'} className="cr-input"
                                placeholder="Re-enter your password"
                                style={inputStyle} value={form.confirmPassword}
                                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                        </div>

                        {/* Info notice */}
                        <div style={{
                            padding: '14px 18px', borderRadius: 12,
                            border: '1px solid rgba(50,83,67,0.15)', background: 'rgba(50,83,67,0.04)',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                        }}>
                            <Shield size={16} color="#325343" style={{ flexShrink: 0, marginTop: 2 }} />
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.55 }}>
                                After submitting, an administrator will review your application. You'll receive an email confirmation once approved.
                            </p>
                        </div>

                        <button
                            id="counselor-register-submit"
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                background: '#325343', color: '#fff', border: 'none',
                                padding: '15px 28px', borderRadius: 12, fontWeight: 700, fontSize: '1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1, transition: 'all 0.25s ease',
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                    Submitting…
                                </>
                            ) : (
                                <>Submit Application <ArrowRight size={18} strokeWidth={2.5} /></>
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', marginTop: 28 }}>
                        © {new Date().getFullYear()} Kenyatta University — KU Wellness
                    </p>
                </div>
            </div>
        </div>
    );
}

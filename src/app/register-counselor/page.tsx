'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
export default function CounselorRegisterPage() {
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const green = '#4ade80';
    const greenDim = 'rgba(74,222,128,0.08)';
    const greenBorder = 'rgba(74,222,128,0.25)';

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

    if (submitted) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-main)' }}>
                <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 16 }}>Pending</div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 12 }}>Application Submitted!</h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
                        Your counselor registration has been received and is <strong style={{ color: '#facc15' }}>pending admin review</strong>.
                        You will receive an email at <strong style={{ color: green }}>{form.email}</strong> once your account is approved.
                    </p>
                    <div className="glass" style={{ padding: '16px 24px', borderRadius: 12, marginBottom: 24, border: `1px solid ${greenBorder}`, background: greenDim }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: green, lineHeight: 1.6 }}>
                            For security, counselor accounts must be verified by a system administrator before access is granted.
                        </p>
                    </div>
                    <Link href="/login?role=counselor" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
                        ← Back to Counselor Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: 20 }}>
            {/* Background */}
            <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse at top left, ${greenDim.replace('0.08', '0.15')} 0%, transparent 55%), var(--bg-main)`, zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: `radial-gradient(circle, ${greenDim} 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
                {/* Back link */}
                <div style={{ marginBottom: 20 }}>
                    <Link href="/login?role=counselor" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        <ArrowLeft size={16} strokeWidth={2.5} />
                        Back to Counselor Login
                    </Link>
                </div>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 68, height: 68, borderRadius: 20, background: greenDim, border: `1.5px solid ${greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 18px', boxShadow: `0 8px 32px rgba(34,197,94,0.3)` }}>
                        C
                    </div>
                    <span style={{ display: 'inline-block', background: greenDim, color: green, border: `1px solid ${greenBorder}`, borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                        Counselor Registration
                    </span>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8, color: green }}>Join as a Counselor</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                        Your account will be reviewed and approved by an administrator before you can log in.
                    </p>
                </div>

                {/* Form card */}
                <div className="glass" style={{ padding: 32, border: `1px solid ${greenBorder}`, borderRadius: 20 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>!</span> {error}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label htmlFor="reg-first-name">First Name</label>
                                <input id="reg-first-name" type="text" className="form-input" placeholder="Jane" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label htmlFor="reg-last-name">Last Name</label>
                                <input id="reg-last-name" type="text" className="form-input" placeholder="Doe" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                            </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="reg-email">Email Address</label>
                            <input id="reg-email" type="email" className="form-input" placeholder="counselor@ku.ac.ke or @gmail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Use your @ku.ac.ke or @gmail.com address</div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="reg-phone">Phone (optional)</label>
                            <input id="reg-phone" type="tel" className="form-input" placeholder="+2547XXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="reg-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input id="reg-password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="reg-confirm-password">Confirm Password</label>
                            <input id="reg-confirm-password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                        </div>

                        {/* Info box */}
                        <div style={{ background: greenDim, border: `1px solid ${greenBorder}`, borderRadius: 10, padding: '12px 16px', fontSize: '0.8rem', color: green, lineHeight: 1.5 }}>
                            After submitting, an administrator will review your application. You will receive an email confirmation once approved.
                        </div>

                        <button
                            id="counselor-register-submit"
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.25s ease', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' }}
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
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 20 }}>
                    © {new Date().getFullYear()} Kenyatta University — Student Counseling Services
                </p>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import PasswordStrength from '@/components/PasswordStrength';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
        role: 'student', studentId: '', phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const nameRegex = /^[A-Za-z\s\-\']+$/;
        if (!nameRegex.test(form.firstName.trim())) {
            setError('First name can only contain letters, spaces, hyphens, and apostrophes');
            return;
        }

        if (!nameRegex.test(form.lastName.trim())) {
            setError('Last name can only contain letters, spaces, hyphens, and apostrophes');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (form.phone) {
            const phoneRegex = /^\+2547\d{8}$/;
            if (!phoneRegex.test(form.phone)) {
                setError('Phone number must be in format +2547 followed by 8 digits (e.g., +254700000000)');
                return;
            }
        }

        setLoading(true);
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        const data = await res.json();

        if (!res.ok) {
            setError(data.error ?? 'Registration failed');
            showToast(data.error ?? 'Registration failed', 'error');
            setLoading(false);
            return;
        }

        showToast('Account created successfully! Redirecting to login...', 'success');
        router.push('/login?registered=true');
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

    return (
        <div style={{ minHeight: '100vh', display: 'flex' }}>
            <style>{`
                .reg-input:focus { border-color: #325343 !important; box-shadow: 0 0 0 3px rgba(50,83,67,0.1) !important; }
                .reg-input::placeholder { color: #9ca3af; }
                .reg-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px !important; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 860px) {
                    .reg-left-panel { display: none !important; }
                    .reg-right-panel { min-height: 100vh !important; }
                }
            `}</style>

            {/* Left Panel — Hero (desktop only) */}
            <div className="reg-left-panel" style={{
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
                        fontSize: 'clamp(1.6rem, 2.5vw, 2.4rem)',
                        fontWeight: 800, color: '#fff',
                        lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.02em',
                    }}>
                        Your well-being matters. Start your journey.
                    </h2>
                    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, maxWidth: 380 }}>
                        Join KU Wellness — a safe, confidential space for academic, career, and personal support.
                    </p>
                    <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {['Confidential', 'Free', 'Student-Focused'].map(tag => (
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
            <div className="reg-right-panel" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#ffffff', padding: '40px 24px', overflowY: 'auto',
            }}>
                <div style={{ width: '100%', maxWidth: 480 }}>
                    {/* Nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                        <Link href="/" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            color: '#6b7280', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                        }}>
                            <ArrowLeft size={16} strokeWidth={2.5} /> Home
                        </Link>
                        <Link href="/access" style={{
                            color: '#325343', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
                        }}>
                            Sign In →
                        </Link>
                    </div>

                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 8, color: '#111827' }}>
                            Create Account
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                            Join KU Wellness with your university or personal email
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
                                <label style={labelStyle} htmlFor="reg-firstname">First Name</label>
                                <input id="reg-firstname" type="text" className="reg-input" placeholder="First Name"
                                    style={inputStyle} value={form.firstName}
                                    onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                            </div>
                            <div>
                                <label style={labelStyle} htmlFor="reg-lastname">Last Name</label>
                                <input id="reg-lastname" type="text" className="reg-input" placeholder="Last Name"
                                    style={inputStyle} value={form.lastName}
                                    onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="reg-email">Email Address</label>
                            <input id="reg-email" type="email" className="reg-input"
                                placeholder={form.role === 'student' ? "12673.2022@students.ku.ac.ke" : "your.name@gmail.com"}
                                style={inputStyle} value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })} required />
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 5 }}>
                                {form.role === 'student' ? 'Students must use @students.ku.ac.ke' : 'Counselors can use @ku.ac.ke or @gmail.com'}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={labelStyle} htmlFor="reg-password">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input id="reg-password" type={showPassword ? 'text' : 'password'} className="reg-input"
                                        placeholder="Min. 8 characters"
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
                                <PasswordStrength password={form.password} />
                            </div>
                            <div>
                                <label style={labelStyle} htmlFor="reg-confirm">Confirm Password</label>
                                <input id="reg-confirm" type={showPassword ? 'text' : 'password'} className="reg-input"
                                    placeholder="Repeat password"
                                    style={inputStyle} value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle} htmlFor="reg-role">Role</label>
                            <select id="reg-role" className="reg-input reg-select"
                                style={inputStyle} value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value })}>
                                <option value="student">Student</option>
                                <option value="counselor">Counselor</option>
                            </select>
                        </div>

                        {form.role === 'student' && (
                            <div>
                                <label style={labelStyle} htmlFor="reg-studentid">Student ID (optional)</label>
                                <input id="reg-studentid" type="text" className="reg-input" placeholder="e.g. C026/0001/2022"
                                    style={inputStyle} value={form.studentId}
                                    onChange={e => setForm({ ...form, studentId: e.target.value })} />
                            </div>
                        )}

                        <div>
                            <label style={labelStyle} htmlFor="reg-phone">Phone (optional)</label>
                            <input id="reg-phone" type="tel" className="reg-input" placeholder="+254700000000"
                                style={inputStyle} value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                pattern="^\+2547\d{8}$" maxLength={13} title="Format: +2547 followed by 8 digits" />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                background: '#325343', color: '#fff', border: 'none',
                                padding: '15px 28px', borderRadius: 12, fontWeight: 700, fontSize: '1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1, transition: 'all 0.25s ease',
                                marginTop: 4,
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                    Creating account…
                                </>
                            ) : (
                                <>Create Account <ArrowRight size={18} strokeWidth={2.5} /></>
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', marginTop: 24 }}>
                        Already have an account?{' '}
                        <Link href="/access" style={{ color: '#325343', fontWeight: 700, textDecoration: 'none' }}>
                            Sign In
                        </Link>
                    </p>

                    <p style={{ textAlign: 'center', color: '#d1d5db', fontSize: '0.75rem', marginTop: 16 }}>
                        © {new Date().getFullYear()} Kenyatta University — KU Wellness
                    </p>
                </div>
            </div>
        </div>
    );
}

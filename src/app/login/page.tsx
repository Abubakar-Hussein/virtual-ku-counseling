'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, EyeOff, GraduationCap, UserCheck, Shield, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

const roleConfig: Record<string, {
    label: string;
    placeholder: string;
    icon: React.ReactNode;
}> = {
    student: {
        label: 'Student',
        placeholder: '12673.2022@students.ku.ac.ke',
        icon: <GraduationCap size={28} strokeWidth={1.5} style={{ color: 'var(--ku-green)' }} />,
    },
    counselor: {
        label: 'Counselor',
        placeholder: 'counselor@ku.ac.ke',
        icon: <UserCheck size={28} strokeWidth={1.5} style={{ color: 'var(--ku-green)' }} />,
    },
    admin: {
        label: 'Administrator',
        placeholder: 'admin@ku.ac.ke',
        icon: <Shield size={28} strokeWidth={1.5} style={{ color: 'var(--ku-green)' }} />,
    },
};

export default function LoginPage() {
    const [role, setRole] = useState<string>('');
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const r = params.get('role') || '';
        setRole(r);
        const e = params.get('error');
        if (e === 'CredentialsSignin') {
            setError('Invalid email or password. Please try again.');
            showToast('Invalid email or password', 'error');
        }
        if (params.get('registered') === 'true') {
            showToast('Account created! Please sign in.', 'success');
        }
    }, []);

    const cfg = roleConfig[role] || null;

    const getCallbackUrl = () => {
        if (role === 'admin') return '/admin/dashboard?loggedIn=true';
        if (role === 'counselor') return '/counselor/dashboard?loggedIn=true';
        if (role === 'student') return '/student/dashboard?loggedIn=true';
        return '/dashboard?loggedIn=true';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        signIn('credentials', {
            email: form.email,
            password: form.password,
            expectedRole: role || undefined,
            callbackUrl: getCallbackUrl(),
        });
    };

    return (
        <main style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
            {/* ─── Left Panel: Background image */}
            <div className="login-left-panel" style={{
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
                {/* Overlay */}
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
                        Welcome back to your safe space.
                    </h2>
                    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, maxWidth: 380 }}>
                        Mental wellness starts here. Log in to continue your journey with the KU Wellness System.
                    </p>
                    <div style={{
                        marginTop: 48,
                        display: 'flex', gap: 12, flexWrap: 'wrap',
                    }}>
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

            {/* ─── Right Panel: Form */}
            <div style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-main)',
                padding: 'clamp(24px, 6vw, 80px)',
                minHeight: '100vh',
            }}>
                <div style={{ width: '100%', maxWidth: 400 }}>

                    {/* Back link */}
                    <div style={{ marginBottom: 36 }}>
                        <Link href="/access" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            color: 'var(--text-muted)', textDecoration: 'none',
                            fontSize: '0.85rem', fontWeight: 500,
                            transition: 'color 0.2s',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ku-green)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                            <ArrowLeft size={15} strokeWidth={2.5} />
                            Back to options
                        </Link>
                    </div>

                    {/* Role badge */}
                    {cfg && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            background: 'rgba(50,83,67,0.07)',
                            border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 10,
                            padding: '8px 14px',
                            marginBottom: 24,
                        }}>
                            {cfg.icon}
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ku-green)' }}>
                                {cfg.label} Login
                            </span>
                        </div>
                    )}

                    {/* Heading */}
                    <h1 style={{
                        fontSize: '2rem', fontWeight: 800,
                        color: 'var(--text-primary)',
                        marginBottom: 8, letterSpacing: '-0.02em',
                    }}>
                        {cfg ? `Sign in as ${cfg.label}` : 'Welcome back'}
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)', fontSize: '0.95rem',
                        marginBottom: 36, lineHeight: 1.5,
                    }}>
                        {cfg
                            ? `Enter your credentials to access your ${cfg.label.toLowerCase()} dashboard`
                            : 'Sign in with your Kenyatta University credentials'}
                    </p>

                    {/* Error */}
                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: 10, padding: '12px 16px',
                            color: '#e05252', fontSize: '0.875rem',
                            marginBottom: 20,
                        }}>
                            <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Email */}
                        <div>
                            <label htmlFor="login-email" style={{
                                display: 'block', fontSize: '0.85rem',
                                fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8,
                            }}>
                                {role === 'admin' ? 'Admin Email' : role === 'counselor' ? 'Counselor Email' : 'University Email'}
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                className="form-input"
                                placeholder={cfg?.placeholder || '12673.2022@students.ku.ac.ke'}
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label htmlFor="login-password" style={{
                                    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)',
                                }}>
                                    Password
                                </label>
                                <Link href="/forgot-password" style={{
                                    fontSize: '0.8rem', color: 'var(--ku-green)',
                                    textDecoration: 'none', fontWeight: 500,
                                }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    style={{ paddingRight: 48 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    style={{
                                        position: 'absolute', right: 14, top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        color: 'var(--text-muted)', cursor: 'pointer',
                                        padding: 0, display: 'flex', alignItems: 'center',
                                    }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword
                                        ? <EyeOff size={18} strokeWidth={1.8} />
                                        : <Eye size={18} strokeWidth={1.8} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', marginTop: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                background: 'var(--ku-green)',
                                color: '#fff', border: 'none',
                                padding: '15px 28px', borderRadius: 12,
                                fontWeight: 700, fontSize: '1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 16px rgba(50,83,67,0.2)',
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={{
                                        width: 18, height: 18,
                                        border: '2px solid rgba(255,255,255,0.35)',
                                        borderTopColor: '#fff', borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    {cfg ? `Sign in as ${cfg.label}` : 'Sign In'}
                                    <ArrowRight size={18} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer links */}
                    {role !== 'admin' && role !== 'counselor' && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 28 }}>
                            Don&apos;t have an account?{' '}
                            <Link href="/register" style={{ color: 'var(--ku-green)', fontWeight: 600, textDecoration: 'none' }}>
                                Create one now
                            </Link>
                        </p>
                    )}
                    {role === 'counselor' && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 28 }}>
                            New counselor?{' '}
                            <Link href="/register-counselor" style={{ color: 'var(--ku-green)', fontWeight: 600, textDecoration: 'none' }}>
                                Apply to join →
                            </Link>
                        </p>
                    )}

                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 48 }}>
                        © {new Date().getFullYear()} Kenyatta University — KU Wellness System
                    </p>
                </div>
            </div>

            <style>{`
                @media (min-width: 860px) {
                    .login-left-panel { display: block !important; }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </main>
    );
}

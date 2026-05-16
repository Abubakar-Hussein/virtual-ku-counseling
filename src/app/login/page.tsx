'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

const roleConfig: Record<string, {
    label: string;
    color: string;
    bg: string;
    border: string;
    shadow: string;
    icon: string;
    placeholder: string;
}> = {
    student: {
        label: 'Student',
        color: '#60a5fa',
        bg: 'rgba(96,165,250,0.08)',
        border: 'rgba(96,165,250,0.25)',
        shadow: 'rgba(59,130,246,0.3)',
        icon: '🎓',
        placeholder: '12673.2022@students.ku.ac.ke',
    },
    counselor: {
        label: 'Counselor',
        color: '#4ade80',
        bg: 'rgba(74,222,128,0.08)',
        border: 'rgba(74,222,128,0.25)',
        shadow: 'rgba(34,197,94,0.3)',
        icon: '🧑‍⚕️',
        placeholder: 'counselor@ku.ac.ke',
    },
    admin: {
        label: 'Administrator',
        color: '#f87171',
        bg: 'rgba(248,113,113,0.08)',
        border: 'rgba(248,113,113,0.25)',
        shadow: 'rgba(239,68,68,0.3)',
        icon: '🛡️',
        placeholder: 'admin@ku.ac.ke',
    },
};

export default function LoginPage() {
    const [role, setRole] = useState<string>('');
    const [urlError, setUrlError] = useState('');
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined') {
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

    const btnStyle = cfg
        ? {
              background: role === 'student'
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : role === 'counselor'
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #ef4444, #b91c1c)',
              boxShadow: `0 6px 20px ${cfg.shadow}`,
          }
        : { background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))' };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: 20,
        }}>
            {/* Background */}
            <div style={{
                position: 'fixed', inset: 0,
                background: cfg
                    ? `radial-gradient(ellipse at top left, ${cfg.bg.replace('0.08', '0.15')} 0%, transparent 55%), var(--bg-main)`
                    : 'radial-gradient(ellipse at top left, rgba(0,102,51,0.2) 0%, transparent 50%), var(--bg-main)',
                zIndex: 0,
            }} />
            {cfg && (
                <div style={{
                    position: 'fixed', bottom: '-10%', right: '-10%',
                    width: '50vw', height: '50vw',
                    background: `radial-gradient(circle, ${cfg.bg} 0%, transparent 70%)`,
                    filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
                }} />
            )}

            <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
                {/* Back to access */}
                <div style={{ marginBottom: 20 }}>
                    <Link href="/access" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: 'var(--text-muted)', textDecoration: 'none',
                        fontSize: '0.85rem', fontWeight: 500,
                        transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to Dashboard Access
                    </Link>
                </div>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 68, height: 68, borderRadius: 20,
                        background: cfg
                            ? cfg.bg
                            : 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                        border: cfg ? `1.5px solid ${cfg.border}` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', margin: '0 auto 18px',
                        boxShadow: cfg
                            ? `0 8px 32px ${cfg.shadow}`
                            : '0 8px 32px rgba(0,102,51,0.4)',
                    }}>
                        {cfg ? cfg.icon : '🎓'}
                    </div>

                    {cfg && (
                        <span style={{
                            display: 'inline-block',
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            borderRadius: 20, padding: '4px 14px',
                            fontSize: '0.75rem', fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            marginBottom: 14,
                        }}>
                            {cfg.label} Login
                        </span>
                    )}

                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>
                        {cfg ? (
                            <span style={{ color: cfg.color }}>{cfg.label} Portal</span>
                        ) : (
                            <span className="gradient-text">Wellness System</span>
                        )}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                        {cfg
                            ? `Sign in to access your ${cfg.label.toLowerCase()} dashboard`
                            : 'Sign in with your Kenyatta University credentials'}
                    </p>
                </div>

                {/* Card */}
                <div className="glass" style={{
                    padding: 32,
                    border: cfg ? `1px solid ${cfg.border}` : '1px solid var(--border)',
                    borderRadius: 20,
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 10, padding: '12px 16px',
                                color: '#f87171', fontSize: '0.875rem',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="login-email">
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
                                style={cfg ? { borderColor: 'transparent' } : {}}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    style={{
                                        position: 'absolute', right: 14, top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        color: 'var(--text-muted)', cursor: 'pointer',
                                        fontSize: '1rem', padding: 0,
                                    }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            <div style={{ textAlign: 'right', marginTop: 4 }}>
                                <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                color: '#fff', border: 'none',
                                padding: '14px 28px', borderRadius: 12,
                                fontWeight: 700, fontSize: '0.95rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.25s ease',
                                letterSpacing: '0.01em',
                                ...btnStyle,
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={{
                                        width: 16, height: 16,
                                        border: '2px solid rgba(255,255,255,0.4)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    {cfg ? `Sign in as ${cfg.label}` : 'Sign In'}
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {role !== 'admin' && role !== 'counselor' && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 20 }}>
                            Don&apos;t have an account?{' '}
                            <Link href="/register" style={{ color: 'var(--ku-green-light)', fontWeight: 600, textDecoration: 'none' }}>
                                Register
                            </Link>
                        </p>
                    )}
                    {role === 'counselor' && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 20 }}>
                            New counselor?{' '}
                            <Link href="/register-counselor" style={{ color: '#4ade80', fontWeight: 600, textDecoration: 'none' }}>
                                Apply to join →
                            </Link>
                        </p>
                    )}
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 20 }}>
                    © {new Date().getFullYear()} Kenyatta University — Student Counseling Services
                </p>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

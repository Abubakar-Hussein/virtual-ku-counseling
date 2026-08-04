'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Logo from '@/components/Logo';
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

/* ── Inline Google "G" logo ── */
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
);

export default function LoginPage() {
    const [role, setRole] = useState<string>('');
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
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
        if (e === 'PendingApproval') {
            setError('Your counselor account is pending admin approval. You will be notified by email once approved.');
            showToast('Account pending approval', 'error');
        }
        if (e === 'InvalidEmail') {
            setError('This email address is not allowed for the selected role. Please use a valid university email.');
            showToast('Invalid email for this role', 'error');
        }
        if (e === 'OAuthError') {
            setError('An error occurred during Google sign-in. Please try again.');
            showToast('Google sign-in error', 'error');
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

    const handleGoogleSignIn = () => {
        setGoogleLoading(true);
        setError('');
        // Set a cookie so the signIn callback knows which role the user intended
        document.cookie = `google_auth_role=${role || 'student'}; path=/; max-age=600; SameSite=Lax`;
        signIn('google', {
            callbackUrl: getCallbackUrl(),
        });
    };

    const showGoogleButton = role !== 'admin';

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
                    <Logo size={52} style={{ marginBottom: 32 }} />
                    <h2 style={{
                        fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                        fontWeight: 800, color: '#fff',
                        lineHeight: 1.15, marginBottom: 16,
                        letterSpacing: '-0.02em',
                    }}>
                        Welcome back to your safe space.
                    </h2>
                    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, maxWidth: 380 }}>
                        Mental wellness starts here. Log in to continue your journey with the KU Wellness.
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

                    {/* ─── Google Sign-In Button ─── */}
                    {showGoogleButton && (
                        <>
                            <button
                                id="google-signin"
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading}
                                className="google-btn"
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                                    background: 'var(--bg-card, #ffffff)',
                                    color: 'var(--text-primary, #1f2937)',
                                    border: '1.5px solid var(--border, #e5e7eb)',
                                    padding: '14px 24px', borderRadius: 12,
                                    fontWeight: 600, fontSize: '0.95rem',
                                    cursor: googleLoading ? 'not-allowed' : 'pointer',
                                    opacity: googleLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {googleLoading ? (
                                    <>
                                        <span style={{
                                            width: 18, height: 18,
                                            border: '2px solid rgba(0,0,0,0.15)',
                                            borderTopColor: 'var(--ku-green)', borderRadius: '50%',
                                            display: 'inline-block',
                                            animation: 'spin 0.7s linear infinite',
                                        }} />
                                        Connecting…
                                    </>
                                ) : (
                                    <>
                                        <GoogleIcon />
                                        Continue with Google
                                    </>
                                )}
                            </button>

                            {/* ─── OR Divider ─── */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 16,
                                margin: '24px 0',
                            }}>
                                <div style={{ flex: 1, height: 1, background: 'var(--border, #e5e7eb)' }} />
                                <span style={{
                                    fontSize: '0.78rem', fontWeight: 600,
                                    color: 'var(--text-muted, #9ca3af)',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                }}>
                                    OR
                                </span>
                                <div style={{ flex: 1, height: 1, background: 'var(--border, #e5e7eb)' }} />
                            </div>
                        </>
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
                        © {new Date().getFullYear()} Kenyatta University — KU Wellness
                    </p>
                </div>
            </div>

            <style>{`
                @media (min-width: 860px) {
                    .login-left-panel { display: block !important; }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .google-btn:hover {
                    border-color: rgba(50,83,67,0.35) !important;
                    box-shadow: 0 2px 12px rgba(50,83,67,0.08) !important;
                    transform: translateY(-1px);
                }
            `}
            </style>
        </main>
    );
}

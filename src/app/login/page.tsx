'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await signIn('credentials', {
            email: form.email,
            password: form.password,
            redirect: false, // Keep false to handle error messages manually
        });

        if (result?.error) {
            setError('Invalid email or password. Please try again.');
            setLoading(false);
            return;
        }

        // Fast client-side push to the redirection page
        router.push('/dashboard');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at top left, rgba(0,102,51,0.2) 0%, transparent 50%), var(--bg-dark)',
            padding: 20,
        }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18,
                        background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem', margin: '0 auto 16px',
                        boxShadow: '0 8px 32px rgba(0,102,51,0.4)',
                    }}>🎓</div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
                        <span className="gradient-text">KU Counseling</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Sign in with your Kenyatta University credentials
                    </p>
                </div>

                {/* Card */}
                <div className="glass" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 10, padding: '12px 16px',
                                color: '#f87171', fontSize: '0.875rem',
                            }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="login-email">University Email</label>
                            <input
                                id="login-email"
                                type="email"
                                className="form-input"
                                placeholder="12673.2022@students.ku.ac.ke"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <input
                                id="login-password"
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 20 }}>
                        Don't have an account?{' '}
                        <Link href="/register" style={{ color: 'var(--ku-green-light)', fontWeight: 600, textDecoration: 'none' }}>
                            Register
                        </Link>
                    </p>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 20 }}>
                    © {new Date().getFullYear()} Kenyatta University — Student Counseling Services
                </p>
            </div>
        </div>
    );
}

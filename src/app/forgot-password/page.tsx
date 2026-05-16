'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setSubmitted(true);
                showToast('Reset link sent if account exists', 'success');
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to send reset link', 'error');
            }
        } catch (error) {
            showToast('An error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at top right, rgba(0,102,51,0.2) 0%, transparent 50%), var(--bg-main)',
            padding: 20,
        }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18,
                        background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem', margin: '0 auto 16px',
                        boxShadow: '0 8px 32px rgba(0,102,51,0.4)',
                    }}>🔒</div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
                        <span className="gradient-text">Forgot Password</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Enter your university email to receive a reset link
                    </p>
                </div>

                <div className="glass" style={{ padding: 32 }}>
                    {!submitted ? (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="form-group">
                                <label htmlFor="email">University Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="e.g. 12673.2022@students.ku.ac.ke"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {loading ? 'Sending link...' : 'Send Reset Link'}
                            </button>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📧</div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Check your email</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
                                If an account exists for <strong>{email}</strong>, we've sent instructions to reset your password.
                            </p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="btn-secondary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Didn't receive it? Try again
                            </button>
                        </div>
                    )}

                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 24 }}>
                        Remember your password?{' '}
                        <Link href="/login" style={{ color: 'var(--ku-green-light)', fontWeight: 600, textDecoration: 'none' }}>
                            Back to Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

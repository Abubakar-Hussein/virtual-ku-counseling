'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PasswordStrength from '@/components/PasswordStrength';
import { useToast } from '@/components/Toast';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
        role: 'student', studentId: '', phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

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

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at top right, rgba(0,102,51,0.2) 0%, transparent 50%), var(--bg-dark)',
            padding: 20,
        }}>
            <div style={{ width: '100%', maxWidth: 480 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18,
                        background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem', margin: '0 auto 16px',
                        boxShadow: '0 8px 32px rgba(0,102,51,0.4)',
                    }}>🌱</div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
                        <span className="gradient-text">Create Account</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Join Wellness Connect with your university or personal email
                    </p>
                </div>

                <div className="glass" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: '0.875rem',
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label htmlFor="reg-firstname">First Name</label>
                                <input id="reg-firstname" type="text" className="form-input" placeholder="First Name"
                                    value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="reg-lastname">Last Name</label>
                                <input id="reg-lastname" type="text" className="form-input" placeholder="Last Name"
                                    value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                            </div>

                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label htmlFor="reg-email">Email Address</label>
                                <input id="reg-email" type="email" className="form-input" placeholder={form.role === 'student' ? "12673.2022@students.ku.ac.ke" : "your.name@gmail.com"}
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    {form.role === 'student' ? 'Students must use @students.ku.ac.ke' : 'Counselors can use @ku.ac.ke or @gmail.com'}
                                </p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-password">Password</label>
                                <input id="reg-password" type="password" className="form-input" placeholder="Min. 8 characters (letters & numbers)"
                                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                                <PasswordStrength password={form.password} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-confirm">Confirm Password</label>
                                <input id="reg-confirm" type="password" className="form-input" placeholder="Repeat password"
                                    value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                            </div>

                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label htmlFor="reg-role">Role</label>
                                <select id="reg-role" className="form-input"
                                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option value="student">Student</option>
                                    <option value="counselor">Counselor</option>
                                </select>
                            </div>

                            {form.role === 'student' && (
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label htmlFor="reg-studentid">Student ID (optional)</label>
                                    <input id="reg-studentid" type="text" className="form-input" placeholder="e.g. C026/0001/2022"
                                        value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} />
                                </div>
                            )}

                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label htmlFor="reg-phone">Phone (optional)</label>
                                <input id="reg-phone" type="tel" className="form-input" placeholder="+254700000000"
                                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                    pattern="^\+2547\d{8}$" maxLength={13} title="Format: +2547 followed by 8 digits" />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                            {loading ? 'Creating account…' : 'Create Account'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 20 }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: 'var(--ku-green-light)', fontWeight: 600, textDecoration: 'none' }}>
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

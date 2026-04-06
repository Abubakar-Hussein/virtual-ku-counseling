'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';

export default function AddCounselor() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.email.endsWith('@ku.ac.ke')) {
            setError('Counselor email must end with @ku.ac.ke');
            return;
        }

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, role: 'counselor' }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create counselor');
            } else {
                setSuccess('Counselor created successfully. Ensure you securely share their temporary password.');
                setForm({ name: '', email: '', password: '', phone: '' });
                // Optional: navigate back to user management after a delay
                // setTimeout(() => router.push('/admin/users'), 2000);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Add Counselor</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Create a new staff account for a university counselor.</p>
                    </div>
                    <NotificationBell />
                </header>

                <div className="glass" style={{ padding: 32, maxWidth: 600 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 16, color: '#f87171' }}>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: 16, color: '#4ade80' }}>
                                {success}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="name">Counselor Full Name</label>
                            <input
                                id="name" type="text" className="form-input" placeholder="e.g. Dr. Jane Doe"
                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Official Email</label>
                            <input
                                id="email" type="email" className="form-input" placeholder="jane.doe@ku.ac.ke"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                            />
                            <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>Must end with @ku.ac.ke</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number (Optional)</label>
                            <input
                                id="phone" type="tel" className="form-input" placeholder="+254 700 000 000"
                                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Temporary Password</label>
                            <input
                                id="password" type="text" className="form-input" placeholder="Min. 8 characters"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                            />
                            <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>Share this securely with the counselor so they can log in.</small>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 10 }}>
                            {loading ? 'Creating...' : 'Create Counselor Account'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

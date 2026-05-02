'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';

export default function AddCounselor() {
    const router = useRouter();
    const { showToast } = useToast();
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.email.endsWith('@ku.ac.ke') && !form.email.endsWith('@gmail.com')) {
            showToast('Counselor email must end with @ku.ac.ke or @gmail.com', 'error');
            return;
        }

        if (form.password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
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
                showToast(data.error || 'Failed to create counselor', 'error');
            } else {
                showToast('Counselor created successfully!', 'success');
                setForm({ firstName: '', lastName: '', email: '', password: '', phone: '' });
            }
        } catch (err) {
            showToast('An unexpected error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Add Counselor</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Create a new staff account for a university counselor.</p>
                    </div>
                    <NotificationBell />
                </header>

                <div className="glass" style={{ padding: 32, maxWidth: 600 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label htmlFor="firstname">First Name</label>
                                <input
                                    id="firstname" type="text" className="form-input" placeholder="e.g. Dr. Jane"
                                    value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastname">Last Name</label>
                                <input
                                    id="lastname" type="text" className="form-input" placeholder="e.g. Doe"
                                    value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Official or Personal Email</label>
                            <input
                                id="email" type="email" className="form-input" placeholder="jane.doe@gmail.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                            />
                            <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>Can be @ku.ac.ke or @gmail.com</small>
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

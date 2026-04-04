'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';

export default function AdminUserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                if (Array.isArray(data)) setUsers(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchUsers();
    }, []);

    const updateRole = async (userId: string, role: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role }),
            });
            if (res.ok) {
                setUsers(users.map(u => u._id === userId ? { ...u, role } : u));
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>User Management</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Control roles and system access for KU staff and students.</p>
                    </div>
                    <NotificationBell />
                </header>

                <div className="glass" style={{ padding: '0 24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '20px 12px' }}>User</th>
                                <th style={{ padding: '20px 12px' }}>Email</th>
                                <th style={{ padding: '20px 12px' }}>Role</th>
                                <th style={{ padding: '20px 12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {u.studentId || 'N/A'}</div>
                                    </td>
                                    <td style={{ padding: '16px 12px', fontSize: '0.85rem' }}>{u.email}</td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <span className={`badge ${u.role === 'admin' ? 'spec-career' : u.role === 'counselor' ? 'spec-academic' : ''}`}>{u.role}</span>
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <select
                                            className="form-input"
                                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: 140 }}
                                            value={u.role}
                                            onChange={(e) => updateRole(u._id, e.target.value)}
                                        >
                                            <option value="student">Student</option>
                                            <option value="counselor">Counselor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

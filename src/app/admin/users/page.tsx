'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { TableRowSkeleton } from '@/components/Skeleton';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import Avatar from '@/components/Avatar';

export default function AdminUserManagement() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [pendingCounselors, setPendingCounselors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    // Search
    const [search, setSearch] = useState('');
    // Role filter
    const [roleFilter, setRoleFilter] = useState('all');

    // Confirm modal for role change
    const [roleChange, setRoleChange] = useState<{ userId: string; newRole: string; userName: string } | null>(null);
    // Confirm modal for deletion
    const [userToDelete, setUserToDelete] = useState<{ userId: string; userName: string } | null>(null);

    // Edit user modal
    const [editUser, setEditUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', studentId: '' });
    const [saving, setSaving] = useState(false);

    const openEditModal = (u: any) => {
        setEditUser(u);
        setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', studentId: u.studentId || '' });
    };

    const saveUserEdit = async () => {
        if (!editUser) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: editUser._id, ...editForm }),
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(prev => prev.map(u => u._id === editUser._id ? { ...u, ...data } : u));
                showToast(`${editForm.name} updated successfully`, 'success');
                setEditUser(null);
            } else {
                showToast(data.error || 'Failed to update user', 'error');
            }
        } catch {
            showToast('Network error while updating user', 'error');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setUsers(data.filter((u: any) => u.approvalStatus !== 'pending'));
                    setPendingCounselors(data.filter((u: any) => u.role === 'counselor' && u.approvalStatus === 'pending'));
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load users', 'error');
            }
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
                showToast(`Role updated to ${role} successfully`, 'success');
            } else {
                showToast('Failed to update role', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'error');
        }
        setRoleChange(null);
    };

    const deleteUser = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setUsers(users.filter(u => u._id !== userId));
                showToast('User deleted successfully', 'success');
            } else {
                showToast('Failed to delete user', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred while deleting user', 'error');
        }
        setUserToDelete(null);
    };

    const handleCounselorAction = async (counselorId: string, action: 'approve' | 'reject', name: string) => {
        setApprovingId(counselorId);
        try {
            const res = await fetch(`/api/admin/counselors/${counselorId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (res.ok) {
                setPendingCounselors(prev => prev.filter(c => c._id !== counselorId));
                if (action === 'approve') {
                    showToast(`${name} approved — approval email sent`, 'success');
                } else {
                    showToast(`${name}'s application rejected and removed`, 'success');
                }
            } else {
                showToast(data.error || 'Action failed', 'error');
            }
        } catch (err) {
            showToast('Network error', 'error');
        } finally {
            setApprovingId(null);
        }
    };

    // Filtered users
    const filtered = users.filter(u => {
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesSearch = !search ||
            (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.studentId || '').toLowerCase().includes(search.toLowerCase());
        return matchesRole && matchesSearch;
    });

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>User Management</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Control roles and system access for KU staff and students.</p>
                    </div>
                    <NotificationBell />
                </header>

                {/* ── Pending Counselor Approvals ── */}
                {!loading && pendingCounselors.length > 0 && (
                    <section style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>⏳ Pending Counselor Approvals</h2>
                            <span style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                                {pendingCounselors.length} pending
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {pendingCounselors.map(c => (
                                <div key={c._id} className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, border: '1px solid rgba(250,204,21,0.2)', borderLeft: '3px solid #facc15', borderRadius: 12, flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Avatar name={c.name} size={40} fontSize="0.85rem" />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.email}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Registered: {new Date(c.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => handleCounselorAction(c._id, 'approve', c.name)}
                                            disabled={approvingId === c._id}
                                            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: approvingId === c._id ? 0.6 : 1 }}
                                        >
                                            {approvingId === c._id ? '…' : '✅ Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleCounselorAction(c._id, 'reject', c.name)}
                                            disabled={approvingId === c._id}
                                            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: approvingId === c._id ? 0.6 : 1 }}
                                        >
                                            🚫 Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Search & Role Filter */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
                        <span style={{
                            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none',
                        }}>🔍</span>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name, email, student ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 40, fontSize: '0.875rem' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {['all', 'student', 'counselor', 'admin'].map(role => {
                            const active = roleFilter === role;
                            const colors: Record<string, string> = {
                                all: 'var(--text-primary)',
                                student: '#60a5fa',
                                counselor: '#4ade80',
                                admin: '#f87171',
                            };
                            return (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: 20,
                                        border: `1px solid ${active ? colors[role] + '40' : 'var(--border)'}`,
                                        background: active ? colors[role] + '15' : 'transparent',
                                        color: active ? colors[role] : 'var(--text-muted)',
                                        fontSize: '0.78rem',
                                        fontWeight: active ? 600 : 400,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {role}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Result count */}
                {!loading && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                        Showing {filtered.length} of {users.length} users
                    </div>
                )}

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
                            {loading ? (
                                <>
                                    <TableRowSkeleton columns={4} />
                                    <TableRowSkeleton columns={4} />
                                    <TableRowSkeleton columns={4} />
                                    <TableRowSkeleton columns={4} />
                                    <TableRowSkeleton columns={4} />
                                </>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No users match your search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((u) => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar 
                                                    name={u.name} 
                                                    src={u.profileImage} 
                                                    size={36} 
                                                    fontSize="0.8rem" 
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {u.studentId || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 12px', fontSize: '0.85rem' }}>{u.email}</td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span className={`badge ${u.role === 'admin' ? 'spec-career' : u.role === 'counselor' ? 'spec-academic' : ''}`}>{u.role}</span>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <select
                                                    className="form-input"
                                                    style={{ padding: '4px 8px', fontSize: '0.8rem', width: 140 }}
                                                    value={u.role}
                                                    onChange={(e) => setRoleChange({ userId: u._id, newRole: e.target.value, userName: u.name })}
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="counselor">Counselor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: 8,
                                                        border: '1px solid rgba(96, 165, 250, 0.4)',
                                                        background: 'rgba(96, 165, 250, 0.1)',
                                                        color: '#60a5fa',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    title="Edit User"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => setUserToDelete({ userId: u._id, userName: u.name })}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: 8,
                                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    title="Delete User"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Confirm role change */}
            {roleChange && (
                <ConfirmModal
                    open={!!roleChange}
                    title="Change User Role?"
                    message={`Are you sure you want to change ${roleChange.userName}'s role to "${roleChange.newRole}"? This will affect their system access.`}
                    confirmLabel="Change Role"
                    variant="warning"
                    onConfirm={() => updateRole(roleChange.userId, roleChange.newRole)}
                    onCancel={() => {
                        setRoleChange(null);
                    }}
                />
            )}

            {/* Confirm user deletion */}
            {userToDelete && (
                <ConfirmModal
                    open={!!userToDelete}
                    title="Delete User?"
                    message={`Are you sure you want to delete ${userToDelete.userName}? This action cannot be undone and will permanently remove their data from the system.`}
                    confirmLabel="Delete User"
                    variant="danger"
                    onConfirm={() => deleteUser(userToDelete.userId)}
                    onCancel={() => setUserToDelete(null)}
                />
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
                     onClick={() => setEditUser(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '90%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 700 }}>✏️ Edit User</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                            Update details for <strong>{editUser.name}</strong>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Name */}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                    className="form-input"
                                    style={{ width: '100%', fontSize: '0.88rem' }}
                                />
                            </div>
                            {/* Email */}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                                    className="form-input"
                                    style={{ width: '100%', fontSize: '0.88rem' }}
                                />
                            </div>
                            {/* Phone */}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>Phone</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                    placeholder="+2547XXXXXXXX"
                                    className="form-input"
                                    style={{ width: '100%', fontSize: '0.88rem' }}
                                />
                            </div>
                            {/* Student ID */}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>Student ID</label>
                                <input
                                    type="text"
                                    value={editForm.studentId}
                                    onChange={e => setEditForm(p => ({ ...p, studentId: e.target.value }))}
                                    placeholder="e.g. SCT221-0000/2022"
                                    className="form-input"
                                    style={{ width: '100%', fontSize: '0.88rem' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditUser(null)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={saveUserEdit} disabled={saving || !editForm.name.trim() || !editForm.email.trim()} style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #9b7e49, #c9a84c)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                                {saving ? '⏳ Saving...' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

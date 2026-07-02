'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { TableRowSkeleton } from '@/components/Skeleton';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import Avatar from '@/components/Avatar';
import { Lock, Users, UserCheck, UserX, Search, X, Shield, ChevronDown } from 'lucide-react';

const ROLE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
    admin:    { bg: 'rgba(239,68,68,0.07)',  color: '#dc2626',        border: 'rgba(239,68,68,0.2)' },
    counselor:{ bg: 'rgba(50,83,67,0.07)',   color: 'var(--ku-green)',border: 'rgba(50,83,67,0.18)' },
    student:  { bg: 'rgba(50,83,67,0.06)',   color: 'var(--ku-green)',border: 'rgba(50,83,67,0.15)' },
};

const ROLE_FILTERS = [
    { value: 'all',       label: 'All Users' },
    { value: 'student',   label: 'Student' },
    { value: 'counselor', label: 'Counselor' },
    { value: 'admin',     label: 'Admin' },
];

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {children}
    </label>
);

const ModalInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        style={{
            width: '100%', padding: '11px 14px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--bg-main)',
            color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
            boxSizing: 'border-box', transition: 'border-color 0.2s',
            ...props.style,
        }}
        onFocus={e => (e.target.style.borderColor = 'rgba(50,83,67,0.45)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
    />
);

export default function AdminUserManagement() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [pendingCounselors, setPendingCounselors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [roleChange, setRoleChange] = useState<{ userId: string; newRole: string; userName: string } | null>(null);
    const [userToDelete, setUserToDelete] = useState<{ userId: string; userName: string } | null>(null);
    const [editUser, setEditUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', studentId: '' });
    const [saving, setSaving] = useState(false);

    const openEditModal = (u: any) => {
        setEditUser(u);
        setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', studentId: u.studentId || '' });
    };

    const saveUserEdit = async () => {
        if (!editUser) return;
        if (!/^[A-Za-z\s\-']+$/.test(editForm.name.trim())) {
            showToast('Name can only contain letters, spaces, hyphens, and apostrophes', 'error'); return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: editUser._id, ...editForm }),
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(prev => prev.map(u => u._id === editUser._id ? { ...u, ...data } : u));
                showToast(`${editForm.name} updated successfully`, 'success');
                setEditUser(null);
            } else { showToast(data.error || 'Failed to update user', 'error'); }
        } catch { showToast('Network error while updating user', 'error'); }
        finally { setSaving(false); }
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
            } catch { showToast('Failed to load users', 'error'); }
            finally { setLoading(false); }
        }
        fetchUsers();
    }, []);

    const updateRole = async (userId: string, role: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role }),
            });
            if (res.ok) { setUsers(users.map(u => u._id === userId ? { ...u, role } : u)); showToast(`Role updated to ${role}`, 'success'); }
            else { showToast('Failed to update role', 'error'); }
        } catch { showToast('An error occurred', 'error'); }
        setRoleChange(null);
    };

    const deleteUser = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
            if (res.ok) { setUsers(users.filter(u => u._id !== userId)); showToast('User deleted successfully', 'success'); }
            else { showToast('Failed to delete user', 'error'); }
        } catch { showToast('An error occurred', 'error'); }
        setUserToDelete(null);
    };

    const handleCounselorAction = async (id: string, action: 'approve' | 'reject', name: string) => {
        setApprovingId(id);
        try {
            const res = await fetch(`/api/admin/counselors/${id}/approve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (res.ok) {
                setPendingCounselors(prev => prev.filter(c => c._id !== id));
                showToast(action === 'approve' ? `${name} approved` : `${name}'s application rejected`, 'success');
            } else { showToast(data.error || 'Action failed', 'error'); }
        } catch { showToast('Network error', 'error'); }
        finally { setApprovingId(null); }
    };

    const filtered = users.filter(u => {
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const q = search.toLowerCase();
        const matchesSearch = !search || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.studentId || '').toLowerCase().includes(q);
        return matchesRole && matchesSearch;
    });

    const stats = [
        { label: 'Total Users',   value: users.length,                                    icon: <Users size={18} strokeWidth={2} />, accent: 'var(--ku-green)' },
        { label: 'Counselors',    value: users.filter(u => u.role === 'counselor').length, icon: <UserCheck size={18} strokeWidth={2} />, accent: 'var(--ku-green)' },
        { label: 'Pending Review',value: pendingCounselors.length,                         icon: <UserX size={18} strokeWidth={2} />, accent: pendingCounselors.length > 0 ? '#b45309' : 'var(--ku-green)' },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 20, padding: '4px 12px',
                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)',
                            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            <Shield size={12} strokeWidth={2.5} /> Admin Panel
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            User Management
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Control roles and system access for KU staff and students.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Stats */}
                {!loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
                        {stats.map(s => (
                            <div key={s.label} style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: 16, padding: '18px 22px',
                                display: 'flex', alignItems: 'center', gap: 14,
                            }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 11,
                                    background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: s.accent, flexShrink: 0,
                                }}>{s.icon}</div>
                                <div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.accent, lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pending Approvals */}
                {!loading && pendingCounselors.length > 0 && (
                    <section style={{
                        marginBottom: 32, background: 'var(--bg-card)',
                        border: '1px solid rgba(245,158,11,0.25)', borderLeft: '3px solid #f59e0b',
                        borderRadius: 14, overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '14px 20px', borderBottom: '1px solid rgba(245,158,11,0.15)',
                            background: 'rgba(245,158,11,0.04)',
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                Pending Counselor Approvals
                            </h2>
                            <span style={{
                                background: 'rgba(245,158,11,0.12)', color: '#b45309',
                                border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20,
                                padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700,
                            }}>{pendingCounselors.length} pending</span>
                        </div>
                        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {pendingCounselors.map(c => (
                                <div key={c._id} style={{
                                    padding: '14px 16px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
                                    background: 'rgba(245,158,11,0.02)', border: '1px solid rgba(245,158,11,0.1)',
                                    borderRadius: 10,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Avatar name={c.name} size={40} fontSize="0.85rem" />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                                                Registered {new Date(c.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleCounselorAction(c._id, 'approve', c.name)}
                                            disabled={approvingId === c._id} style={{
                                                padding: '8px 18px', borderRadius: 10,
                                                border: '1px solid rgba(50,83,67,0.25)', background: 'rgba(50,83,67,0.08)',
                                                color: 'var(--ku-green)', fontSize: '0.82rem', fontWeight: 700,
                                                cursor: 'pointer', opacity: approvingId === c._id ? 0.6 : 1,
                                            }}>
                                            {approvingId === c._id ? '…' : 'Approve'}
                                        </button>
                                        <button onClick={() => handleCounselorAction(c._id, 'reject', c.name)}
                                            disabled={approvingId === c._id} style={{
                                                padding: '8px 18px', borderRadius: 10,
                                                border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)',
                                                color: '#dc2626', fontSize: '0.82rem', fontWeight: 700,
                                                cursor: 'pointer', opacity: approvingId === c._id ? 0.6 : 1,
                                            }}>
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Search + Filter bar */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
                        <Search size={14} strokeWidth={2.2} style={{
                            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-muted)', pointerEvents: 'none',
                        }} />
                        <input type="text" placeholder="Search by name, email, student ID…"
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', paddingLeft: 40, paddingRight: search ? 36 : 14,
                                paddingTop: 10, paddingBottom: 10,
                                border: '1px solid var(--border)', borderRadius: 12,
                                background: 'var(--bg-card)', color: 'var(--text-primary)',
                                fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                            }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(50,83,67,0.4)')}
                            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} style={{
                                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex',
                            }}><X size={14} strokeWidth={2.5} /></button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                        {ROLE_FILTERS.map(f => (
                            <button key={f.value} onClick={() => setRoleFilter(f.value)} style={{
                                padding: '8px 16px', borderRadius: 20, fontSize: '0.8rem',
                                fontWeight: roleFilter === f.value ? 700 : 500, cursor: 'pointer', transition: 'all 0.18s',
                                background: roleFilter === f.value ? 'var(--ku-green)' : 'var(--bg-card)',
                                color: roleFilter === f.value ? '#fff' : 'var(--text-secondary)',
                                border: roleFilter === f.value ? '1px solid var(--ku-green)' : '1px solid var(--border)',
                                boxShadow: roleFilter === f.value ? '0 2px 8px rgba(50,83,67,0.15)' : 'none',
                            }}>{f.label}</button>
                        ))}
                    </div>

                    {!loading && (
                        <span style={{
                            marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)',
                            background: 'rgba(50,83,67,0.05)', border: '1px solid rgba(50,83,67,0.1)',
                            borderRadius: 20, padding: '5px 12px',
                        }}>
                            {filtered.length} of {users.length} users
                        </span>
                    )}
                </div>

                {/* Table */}
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 16, overflow: 'hidden',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(50,83,67,0.04)', borderBottom: '1px solid var(--border)' }}>
                                {['User', 'Email', 'Role', 'Actions'].map(h => (
                                    <th key={h} style={{
                                        padding: '13px 16px', textAlign: 'left',
                                        fontSize: '0.7rem', fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.07em',
                                        color: 'var(--ku-green)',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <><TableRowSkeleton columns={4} /><TableRowSkeleton columns={4} /><TableRowSkeleton columns={4} /><TableRowSkeleton columns={4} /></>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    No users match your search criteria.
                                </td></tr>
                            ) : filtered.map(u => {
                                const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.student;
                                return (
                                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(50,83,67,0.02)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                                    >
                                        {/* User column */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={u.name} size={38} fontSize="0.82rem" />
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {u.name}
                                                        {u.isHardcoded && (
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)', letterSpacing: '0.05em' }}>SYSTEM</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                                                        ID: {u.studentId || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email column */}
                                        <td style={{ padding: '14px 16px', fontSize: '0.845rem', color: 'var(--text-secondary)' }}>
                                            {u.email}
                                        </td>

                                        {/* Role badge */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                fontSize: '0.68rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                                                background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
                                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                            }}>{u.role}</span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '14px 16px' }}>
                                            {u.isHardcoded ? (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                    <Lock size={12} strokeWidth={2} /> System account — edit via Profile
                                                </span>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    {/* Role select */}
                                                    <div style={{ position: 'relative' }}>
                                                        <select
                                                            value={u.role}
                                                            onChange={e => setRoleChange({ userId: u._id, newRole: e.target.value, userName: u.name })}
                                                            style={{
                                                                padding: '6px 28px 6px 10px', borderRadius: 8, fontSize: '0.8rem',
                                                                border: '1px solid var(--border)', background: 'var(--bg-main)',
                                                                color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
                                                                appearance: 'none', fontWeight: 500,
                                                            }}
                                                        >
                                                            <option value="student">Student</option>
                                                            <option value="counselor">Counselor</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                                    </div>
                                                    <button onClick={() => openEditModal(u)} style={{
                                                        padding: '6px 12px', borderRadius: 8,
                                                        border: '1px solid rgba(50,83,67,0.22)', background: 'rgba(50,83,67,0.07)',
                                                        color: 'var(--ku-green)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                                                    }}>Edit</button>
                                                    <button onClick={() => setUserToDelete({ userId: u._id, userName: u.name })} style={{
                                                        padding: '6px 12px', borderRadius: 8,
                                                        border: '1px solid rgba(239,68,68,0.22)', background: 'rgba(239,68,68,0.06)',
                                                        color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                                                    }}>Delete</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Role change confirm */}
            {roleChange && (
                <ConfirmModal open={!!roleChange} title="Change User Role?"
                    message={`Change ${roleChange.userName}'s role to "${roleChange.newRole}"? This will affect their system access.`}
                    confirmLabel="Change Role" variant="warning"
                    onConfirm={() => updateRole(roleChange.userId, roleChange.newRole)}
                    onCancel={() => setRoleChange(null)} />
            )}

            {/* Delete confirm */}
            {userToDelete && (
                <ConfirmModal open={!!userToDelete} title="Delete User?"
                    message={`Permanently delete ${userToDelete.userName}? This cannot be undone.`}
                    confirmLabel="Delete User" variant="danger"
                    onConfirm={() => deleteUser(userToDelete.userId)}
                    onCancel={() => setUserToDelete(null)} />
            )}

            {/* Edit user modal */}
            {editUser && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
                    onClick={() => setEditUser(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '90%', maxWidth: 460, borderRadius: 20,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden',
                    }}>
                        {/* Modal header */}
                        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Edit User</h3>
                                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Updating details for <strong style={{ color: 'var(--text-primary)' }}>{editUser.name}</strong></p>
                            </div>
                            <button onClick={() => setEditUser(null)} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 7 }}>
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div><FieldLabel>Full Name</FieldLabel><ModalInput type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
                            <div><FieldLabel>Email</FieldLabel><ModalInput type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
                            <div><FieldLabel>Phone</FieldLabel><ModalInput type="tel" value={editForm.phone} placeholder="+2547XXXXXXXX" onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
                            <div><FieldLabel>Student ID</FieldLabel><ModalInput type="text" value={editForm.studentId} placeholder="e.g. SCT221-0000/2022" onChange={e => setEditForm(p => ({ ...p, studentId: e.target.value }))} /></div>

                            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                                <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                                    Cancel
                                </button>
                                <button onClick={saveUserEdit} disabled={saving || !editForm.name.trim() || !editForm.email.trim()} style={{
                                    flex: 2, padding: '11px', borderRadius: 12, border: 'none',
                                    background: saving ? 'rgba(50,83,67,0.5)' : 'var(--ku-green)',
                                    color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                                    cursor: saving ? 'not-allowed' : 'pointer', opacity: (!editForm.name.trim() || !editForm.email.trim()) ? 0.5 : 1,
                                }}>
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const STUDENT_LINKS = [
    { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/student/counselors', label: 'Find Counselors', icon: '👤' },
    { href: '/student/appointments', label: 'My Appointments', icon: '📅' },
];

const COUNSELOR_LINKS = [
    { href: '/counselor/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/counselor/appointments', label: 'Appointments', icon: '📅' },
    { href: '/counselor/schedule', label: 'My Schedule', icon: '🗓️' },
];

const ADMIN_LINKS = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/appointments', label: 'Appointments', icon: '📅' },
];

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const role = (session?.user as any)?.role ?? 'student';

    const links =
        role === 'admin' ? ADMIN_LINKS :
            role === 'counselor' ? COUNSELOR_LINKS :
                STUDENT_LINKS;

    return (
        <aside style={{
            width: 240,
            minHeight: '100vh',
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 0',
            flexShrink: 0,
        }}>
            {/* Logo */}
            <div style={{ padding: '0 24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18,
                    }}>
                        🎓
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>KU Counseling</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}</div>
                    </div>
                </div>
            </div>

            {/* Nav Links */}
            <nav style={{ flex: 1, padding: '0 12px' }}>
                {links.map((link) => {
                    const active = pathname.startsWith(link.href);
                    return (
                        <Link key={link.href} href={link.href} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 10,
                            marginBottom: 4,
                            textDecoration: 'none',
                            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                            background: active ? 'rgba(0, 136, 68, 0.15)' : 'transparent',
                            border: active ? '1px solid rgba(0, 136, 68, 0.3)' : '1px solid transparent',
                            fontWeight: active ? 600 : 400,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                        }}>
                            <span>{link.icon}</span>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User info */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {session?.user?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    {session?.user?.email}
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{
                        width: '100%', background: 'transparent',
                        border: '1px solid var(--border)', borderRadius: 8,
                        color: 'var(--text-muted)', padding: '8px', cursor: 'pointer',
                        fontSize: '0.85rem', transition: 'all 0.2s',
                    }}
                >
                    Sign out
                </button>
            </div>
        </aside>
    );
}

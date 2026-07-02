'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';
import Avatar from './Avatar';
import Logo from './Logo';
import { Menu, X } from 'lucide-react';

const STUDENT_LINKS = [
    { href: '/student/dashboard', label: 'Dashboard', icon: '' },
    { href: '/student/counselors', label: 'Find Counselors', icon: '' },
    { href: '/student/appointments', label: 'My Appointments', icon: '' },
    { href: '/profile', label: 'My Profile', icon: '' },
];

const COUNSELOR_LINKS = [
    { href: '/counselor/dashboard', label: 'Dashboard', icon: '' },
    { href: '/counselor/appointments', label: 'Appointments', icon: '' },
    { href: '/counselor/records', label: 'Session Records', icon: '' },
    { href: '/counselor/schedule', label: 'My Schedule', icon: '' },
    { href: '/profile', label: 'My Profile', icon: '' },
];

const ADMIN_LINKS = [
    { href: '/admin/dashboard',    label: 'Dashboard',       icon: '' },
    { href: '/admin/users',        label: 'Users',           icon: '' },
    { href: '/admin/add-counselor',label: 'Add Counselor',   icon: '' },
    { href: '/admin/appointments', label: 'Appointments',    icon: '' },
    { href: '/admin/links',        label: 'Meeting Links',   icon: '' },
    { href: '/admin/reports',      label: 'Reports',         icon: '' },
    { href: '/admin/insights',     label: 'Insights',        icon: '' },
    { href: '/profile',            label: 'My Profile',      icon: '' },
];

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const role = (session?.user as any)?.role ?? 'student';

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [profileImg, setProfileImg] = useState<string | null>(null);

    // Fetch profile image
    useEffect(() => {
        if (session?.user) {
            fetch('/api/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.profileImage) setProfileImg(data.profileImage);
                })
                .catch(() => {});
        }
    }, [session]);

    // Close sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const links =
        role === 'admin' ? ADMIN_LINKS :
            role === 'counselor' ? COUNSELOR_LINKS :
                STUDENT_LINKS;

    return (
        <>
            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className={`mobile-menu-overlay ${isMobileOpen ? 'open' : ''}`} onClick={() => setIsMobileOpen(false)} />

            <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
            {/* Logo */}
            <div style={{ padding: '0 24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Logo size={36} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Wellness System</div>
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
                            background: active ? 'rgba(50, 83, 67, 0.15)' : 'transparent',
                            border: active ? '1px solid rgba(50, 83, 67, 0.3)' : '1px solid transparent',
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
            <div style={{ padding: '24px 20px 16px', background: 'var(--bg-card)', marginTop: 'auto' }}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Appearance</div>
                    <ThemeToggle />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <Avatar 
                        name={session?.user?.name || 'User'} 
                        src={profileImg} 
                        size={38}
                    />
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {session?.user?.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {session?.user?.email}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{
                        width: '100%', background: 'transparent',
                        border: '1px solid var(--border)', borderRadius: 10,
                        color: 'var(--text-secondary)', padding: '10px', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                >
                    Sign out
                </button>
            </div>
        </aside>
        </>
    );
}

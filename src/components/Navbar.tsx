'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav style={{
            height: 70, borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card)', padding: '0 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 100,
        }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem',
                }}>🎓</div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>KU Counseling</span>
            </Link>

            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                {session ? (
                    <>
                        <Link href={`/${(session.user as any).role}/dashboard`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Dashboard</Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Sign out
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Sign In</Link>
                        <Link href="/register" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Join</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

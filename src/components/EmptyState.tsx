'use client';
import Link from 'next/link';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
}

export default function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 32px',
            textAlign: 'center',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(10px)',
            borderRadius: 24,
            border: '1px solid var(--border)',
            marginTop: 20,
        }}>
            <div style={{
                fontSize: '4rem',
                marginBottom: 24,
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
                animation: 'float 3s ease-in-out infinite'
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                {title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 400, lineHeight: 1.6, marginBottom: 32 }}>
                {description}
            </p>
            {actionLabel && actionHref && (
                <Link href={actionHref} className="btn-primary" style={{ padding: '12px 24px', borderRadius: 12, textDecoration: 'none' }}>
                    {actionLabel}
                </Link>
            )}

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>
        </div>
    );
}

'use client';
import { useEffect, useState } from 'react';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetch('/api/notifications').then(r => r.json()).then(d => {
            if (Array.isArray(d)) setNotifications(d);
        });
    }, []);

    const unread = notifications.filter(n => !n.read).length;

    const markRead = async () => {
        await fetch('/api/notifications', { method: 'PATCH' });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                id="notification-bell"
                onClick={() => { setOpen(!open); if (!open && unread > 0) markRead(); }}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    position: 'relative',
                    fontSize: '1.1rem',
                    transition: 'all 0.2s',
                    color: 'var(--text-primary)',
                }}
            >
                🔔
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: -6, right: -6,
                        background: 'var(--ku-green-light)', color: '#fff',
                        borderRadius: '50%', width: 18, height: 18,
                        fontSize: '0.7rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'pulse-green 2s infinite',
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="glass" style={{
                    position: 'absolute', right: 0, top: '48px',
                    width: 320, maxHeight: 380, overflowY: 'auto',
                    zIndex: 100, padding: '12px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
                        Notifications
                    </div>
                    {notifications.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n._id} style={{
                                padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                                background: n.read ? 'transparent' : 'rgba(0, 136, 68, 0.08)',
                                border: '1px solid var(--border)',
                                fontSize: '0.82rem',
                                color: n.read ? 'var(--text-muted)' : 'var(--text-primary)',
                                lineHeight: 1.4,
                            }}>
                                {n.message}
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    {new Date(n.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

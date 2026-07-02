'use client';
import { useEffect, useState, useRef } from 'react';
import { Bell, Clock } from 'lucide-react';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/notifications').then(r => r.json()).then(d => {
            if (Array.isArray(d)) setNotifications(d);
        });

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unread = notifications.filter(n => !n.read).length;

    const markRead = async () => {
        if (unread === 0) return;
        await fetch('/api/notifications', { method: 'PATCH' });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                id="notification-bell"
                onClick={() => { setOpen(!open); if (!open) markRead(); }}
                style={{
                    background: open ? 'var(--bg-card-hover)' : 'transparent',
                    border: '1px solid',
                    borderColor: open ? 'var(--border-green)' : 'var(--border)',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: open ? 'var(--ku-green)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    boxShadow: open ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
                onMouseEnter={e => {
                    if (!open) e.currentTarget.style.background = 'var(--bg-card-hover)';
                }}
                onMouseLeave={e => {
                    if (!open) e.currentTarget.style.background = 'transparent';
                }}
            >
                <span style={{ transform: open ? 'rotate(15deg)' : 'none', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bell size={18} strokeWidth={2} />
                </span>
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: -4, right: -4,
                        background: 'var(--ku-green-light)', color: '#fff',
                        borderRadius: '50%', width: 18, height: 18,
                        fontSize: '0.65rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(0, 136, 68, 0.4)',
                        border: '2px solid var(--bg-main)',
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="glass" style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                    width: 320, maxHeight: 420, overflow: 'hidden',
                    zIndex: 1000, display: 'flex', flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    animation: 'modalSlideUp 0.3s ease-out'
                }}>
                    <div style={{ 
                        padding: '16px 20px', 
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)'
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Notifications</span>
                        {unread > 0 && (
                            <span style={{ fontSize: '0.7rem', background: 'var(--ku-green-light)', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                                {unread} New
                            </span>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', padding: '8px', flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{ 
                                padding: '40px 20px', 
                                textAlign: 'center', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: 12,
                                alignItems: 'center'
                            }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>All caught up!</div>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n._id} style={{
                                    padding: '12px 16px', borderRadius: 12, marginBottom: 4,
                                    background: n.read ? 'transparent' : 'rgba(0, 136, 68, 0.04)',
                                    transition: 'all 0.2s',
                                    cursor: 'default'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(0, 136, 68, 0.04)'}
                                >
                                    <div style={{ 
                                        fontSize: '0.85rem', 
                                        color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        fontWeight: n.read ? 400 : 500,
                                        lineHeight: 1.5,
                                        marginBottom: 4
                                    }}>
                                        {n.message}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Clock size={10} strokeWidth={2.5} style={{ opacity: 0.6 }} /> {new Date(n.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div style={{ padding: 12, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                            <button 
                                onClick={() => setNotifications([])}
                                style={{ 
                                    background: 'transparent', border: 'none', color: 'var(--text-muted)', 
                                    fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                Clear all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

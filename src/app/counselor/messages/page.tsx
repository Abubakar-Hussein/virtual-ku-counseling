'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { MessageCircle, Send, Search, Check, CheckCheck, User } from 'lucide-react';

export default function CounselorMessagesPage() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchContacts();
        const interval = setInterval(fetchContacts, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedContact) {
            fetchMessages(selectedContact.user._id || selectedContact.user.id);
            const interval = setInterval(() => {
                fetchMessages(selectedContact.user._id || selectedContact.user.id);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedContact]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchContacts = async () => {
        try {
            const res = await fetch('/api/messages');
            if (res.ok) {
                const data = await res.json();
                setContacts(data || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchMessages = async (contactId: string) => {
        try {
            const res = await fetch(`/api/messages?with=${contactId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedContact) return;

        const recipientId = selectedContact.user._id || selectedContact.user.id;
        const text = inputText.trim();
        setInputText('');

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: recipientId, content: text }),
            });
            if (res.ok) {
                fetchMessages(recipientId);
                fetchContacts();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition" style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: 24 }}>
                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700,
                            color: 'var(--ku-green)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12
                        }}>
                            <MessageCircle size={12} strokeWidth={2.5} /> Direct Messaging
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Client Messaging
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                            Secure, asynchronous communication with your assigned students.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Main 2-panel chat card */}
                <div className="glass" style={{
                    flex: 1, display: 'flex', borderRadius: 24, overflow: 'hidden',
                    background: 'var(--bg-card)', minHeight: 0
                }}>
                    {/* Left Contacts Panel */}
                    <div style={{
                        width: 320, borderRight: '1px solid var(--border)', display: 'flex',
                        flexDirection: 'column', background: 'var(--bg-main)'
                    }}>
                        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 14px 10px 36px', borderRadius: 12,
                                        border: '1px solid var(--border)', background: 'var(--bg-card)',
                                        fontSize: '0.85rem', color: 'var(--text-primary)', outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                            {filteredContacts.map(c => {
                                const isSelected = selectedContact?.user?._id === c.user?._id;
                                return (
                                    <div
                                        key={c.user?._id || c.user?.id}
                                        onClick={() => setSelectedContact(c)}
                                        style={{
                                            padding: 12, borderRadius: 16, cursor: 'pointer', marginBottom: 4,
                                            background: isSelected ? 'rgba(50,83,67,0.1)' : 'transparent',
                                            border: isSelected ? '1px solid rgba(50,83,67,0.2)' : '1px solid transparent',
                                            display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: 42, height: 42, borderRadius: '50%', background: 'var(--ku-green)',
                                            color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '1rem', flexShrink: 0
                                        }}>
                                            {c.user?.name ? c.user.name[0].toUpperCase() : 'U'}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {c.user?.name}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {c.lastMessage?.content || 'No messages yet'}
                                            </div>
                                        </div>

                                        {c.unreadCount > 0 && (
                                            <span style={{
                                                background: '#dc2626', color: '#fff', fontSize: '0.7rem',
                                                fontWeight: 800, padding: '2px 8px', borderRadius: 10
                                            }}>
                                                {c.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {filteredContacts.length === 0 && (
                                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    No conversations found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Chat Panel */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
                        {selectedContact ? (
                            <>
                                {/* Chat Header */}
                                <div style={{
                                    padding: '16px 24px', borderBottom: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', gap: 12
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: '50%', background: 'var(--ku-green)',
                                        color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '0.9rem'
                                    }}>
                                        {selectedContact.user?.name ? selectedContact.user.name[0].toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                            {selectedContact.user?.name}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--ku-green)', fontWeight: 600 }}>
                                            Student Client
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Container */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {messages.map((m, idx) => {
                                        const isMine = m.senderId !== (selectedContact.user?._id || selectedContact.user?.id);
                                        return (
                                            <div
                                                key={m._id || idx}
                                                style={{
                                                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                                                    maxWidth: '70%', display: 'flex', flexDirection: 'column',
                                                    alignItems: isMine ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                <div style={{
                                                    padding: '12px 18px',
                                                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    background: isMine ? 'var(--ku-green)' : 'var(--bg-main)',
                                                    color: isMine ? '#fff' : 'var(--text-primary)',
                                                    border: isMine ? 'none' : '1px solid var(--border)',
                                                    fontSize: '0.9rem', lineHeight: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                                }}>
                                                    {m.content}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {isMine && (
                                                        m.read ? <CheckCheck size={12} color="#3b82f6" /> : <Check size={12} color="var(--text-muted)" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Chat Input */}
                                <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                                    <input
                                        type="text"
                                        placeholder="Type a message to your client..."
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        style={{
                                            flex: 1, padding: '12px 18px', borderRadius: 14,
                                            border: '1px solid var(--border)', background: 'var(--bg-main)',
                                            fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '0 20px', borderRadius: 14, border: 'none',
                                            background: 'var(--ku-green)', color: '#fff', fontWeight: 700,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                            boxShadow: '0 4px 14px rgba(50,83,67,0.2)'
                                        }}
                                    >
                                        <Send size={16} /> Send
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <MessageCircle size={48} color="var(--ku-green)" style={{ opacity: 0.4, marginBottom: 12 }} />
                                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Select a Conversation</h3>
                                <p style={{ fontSize: '0.88rem' }}>Choose a student client from the sidebar to open messages.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

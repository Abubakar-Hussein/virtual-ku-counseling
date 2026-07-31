'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../../components/Sidebar';
import NotificationBell from '../../../components/NotificationBell';
import { MessageCircle, Send, Search, Check, CheckCheck } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  timeAgo: string;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export default function CounselorMessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Example logged in user id for demo purposes
  const currentUserId = 'me'; 

  useEffect(() => {
    // Fetch contacts
    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!selectedContact) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?with=${selectedContact.id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedContact]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedContact) return;

    const newMsg = {
      receiverId: selectedContact.id,
      content: inputValue
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
      
      if (res.ok) {
        setInputValue('');
        const msgsRes = await fetch(`/api/messages?with=${selectedContact.id}`);
        if (msgsRes.ok) {
          const data = await msgsRes.json();
          setMessages(data);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content page-transition">
        <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="badge-pill" style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: 'var(--ku-green, #325343)', color: 'white', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 'bold' }}>
            Client Messages
          </div>
          <NotificationBell />
        </div>

        <div className="glass-card" style={{ display: 'flex', height: 'calc(100vh - 150px)', padding: 0, overflow: 'hidden', backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.8))', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.1)' }}>
          {/* Left Panel */}
          <div style={{ width: '320px', borderRight: '1px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input 
                  type="text" 
                  placeholder="Search contacts..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredContacts.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No contacts found</div>
              ) : (
                filteredContacts.map(contact => (
                  <div 
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    style={{ 
                      padding: '1rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      backgroundColor: selectedContact?.id === contact.id ? 'rgba(50, 83, 67, 0.1)' : 'transparent',
                      borderBottom: '1px solid rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--ku-green, #325343)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '1rem' }}>
                      {contact.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{contact.timeAgo}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.lastMessage}</p>
                    </div>
                    {contact.unreadCount > 0 && (
                      <div style={{ marginLeft: '0.5rem', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        {contact.unreadCount}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
            {!selectedContact ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                <MessageCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Select a conversation</h3>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'white', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--ku-green, #325343)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '1rem' }}>
                    {selectedContact.name.charAt(0)}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{selectedContact.name}</h3>
                </div>

                {/* Messages Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {messages.map(msg => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          padding: '0.75rem 1rem',
                          backgroundColor: isOwn ? 'var(--ku-green, #325343)' : 'var(--bg-card, white)',
                          color: isOwn ? 'white' : 'inherit',
                          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          border: isOwn ? 'none' : '1px solid rgba(0,0,0,0.1)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.7rem', color: '#9ca3af' }}>
                          <span>{msg.timestamp}</span>
                          {isOwn && (
                            msg.read ? <CheckCheck size={14} color="#3b82f6" /> : <Check size={14} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div style={{ padding: '1rem', backgroundColor: 'white', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '9999px', border: '1px solid #d1d5db', outline: 'none' }}
                    />
                    <button 
                      type="submit" 
                      disabled={!inputValue.trim()}
                      style={{ 
                        width: '44px', height: '44px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--ku-green, #325343)', 
                        color: 'white', 
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                        opacity: inputValue.trim() ? 1 : 0.5
                      }}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

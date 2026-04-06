'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

type Step = 'initial' | 'specialization' | 'counselor' | 'slot' | 'reason' | 'confirm' | 'success' | 'error';

interface Message {
    id: string;
    text: string;
    sender: 'assistant' | 'user';
    type?: 'suggestion' | 'text';
}

const SPECIALIZATIONS = [
    { id: 'academic', label: 'Academic Support' },
    { id: 'career', label: 'Career Counseling' },
    { id: 'mental_health', label: 'Mental Health & Wellness' },
];

export default function VirtualAssistant() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hello! I'm your Virtual KU Assistant. How can I help you today?", sender: 'assistant' }
    ]);
    const [step, setStep] = useState<Step>('initial');
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [spec, setSpec] = useState('');
    const [counselors, setCounselors] = useState<any[]>([]);
    const [selectedCounselor, setSelectedCounselor] = useState<any>(null);
    const [slots, setSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [reason, setReason] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const addMessage = (text: string, sender: 'assistant' | 'user', type: 'suggestion' | 'text' = 'text') => {
        setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, type }]);
    };

    const handleInitialSupport = () => {
        addMessage("I'd like to schedule a counseling session.", 'user');
        setStep('specialization');
        setTimeout(() => {
            addMessage("Of course! What area would you like to focus on?", 'assistant');
        }, 500);
    };

    const handleSpecSelect = async (s: typeof SPECIALIZATIONS[0]) => {
        setSpec(s.id);
        addMessage(s.label, 'user');
        setLoading(true);
        setStep('counselor');
        
        try {
            const res = await fetch(`/api/counselors?specialization=${s.id}`);
            const data = await res.json();
            setCounselors(data);
            setTimeout(() => {
                addMessage(`Great Choice. I found ${data.length} counselors specializing in ${s.label.toLowerCase()}. Who would you like to meet with?`, 'assistant');
            }, 500);
        } catch (err) {
            addMessage("Sorry, I had trouble finding counselors. Please try again later.", 'assistant');
        } finally {
            setLoading(false);
        }
    };

    const handleCounselorSelect = async (c: any) => {
        setSelectedCounselor(c);
        addMessage(`I'd like to meet with ${c.name}`, 'user');
        setLoading(true);
        setStep('slot');

        try {
            const res = await fetch(`/api/counselors/${c._id}/availability`);
            const data = await res.json();
            setSlots(data);
            setTimeout(() => {
                if (data.length > 0) {
                    addMessage(`Excellent. ${c.name} has several slots available. Please pick a date and time.`, 'assistant');
                } else {
                    addMessage(`${c.name} doesn't have any slots listed right now. Would you like to pick someone else?`, 'assistant');
                    setStep('counselor');
                }
            }, 500);
        } catch (err) {
            addMessage("Sorry, I couldn't fetch the availability. Please try again.", 'assistant');
        } finally {
            setLoading(false);
        }
    };

    const handleSlotSelect = (slotStr: string, date: string) => {
        setSelectedSlot(slotStr);
        setSelectedDate(date);
        addMessage(`I'll take ${date} at ${slotStr}`, 'user');
        setStep('reason');
        setTimeout(() => {
            addMessage("Almost there! Could you briefly tell me the reason for your visit?", 'assistant');
        }, 500);
    };

    const handleReasonSubmit = (r: string) => {
        if (!r.trim()) return;
        setReason(r);
        addMessage(r, 'user');
        setStep('confirm');
        setTimeout(() => {
            addMessage(`Got it. Should I go ahead and book this session with ${selectedCounselor.name} for ${new Date(selectedDate).toDateString()} at ${selectedSlot}?`, 'assistant');
        }, 500);
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const val = (form.elements.namedItem('chatInput') as HTMLInputElement).value;
        if (!val.trim()) return;

        if (step === 'reason') {
            handleReasonSubmit(val);
            form.reset();
            return;
        }

        addMessage(val, 'user');
        form.reset();

        const lower = val.toLowerCase();
        if (lower.includes('schedule') || lower.includes('book') || lower.includes('appointment') || lower.includes('session')) {
             setStep('specialization');
             setTimeout(() => {
                 addMessage("Of course! What area would you like to focus on?", 'assistant');
             }, 500);
        } else if (['hi', 'hello', 'hey'].includes(lower)) {
             setTimeout(() => {
                 addMessage("Hello there! I can help you schedule a counseling session. Just let me know when you're ready.", 'assistant');
             }, 500);
        } else {
             setTimeout(() => {
                 addMessage("I am a virtual assistant designed to help book counseling sessions. You can select an option above or type 'book a session'.", 'assistant');
             }, 500);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    counselorId: selectedCounselor._id,
                    date: selectedDate,
                    timeSlot: selectedSlot,
                    specialization: spec,
                    reason: reason,
                }),
            });
            
            if (res.ok) {
                setStep('success');
                addMessage("Booking confirmed! You'll receive a notification and an email shortly with the details. Anything else I can help with?", 'assistant');
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to book');
            }
        } catch (err: any) {
            addMessage(`Sorry, there was an error: ${err.message}`, 'assistant');
            setStep('confirm');
        } finally {
            setLoading(false);
        }
    };

    if (!session || (session.user as any).role !== 'student') return null;

    return (
        <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000, fontFamily: 'inherit' }}>
            {/* Chat Bubble Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: 'var(--ku-green)', border: 'none',
                    boxShadow: '0 8px 32px rgba(45, 117, 79, 0.3)',
                    color: '#fff', fontSize: '1.8rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="glass fade-up" style={{
                    position: 'absolute', bottom: 80, right: 0,
                    width: '380px', maxHeight: '600px', height: '80vh',
                    borderRadius: 24, display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    {/* Header */}
                    <div style={{ 
                        padding: '20px 24px', background: 'var(--ku-green)', color: '#fff',
                        display: 'flex', alignItems: 'center', gap: 12
                    }}>
                        <div style={{ 
                            width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                        }}>💡</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>KU Virtual Assistant</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Online to help you</div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div style={{ 
                        flex: 1, overflowY: 'auto', padding: 20, 
                        display: 'flex', flexDirection: 'column', gap: 16,
                        background: 'rgba(0,0,0,0.02)'
                    }}>
                        {messages.map(msg => (
                            <div key={msg.id} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%', padding: '12px 16px', borderRadius: 16,
                                fontSize: '0.875rem', lineHeight: 1.5,
                                background: msg.sender === 'user' ? 'var(--ku-green)' : 'rgba(255,255,255,0.05)',
                                color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                                border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                                borderBottomRightRadius: msg.sender === 'user' ? 4 : 16,
                                borderBottomLeftRadius: msg.sender === 'assistant' ? 4 : 16,
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Thinking...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Actions Area */}
                    <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
                        {step === 'initial' && (
                            <button onClick={handleInitialSupport} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                Schedule a Session
                            </button>
                        )}

                        {step === 'specialization' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {SPECIALIZATIONS.map(s => (
                                    <button key={s.id} onClick={() => handleSpecSelect(s)} className="btn-secondary" style={{ textAlign: 'left', display: 'block', width: '100%' }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 'counselor' && !loading && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {counselors.map(c => (
                                    <button key={c._id} onClick={() => handleCounselorSelect(c)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px' }}>
                                        {c.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 'slot' && !loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <input 
                                    type="date" 
                                    className="form-input"
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{ fontSize: '0.8rem' }}
                                />
                                {selectedDate && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: '150px', overflowY: 'auto' }}>
                                        {slots.map((s, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => handleSlotSelect(`${s.startTime}-${s.endTime}`, selectedDate)} 
                                                className="btn-secondary" 
                                                style={{ fontSize: '0.75rem', padding: '6px' }}
                                            >
                                                {s.startTime}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'confirm' && !loading && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handleConfirm} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Confirm</button>
                                <button onClick={() => { setStep('initial'); setMessages([{ id: '1', text: "No problem. Let me know if you change your mind!", sender: 'assistant' }]); }} className="btn-secondary">Cancel</button>
                            </div>
                        )}

                        {step === 'success' && (
                            <button onClick={() => setIsOpen(false)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                Close Chat
                            </button>
                        )}
                    </div>

                    {/* Chat Input Field */}
                    {step !== 'success' && step !== 'confirm' && (
                        <div style={{ padding: '0 20px 20px', background: 'rgba(255,255,255,0.02)' }}>
                            <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 8 }}>
                                <input 
                                    name="chatInput" 
                                    className="form-input" 
                                    placeholder={step === 'reason' ? "Type reason..." : "Type a message..."} 
                                    autoComplete="off" 
                                    autoFocus={step === 'reason'}
                                    style={{ fontSize: '0.85rem', flex: 1 }} 
                                />
                                <button type="submit" className="btn-primary" style={{ padding: '0 12px' }}>Send</button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

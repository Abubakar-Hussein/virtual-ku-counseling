'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

type Step =
    | 'initial'
    | 'specialization'
    | 'counselor'
    | 'slot'
    | 'reason'
    | 'concerns'
    | 'flags'
    | 'confirm'
    | 'success'
    | 'error';

interface Message {
    id: string;
    text: string;
    sender: 'assistant' | 'user';
}

const SPECIALIZATIONS = [
    { id: 'academic', label: 'Academic Support' },
    { id: 'career', label: 'Career Counseling' },
    { id: 'mental_health', label: 'Mental Health & Wellness' },
];

const CONCERN_OPTIONS = [
    'Anxiety', 'Depression', 'Academic Stress',
    'Family Issues', 'Relationship', 'Career Choice',
    'Grief', 'Other'
];

export default function VirtualAssistant() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hello! I'm your KU Wellness Assistant. How can I help you today?", sender: 'assistant' }
    ]);
    const [step, setStep] = useState<Step>('initial');
    const [loading, setLoading] = useState(false);

    // Booking form state
    const [spec, setSpec] = useState('');
    const [counselors, setCounselors] = useState<any[]>([]);
    const [selectedCounselor, setSelectedCounselor] = useState<any>(null);
    const [slots, setSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [reason, setReason] = useState('');
    const [reasonInput, setReasonInput] = useState('');

    // Clinical intake state
    const [concerns, setConcerns] = useState<string[]>([]);
    const [isUrgent, setIsUrgent] = useState(false);
    const [previousTherapy, setPreviousTherapy] = useState(false);
    const [mood, setMood] = useState(5);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, step]);

    const addMessage = (text: string, sender: 'assistant' | 'user') => {
        setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), text, sender }]);
    };

    const delayedAssistant = (text: string, delay = 500) => {
        setTimeout(() => addMessage(text, 'assistant'), delay);
    };

    // ── Step handlers ──────────────────────────────────────────

    const handleInitialSupport = () => {
        addMessage("I'd like to schedule a counseling session.", 'user');
        setStep('specialization');
        delayedAssistant("Of course! What area would you like to focus on?");
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
            delayedAssistant(
                data.length > 0
                    ? `Great choice! I found ${data.length} counselor(s) specialising in ${s.label}. Who would you like to meet with?`
                    : `I couldn't find any counselors for ${s.label} right now. Try another area.`
            );
            if (data.length === 0) setStep('specialization');
        } catch {
            delayedAssistant("Sorry, I had trouble finding counselors. Please try again.");
            setStep('specialization');
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
            delayedAssistant(
                data.length > 0
                    ? `${c.name} is available! Please pick a date, then choose a time slot.`
                    : `${c.name} has no slots listed right now. Would you like to choose someone else?`
            );
            if (data.length === 0) setStep('counselor');
        } catch {
            delayedAssistant("Sorry, I couldn't fetch their availability. Please try again.");
            setStep('counselor');
        } finally {
            setLoading(false);
        }
    };

    const getSlotsForDate = (date: string) => {
        if (!date) return [];
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        return slots.filter(s => s.day?.toLowerCase() === dayName);
    };

    const handleSlotSelect = (slotStr: string) => {
        setSelectedSlot(slotStr);
        addMessage(`I'll take ${selectedDate} at ${slotStr}`, 'user');
        setStep('reason');
        delayedAssistant("Got it! Could you briefly describe the reason for your visit?");
    };

    const handleReasonNext = () => {
        if (!reasonInput.trim()) return;
        setReason(reasonInput.trim());
        addMessage(reasonInput.trim(), 'user');
        setStep('concerns');
        delayedAssistant("Thank you. Are there any specific areas of concern you'd like to address? (Select all that apply, or tap Next to skip.)");
    };

    const toggleConcern = (c: string) => {
        setConcerns(prev =>
            prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
        );
    };

    const handleConcernsNext = () => {
        const label = concerns.length > 0 ? concerns.join(', ') : 'None selected';
        addMessage(label, 'user');
        setStep('flags');
        delayedAssistant("Almost done! Please answer two quick questions so we can best support you.");
    };

    const handleFlagsNext = () => {
        const parts = [];
        if (isUrgent) parts.push('⚠️ Urgent / Crisis Triage');
        if (previousTherapy) parts.push('Has attended counseling before');
        addMessage(parts.length > 0 ? parts.join(' · ') : 'No flags', 'user');
        setStep('confirm');
        delayedAssistant(
            `Here's a summary of your booking:\n\n` +
            `📅 Date: ${new Date(selectedDate).toDateString()}\n` +
            `🕐 Time: ${selectedSlot}\n` +
            `👤 Counselor: ${selectedCounselor?.name}\n` +
            `📋 Focus: ${spec}\n` +
            `💬 Reason: ${reasonInput.trim()}\n` +
            `😊 Mood: ${mood}/10\n` +
            (concerns.length > 0 ? `🏷️ Concerns: ${concerns.join(', ')}\n` : '') +
            (isUrgent ? `⚠️ Flagged as urgent\n` : '') +
            (previousTherapy ? `✅ Previous therapy noted\n` : '') +
            `\nShall I confirm this booking?`
        );
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
                    reason,
                    concerns,
                    mood,
                    isUrgent,
                    previousTherapy,
                }),
            });
            if (res.ok) {
                setStep('success');
                addMessage(
                    "✅ Booking confirmed! You'll receive a notification and an email with the details shortly. Is there anything else I can help with?",
                    'assistant'
                );
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

    const handleReset = () => {
        setStep('initial');
        setSpec('');
        setCounselors([]);
        setSelectedCounselor(null);
        setSlots([]);
        setSelectedSlot('');
        setSelectedDate('');
        setReason('');
        setReasonInput('');
        setConcerns([]);
        setMood(5);
        setIsUrgent(false);
        setPreviousTherapy(false);
        setMessages([{ id: '1', text: "Hello! I'm your KU Wellness Assistant. How can I help you today?", sender: 'assistant' }]);
    };

    const handleTextSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const val = (form.elements.namedItem('chatInput') as HTMLInputElement).value.trim();
        if (!val) return;
        form.reset();

        const newMessages = [...messages, { id: Date.now().toString(), text: val, sender: 'user' as const }];
        setMessages(newMessages);
        setLoading(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages }),
            });
            if (res.ok) {
                const data = await res.json();
                let reply = data.reply || "I didn't quite catch that.";
                const bookingTrigger = '[ACTION:BOOK_SESSION]';
                if (reply.includes(bookingTrigger)) {
                    reply = reply.replace(bookingTrigger, '').trim();
                    if (reply) addMessage(reply, 'assistant');
                    setStep('specialization');
                    delayedAssistant("What area would you like to focus on?");
                } else {
                    addMessage(reply, 'assistant');
                }
            } else throw new Error('API failed');
        } catch {
            addMessage("I'm sorry, my AI backend is unreachable at the moment.", 'assistant');
        } finally {
            setLoading(false);
        }
    };

    if (!session || (session.user as any).role !== 'student') return null;

    const daySlots = getSlotsForDate(selectedDate);
    const showTextInput = step === 'initial' || step === 'success';

    return (
        <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000, fontFamily: 'inherit' }}>
            {/* Bubble */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: 65, height: 65, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                    border: 'none', boxShadow: '0 8px 32px rgba(45,117,79,0.4)',
                    color: '#fff', fontSize: '2rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                    animation: !isOpen ? 'pulse-green 2s infinite' : 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0)'}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {isOpen && (
                <div className="glass fade-up" style={{
                    position: 'absolute', bottom: 90, right: 0,
                    width: 'calc(100vw - 40px)', maxWidth: 420, maxHeight: 680, height: '85vh',
                    borderRadius: 24, display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-main)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '20px 24px',
                        background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                        color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0
                        }}>🧠</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>KU Virtual Assistant</div>
                            <div style={{ fontSize: '0.78rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 7, height: 7, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
                                Online to help you
                            </div>
                        </div>
                        {step !== 'initial' && step !== 'success' && (
                            <button onClick={handleReset} style={{
                                background: 'rgba(255,255,255,0.15)', border: 'none',
                                borderRadius: 8, padding: '4px 10px', color: '#fff',
                                fontSize: '0.72rem', cursor: 'pointer'
                            }}>↩ Restart</button>
                        )}
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: '20px 16px',
                        display: 'flex', flexDirection: 'column', gap: 16,
                    }}>
                        {messages.map(msg => (
                            <div key={msg.id} className="fade-up" style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%', padding: '12px 16px', borderRadius: 18,
                                fontSize: '0.88rem', lineHeight: 1.6,
                                background: msg.sender === 'user'
                                    ? 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))'
                                    : 'var(--bg-card)',
                                color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                                border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                                borderBottomRightRadius: msg.sender === 'user' ? 4 : 18,
                                borderBottomLeftRadius: msg.sender === 'assistant' ? 4 : 18,
                                whiteSpace: 'pre-wrap', overflowWrap: 'break-word'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div className="typing-indicator" style={{ alignSelf: 'flex-start' }}>
                                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* ── Action Panels ── */}
                    <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 8 }}>

                        {/* INITIAL */}
                        {step === 'initial' && (
                            <button onClick={handleInitialSupport} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                📅 Schedule a Session
                            </button>
                        )}

                        {/* SPECIALIZATION */}
                        {step === 'specialization' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {SPECIALIZATIONS.map(s => (
                                    <button key={s.id} onClick={() => handleSpecSelect(s)} className="btn-secondary" style={{ textAlign: 'left', width: '100%' }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* COUNSELOR */}
                        {step === 'counselor' && !loading && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                                {counselors.map(c => (
                                    <button key={c._id} onClick={() => handleCounselorSelect(c)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 6px' }}>
                                        {c.name.split(' ').slice(0, 2).join(' ')}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* SLOT — date picker + day-filtered slots */}
                        {step === 'slot' && !loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input
                                    type="date"
                                    className="form-input"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    style={{ fontSize: '0.85rem' }}
                                />
                                {selectedDate && daySlots.length === 0 && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        No slots available on this day. Try another date.
                                    </p>
                                )}
                                {daySlots.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 130, overflowY: 'auto' }}>
                                        {daySlots.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSlotSelect(`${s.startTime}-${s.endTime}`)}
                                                className="btn-secondary"
                                                style={{ fontSize: '0.78rem', padding: '7px 4px' }}
                                            >
                                                {s.startTime} – {s.endTime}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* REASON */}
                        {step === 'reason' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Briefly describe why you're seeking counseling..."
                                    value={reasonInput}
                                    onChange={e => setReasonInput(e.target.value)}
                                    style={{ fontSize: '0.85rem', resize: 'none' }}
                                />
                                <button
                                    onClick={handleReasonNext}
                                    disabled={!reasonInput.trim()}
                                    className="btn-primary"
                                    style={{ justifyContent: 'center', opacity: reasonInput.trim() ? 1 : 0.5 }}
                                >
                                    Next →
                                </button>
                            </div>
                        )}

                        {/* CONCERNS & MOOD */}
                        {step === 'concerns' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Current Mood (1-10)</label>
                                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ku-green-light)' }}>{mood}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="10" value={mood}
                                        onChange={e => setMood(parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--ku-green)', cursor: 'pointer', height: '6px', borderRadius: '3px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {CONCERN_OPTIONS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => toggleConcern(c)}
                                            style={{
                                                padding: '5px 11px', borderRadius: 20, fontSize: '0.78rem',
                                                border: `1px solid ${concerns.includes(c) ? 'var(--ku-green-light)' : 'rgba(255,255,255,0.12)'}`,
                                                background: concerns.includes(c) ? 'rgba(0,102,51,0.15)' : 'transparent',
                                                color: concerns.includes(c) ? 'var(--ku-green-light)' : 'var(--text-secondary)',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleConcernsNext} className="btn-primary" style={{ justifyContent: 'center' }}>
                                    Next →
                                </button>
                            </div>
                        )}

                        {/* FLAGS */}
                        {step === 'flags' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: isUrgent ? 'rgba(239,68,68,0.08)' : 'transparent' }}>
                                    <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
                                    <span>⚠️ I need to see someone urgently (Crisis Triage)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: previousTherapy ? 'rgba(0,102,51,0.08)' : 'transparent' }}>
                                    <input type="checkbox" checked={previousTherapy} onChange={e => setPreviousTherapy(e.target.checked)} />
                                    <span>✅ I have attended counseling before</span>
                                </label>
                                <button onClick={handleFlagsNext} className="btn-primary" style={{ justifyContent: 'center' }}>
                                    Review & Confirm →
                                </button>
                            </div>
                        )}

                        {/* CONFIRM */}
                        {step === 'confirm' && !loading && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handleConfirm} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                    ✓ Confirm Booking
                                </button>
                                <button onClick={handleReset} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* SUCCESS */}
                        {step === 'success' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handleReset} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                    Book Another
                                </button>
                                <button onClick={() => setIsOpen(false)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                    Close
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Free-text input — only visible for general chat */}
                    {showTextInput && (
                        <div style={{ padding: '0 16px 18px', background: 'var(--bg-main)' }}>
                            <form onSubmit={handleTextSubmit} style={{
                                display: 'flex', gap: 8, background: 'var(--bg-card)',
                                padding: 6, borderRadius: 30, border: '1px solid var(--border)',
                            }}>
                                <input
                                    name="chatInput"
                                    placeholder="Message KU Assistant..."
                                    autoComplete="off"
                                    style={{
                                        flex: 1, border: 'none', background: 'transparent',
                                        padding: '9px 14px', fontSize: '0.9rem', outline: 'none',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <button type="submit" style={{
                                    background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                                    border: 'none', borderRadius: '50%', width: 40, height: 40,
                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'transform 0.2s',
                                    boxShadow: '0 4px 12px rgba(0,102,51,0.3)'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >➤</button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

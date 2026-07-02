'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar';
import RatingModal from './RatingModal';
import { Check, X, Mail, Star, Clock, User, AlertTriangle, MessageSquare } from 'lucide-react';

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string; strip: string }> = {
    pending:   { bg: 'rgba(245,158,11,0.08)',  color: '#b45309',        border: 'rgba(245,158,11,0.25)', label: 'Pending',   strip: '#f59e0b' },
    confirmed: { bg: 'rgba(50,83,67,0.08)',    color: 'var(--ku-green)',border: 'rgba(50,83,67,0.2)',   label: 'Confirmed', strip: 'var(--ku-green)' },
    completed: { bg: 'rgba(50,83,67,0.06)',    color: 'var(--ku-green)',border: 'rgba(50,83,67,0.15)',  label: 'Completed', strip: 'var(--ku-green)' },
    cancelled: { bg: 'rgba(239,68,68,0.07)',   color: '#dc2626',        border: 'rgba(239,68,68,0.2)',  label: 'Cancelled', strip: '#ef4444' },
};

const SPEC_LABELS: Record<string, string> = {
    academic: 'Academic', career: 'Career', mental_health: 'Mental Health',
};

export default function AppointmentCard({
    appointment,
    viewerRole,
    onStatusChange,
    onCancel,
}: {
    appointment: any;
    viewerRole: 'student' | 'counselor' | 'admin';
    onStatusChange?: (id: string, status: string) => void;
    onCancel?: (id: string) => void;
}) {
    const router = useRouter();
    const { _id, date, timeSlot, specialization, status, reason, studentId, counselorId, intake, rating: initialRating } = appointment;

    const [hasRated, setHasRated] = useState<boolean>(!!initialRating);
    const [ratingVal, setRatingVal] = useState<number>(initialRating || 0);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [ratingError, setRatingError] = useState('');

    const participant = viewerRole === 'student' ? counselorId : studentId;
    const participantLabel = viewerRole === 'student' ? 'Counselor' : 'Student';
    const st = STATUS_STYLE[status] ?? STATUS_STYLE.pending;

    const handleRateSubmit = async (rating: number, feedback: string) => {
        setRatingError('');
        const res = await fetch(`/api/appointments/${_id}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, feedback }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const msg = data?.error || 'Failed to submit rating. Please try again.';
            setRatingError(msg);
            throw new Error(msg);
        }
        setHasRated(true);
        setRatingVal(rating);
        setIsRatingModalOpen(false);
    };

    const formattedDate = new Date(date).toLocaleDateString('en-KE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${st.strip}`,
            borderRadius: 14,
            overflow: 'hidden',
            transition: 'box-shadow 0.2s, transform 0.2s',
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(50,83,67,0.08)';
                (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
        >
            {/* Main content */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Top row: date/participant + status badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Avatar
                            name={participant?.name || participantLabel}
                            src={participant?.profileImage}
                            size={44}
                        />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.975rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                                {formattedDate}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} strokeWidth={2} style={{ opacity: 0.7 }} />
                                    {timeSlot}
                                </span>
                                <span style={{ color: 'var(--border)' }}>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <User size={12} strokeWidth={2} style={{ opacity: 0.7 }} />
                                    {participantLabel}: <strong style={{ color: 'var(--text-primary)', marginLeft: 3 }}>{participant?.name || 'N/A'}</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                        fontSize: '0.68rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                        letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
                    }}>
                        {st.label}
                    </span>
                </div>

                {/* Tags row */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {specialization && (
                        <span style={{
                            fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                            background: 'rgba(50,83,67,0.07)', color: 'var(--ku-green)',
                            border: '1px solid rgba(50,83,67,0.15)', textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            {SPEC_LABELS[specialization] ?? specialization.replace('_', ' ')}
                        </span>
                    )}
                    {intake?.isUrgent && (
                        <span style={{
                            fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                            background: 'rgba(239,68,68,0.08)', color: '#dc2626',
                            border: '1px solid rgba(239,68,68,0.2)',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <AlertTriangle size={10} strokeWidth={2.5} /> Crisis Triage
                        </span>
                    )}
                    {intake && (
                        <span style={{
                            fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20,
                            background: 'var(--bg-main)', color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                        }}>
                            Mood: {intake.mood}/10
                        </span>
                    )}
                </div>

                {/* Concern tags */}
                {intake?.concerns?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {intake.concerns.map((c: string) => (
                            <span key={c} style={{
                                fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10,
                                background: 'rgba(50,83,67,0.04)', color: 'var(--ku-green)',
                                border: '1px solid rgba(50,83,67,0.12)',
                            }}>
                                #{c}
                            </span>
                        ))}
                    </div>
                )}

                {/* Reason */}
                {reason && (
                    <div style={{
                        fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55,
                        borderTop: '1px solid var(--border)', paddingTop: 12,
                        display: 'flex', gap: 6, alignItems: 'flex-start',
                    }}>
                        <MessageSquare size={13} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                        <span><strong style={{ color: 'var(--text-primary)' }}>Reason:</strong> {reason}</span>
                    </div>
                )}
            </div>

            {/* Action footer */}
            {(
                (viewerRole === 'counselor' && (status === 'pending' || status === 'confirmed' || status === 'completed')) ||
                (viewerRole === 'student' && (status === 'pending' || status === 'completed'))
            ) && (
                <div style={{
                    padding: '12px 24px',
                    borderTop: '1px solid var(--border)',
                    background: 'rgba(50,83,67,0.02)',
                    display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
                }}>
                    {/* Counselor: pending */}
                    {viewerRole === 'counselor' && status === 'pending' && onStatusChange && (<>
                        <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => onStatusChange(_id, 'confirmed')}>
                            <Check size={14} strokeWidth={3} /> Accept
                        </button>
                        <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => onStatusChange(_id, 'cancelled')}>
                            <X size={14} strokeWidth={3} /> Decline
                        </button>
                    </>)}

                    {/* Counselor: confirmed */}
                    {viewerRole === 'counselor' && status === 'confirmed' && onStatusChange && (
                        <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => onStatusChange(_id, 'completed')}>
                            <Check size={14} strokeWidth={3} /> Mark Completed
                        </button>
                    )}

                    {/* Counselor: completed/confirmed workspace + contact */}
                    {viewerRole === 'counselor' && (status === 'completed' || status === 'confirmed') && (<>
                        <button style={{
                            padding: '7px 16px', fontSize: '0.82rem', borderRadius: 10,
                            border: '1px solid rgba(50,83,67,0.3)', background: 'rgba(50,83,67,0.06)',
                            color: 'var(--ku-green)', fontWeight: 600, cursor: 'pointer',
                        }} onClick={() => router.push(`/counselor/appointments/${_id}`)}>
                            Clinical Workspace
                        </button>
                        <a href={`https://mail.google.com/mail/?view=cm&to=${studentId?.email}`} target="_blank" rel="noopener noreferrer"
                            style={{
                                padding: '7px 14px', fontSize: '0.82rem', borderRadius: 10,
                                border: '1px solid var(--border)', background: 'transparent',
                                color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                            }}>
                            <Mail size={13} /> Contact
                        </a>
                    </>)}

                    {/* Student: pending cancel */}
                    {viewerRole === 'student' && status === 'pending' && onCancel && (
                        <button className="btn-danger" style={{ fontSize: '0.82rem' }} onClick={() => onCancel(_id)}>
                            Cancel Appointment
                        </button>
                    )}

                    {/* Student: completed rating */}
                    {viewerRole === 'student' && status === 'completed' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                            {hasRated ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Your Rating:</span>
                                    <div style={{ display: 'flex', gap: 2 }}>
                                        {[1,2,3,4,5].map(star => (
                                            <Star key={star} size={15}
                                                fill={star <= ratingVal ? '#f59e0b' : 'none'}
                                                stroke={star <= ratingVal ? '#f59e0b' : 'var(--border)'}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Session completed.</span>
                                    <button
                                        style={{
                                            padding: '6px 14px', fontSize: '0.8rem', borderRadius: 10,
                                            background: 'rgba(50,83,67,0.08)', border: '1px solid rgba(50,83,67,0.2)',
                                            color: 'var(--ku-green)', fontWeight: 700, cursor: 'pointer',
                                        }}
                                        onClick={() => { setRatingError(''); setIsRatingModalOpen(true); }}
                                    >
                                        Leave Feedback
                                    </button>
                                </div>
                            )}
                            {ratingError && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{ratingError}</span>}
                        </div>
                    )}
                </div>
            )}

            <RatingModal
                open={isRatingModalOpen}
                counselorName={participant?.name}
                onClose={() => setIsRatingModalOpen(false)}
                onSubmit={handleRateSubmit}
            />
        </div>
    );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar';
import RatingModal from './RatingModal';

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
    
    // Use initialRating locally if provided, otherwise check state
    const [hasRated, setHasRated] = useState<boolean>(!!initialRating);
    const [ratingVal, setRatingVal] = useState<number>(initialRating || 0);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [ratingError, setRatingError] = useState('');

    const statusBadge = (s: string) => {
        const cls = {
            pending: 'badge-pending',
            confirmed: 'badge-confirmed',
            cancelled: 'badge-cancelled',
            completed: 'badge-completed',
        }[s] ?? '';
        return <span className={`badge ${cls}`}>{s}</span>;
    };

    const participant = viewerRole === 'student' ? counselorId : studentId;
    const participantLabel = viewerRole === 'student' ? 'Counselor' : 'Student';

    const handleRateSubmit = async (rating: number, feedback: string) => {
        setRatingError('');
        const res = await fetch(`/api/appointments/${_id}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, feedback })
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

    return (
        <div className="glass" style={{
            padding: '20px 24px', borderRadius: 14,
            display: 'flex', flexDirection: 'column', gap: 10,
            borderLeft: `3px solid ${status === 'confirmed' ? 'var(--ku-green-light)' :
                    status === 'pending' ? '#facc15' :
                        status === 'cancelled' ? '#f87171' : '#a5b4fc'
                }`,
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Avatar 
                        name={participant?.name || participantLabel} 
                        src={participant?.profileImage} 
                        size={32} 
                        fontSize="0.75rem"
                    />
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                            {new Date(date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span>🕐 {timeSlot}</span>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span>{participantLabel}: <strong style={{ color: 'var(--text-secondary)' }}>{participant?.name || 'N/A'}</strong></span>
                        </div>
                    </div>
                </div>
                {statusBadge(status)}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                <span className={`badge spec-${specialization}`}>{specialization.replace('_', ' ')}</span>
                {intake?.isUrgent && (
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700 }}>⚠️ CRISIS TRIAGE</span>
                )}
                {intake && (
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>Mood Score: {intake.mood}/10</span>
                )}
            </div>

            {intake?.concerns && intake.concerns.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {intake.concerns.map((c: string) => (
                        <span key={c} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, background: 'rgba(0,102,51,0.05)', color: 'var(--ku-green-light)', border: '1px solid rgba(0,102,51,0.2)' }}>
                            #{c}
                        </span>
                    ))}
                </div>
            )}

            {reason && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <strong style={{ color: 'var(--text-muted)' }}>Reason: </strong>{reason}
                </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {viewerRole === 'counselor' && status === 'pending' && onStatusChange && (
                    <>
                        <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}
                            onClick={() => onStatusChange(_id, 'confirmed')}>
                            ✓ Accept
                        </button>
                        <button className="btn-danger"
                            onClick={() => onStatusChange(_id, 'cancelled')}>
                            ✕ Decline
                        </button>
                    </>
                )}
                {viewerRole === 'counselor' && status === 'confirmed' && onStatusChange && (
                    <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}
                        onClick={() => onStatusChange(_id, 'completed')}>
                        ✓ Mark Completed
                    </button>
                )}
                {viewerRole === 'counselor' && (status === 'completed' || status === 'confirmed') && (
                    <>
                        <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem', background: 'transparent', border: '1px solid var(--ku-green-light)', color: 'var(--ku-green-light)' }}
                            onClick={() => router.push(`/counselor/appointments/${_id}`)}>
                            📋 Clinical Workspace
                        </button>
                        <a href={`https://mail.google.com/mail/?view=cm&to=${studentId?.email}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '7px 16px', fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                            📧 Contact
                        </a>
                    </>
                )}
                {viewerRole === 'student' && status === 'pending' && onCancel && (
                    <button className="btn-danger" onClick={() => onCancel(_id)}>
                        Cancel
                    </button>
                )}
                {viewerRole === 'student' && status === 'completed' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                            {hasRated ? (
                                <>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Your Rating:</span>
                                    <div style={{ display: 'flex', gap: 2 }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} style={{ fontSize: '1.2rem', color: star <= ratingVal ? '#facc15' : 'rgba(255,255,255,0.2)' }}>★</span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Session completed.</span>
                                    <button 
                                        className="btn-primary"
                                        style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                        onClick={() => { setRatingError(''); setIsRatingModalOpen(true); }}
                                    >
                                        Leave Feedback
                                    </button>
                                </>
                            )}
                        </div>
                        {ratingError && (
                            <span style={{ fontSize: '0.78rem', color: '#f87171', paddingLeft: 4 }}>{ratingError}</span>
                        )}
                    </div>
                )}
            </div>

            <RatingModal 
                open={isRatingModalOpen}
                counselorName={participant?.name}
                onClose={() => setIsRatingModalOpen(false)}
                onSubmit={handleRateSubmit}
            />
        </div>
    );
}

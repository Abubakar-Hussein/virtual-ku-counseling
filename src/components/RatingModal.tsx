'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Professional rating and feedback modal for completed counseling sessions.
 */
export default function RatingModal({
    open,
    counselorName = 'your counselor',
    onClose,
    onSubmit,
}: {
    open: boolean;
    counselorName?: string;
    onClose: () => void;
    onSubmit: (rating: number, feedback: string) => Promise<void>;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const commonTags = [
        "Great listener",
        "Helpful insights",
        "Felt heard",
        "Actionable advice",
        "Comfortable environment",
        "Compassionate"
    ];

    // Reset all state when modal opens so stale selections don't carry over
    useEffect(() => {
        if (open) {
            setRating(0);
            setHoverRating(0);
            setFeedbackText('');
            setSelectedTags([]);
            setSubmitError('');
        }
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const tagsString = selectedTags.length > 0 ? `[Tags: ${selectedTags.join(', ')}] ` : '';
            const finalFeedback = `${tagsString}${feedbackText}`.trim();
            await onSubmit(rating, finalFeedback);
        } catch (err: any) {
            setSubmitError(err?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            ref={overlayRef}
            className="modal-overlay"
            onClick={e => { if (e.target === overlayRef.current) onClose(); }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animation: 'modalFadeIn 0.2s ease',
                padding: 20,
            }}
        >
            <div
                className="glass"
                style={{
                    width: '100%',
                    maxWidth: 480,
                    padding: '32px',
                    borderRadius: 20,
                    animation: 'modalSlideUp 0.25s ease',
                    border: `1px solid var(--border)`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                }}
            >
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Rate Your Session
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        How was your session with {counselorName}?
                    </p>
                </div>

                {/* Star Rating */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '10px 0' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '2.5rem',
                                color: star <= (hoverRating || rating) ? '#facc15' : 'var(--border)',
                                transition: 'color 0.2s, transform 0.1s',
                                transform: star <= hoverRating ? 'scale(1.1)' : 'scale(1)',
                            }}
                        >
                            ★
                        </button>
                    ))}
                </div>

                {/* Feedback Tags */}
                {rating > 0 && (
                    <div style={{ animation: 'modalFadeIn 0.3s ease' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 600 }}>
                            What went well? (Optional)
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {commonTags.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 20,
                                            fontSize: '0.8rem',
                                            border: `1px solid ${isSelected ? 'var(--ku-green-light)' : 'var(--border)'}`,
                                            background: isSelected ? 'rgba(0,136,68,0.15)' : 'transparent',
                                            color: isSelected ? 'var(--ku-green-light)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Text Feedback */}
                {rating > 0 && (
                    <div style={{ animation: 'modalFadeIn 0.4s ease' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                            Additional Feedback (Optional)
                        </p>
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Share more about your experience..."
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                borderRadius: 12,
                                padding: 12,
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>
                )}

                {/* Error message */}
                {submitError && (
                    <p style={{ fontSize: '0.82rem', color: '#f87171', textAlign: 'center', marginTop: -8 }}>
                        {submitError}
                    </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '12px 20px' }}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            borderRadius: 10,
                            border: 'none',
                            background: rating > 0 ? 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))' : 'var(--border)',
                            color: rating > 0 ? '#fff' : 'var(--text-muted)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: rating > 0 ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            opacity: isSubmitting ? 0.7 : 1,
                        }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </div>
            </div>
        </div>
    );
}

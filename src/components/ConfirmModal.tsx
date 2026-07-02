'use client';
import { useEffect, useRef } from 'react';
import { AlertTriangle, HelpCircle, Check } from 'lucide-react';

/**
 * Glassmorphism confirmation modal to replace browser confirm() dialogs.
 */
export default function ConfirmModal({
    open,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onCancel]);

    if (!open) return null;

    const colors = {
        danger: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', color: '#f87171', btnBg: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
        primary: { bg: 'rgba(0,136,68,0.15)', border: 'rgba(0,136,68,0.3)', color: 'var(--ku-green-light)', btnBg: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))' },
        warning: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', color: '#facc15', btnBg: 'linear-gradient(135deg, #eab308, #ca8a04)' },
    }[variant];

    return (
        <div
            ref={overlayRef}
            className="modal-overlay"
            onClick={e => { if (e.target === overlayRef.current) onCancel(); }}
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
                    maxWidth: 420,
                    padding: '32px',
                    borderRadius: 20,
                    animation: 'modalSlideUp 0.25s ease',
                    border: `1px solid ${colors.border}`,
                }}
            >
                {/* Icon */}
                <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: colors.bg,
                    border: `1.5px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    {variant === 'danger' ? (
                        <AlertTriangle size={20} strokeWidth={2.5} style={{ color: colors.color }} />
                    ) : variant === 'warning' ? (
                        <HelpCircle size={20} strokeWidth={2.5} style={{ color: colors.color }} />
                    ) : (
                        <Check size={20} strokeWidth={2.5} style={{ color: colors.color }} />
                    )}
                </div>

                {/* Title */}
                <h3 style={{
                    textAlign: 'center',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    marginBottom: 8,
                    color: 'var(--text-primary)',
                }}>
                    {title}
                </h3>

                {/* Message */}
                <p style={{
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: 28,
                }}>
                    {message}
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={onCancel}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center', padding: '12px 20px' }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px 20px',
                            borderRadius: 10,
                            border: 'none',
                            background: colors.btnBg,
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

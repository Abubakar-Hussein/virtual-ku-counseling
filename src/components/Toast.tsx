'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    exiting?: boolean;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const TOAST_ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; color: string; iconBg: string }> = {
    success: {
        bg: 'rgba(34, 197, 94, 0.12)',
        border: 'rgba(34, 197, 94, 0.3)',
        color: '#4ade80',
        iconBg: 'rgba(34, 197, 94, 0.25)',
    },
    error: {
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.3)',
        color: '#f87171',
        iconBg: 'rgba(239, 68, 68, 0.25)',
    },
    warning: {
        bg: 'rgba(234, 179, 8, 0.12)',
        border: 'rgba(234, 179, 8, 0.3)',
        color: '#facc15',
        iconBg: 'rgba(234, 179, 8, 0.25)',
    },
    info: {
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.3)',
        color: '#60a5fa',
        iconBg: 'rgba(59, 130, 246, 0.25)',
    },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const colors = TOAST_COLORS[toast.type];

    return (
        <div
            className={toast.exiting ? 'toast-exit' : 'toast-enter'}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 20px',
                borderRadius: 14,
                background: colors.bg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                minWidth: 300,
                maxWidth: 420,
                cursor: 'pointer',
            }}
            onClick={() => onRemove(toast.id)}
        >
            <div
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: colors.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: colors.color,
                    flexShrink: 0,
                }}
            >
                {TOAST_ICONS[toast.type]}
            </div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                {toast.message}
            </span>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.map(t => (t.id === id ? { ...t, exiting: true } : t)));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id = Date.now().toString() + Math.random().toString(36).slice(2);
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => removeToast(id), 5000);
        },
        [removeToast]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast container */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    gap: 10,
                    pointerEvents: 'none',
                }}
            >
                {toasts.map(toast => (
                    <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                        <ToastItem toast={toast} onRemove={removeToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

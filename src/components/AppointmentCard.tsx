'use client';

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
    const { _id, date, timeSlot, specialization, status, reason, studentId, counselorId } = appointment;

    const statusBadge = (s: string) => {
        const cls = {
            pending: 'badge-pending',
            confirmed: 'badge-confirmed',
            cancelled: 'badge-cancelled',
            completed: 'badge-completed',
        }[s] ?? '';
        return <span className={`badge ${cls}`}>{s}</span>;
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
                <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        {new Date(date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🕐 {timeSlot}</div>
                </div>
                {statusBadge(status)}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`badge spec-${specialization}`}>{specialization.replace('_', ' ')}</span>
                {viewerRole !== 'student' && studentId && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        👤 {studentId.name ?? 'Student'}
                    </span>
                )}
                {viewerRole === 'student' && counselorId && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        🧑‍⚕️ {counselorId.name ?? 'Counselor'}
                    </span>
                )}
            </div>

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
                {viewerRole === 'student' && status === 'pending' && onCancel && (
                    <button className="btn-danger" onClick={() => onCancel(_id)}>
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

import Link from 'next/link';
import Avatar from './Avatar';
import { Star, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

const SPEC_LABELS: Record<string, string> = {
    academic: 'Academic',
    career: 'Career',
    mental_health: 'Mental Health',
};

const SPEC_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    academic:     { bg: 'rgba(50,83,67,0.07)',  color: 'var(--ku-green)',  border: 'rgba(50,83,67,0.18)' },
    career:       { bg: 'rgba(50,83,67,0.07)',  color: 'var(--ku-green)',  border: 'rgba(50,83,67,0.18)' },
    mental_health:{ bg: 'rgba(50,83,67,0.07)',  color: 'var(--ku-green)',  border: 'rgba(50,83,67,0.18)' },
};

export default function CounselorCard({ counselor }: { counselor: any }) {
    const profile = counselor.profile;
    const specs: string[] = profile?.specializations ?? [];
    const rating = profile?.averageRating ?? 0;
    const totalRatings = profile?.totalRatings ?? 0;
    const slots = profile?.availableSlots?.length ?? 0;
    const isAvailable = slots > 0;

    return (
        <div
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = '0 12px 40px rgba(50,83,67,0.10)';
                el.style.transform = 'translateY(-3px)';
                el.style.borderColor = 'rgba(50,83,67,0.3)';
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = 'none';
                el.style.transform = 'none';
                el.style.borderColor = 'var(--border)';
            }}
        >
            {/* Availability indicator strip */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: isAvailable ? 'var(--ku-green)' : 'var(--border)',
                borderRadius: '18px 18px 0 0',
            }} />

            {/* Avatar + name row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingTop: 4 }}>
                <Avatar
                    name={counselor.name}
                    src={profile?.profileImage}
                    size={56}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {counselor.name}
                    </div>

                    {/* Rating row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {rating > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                {[1,2,3,4,5].map(i => (
                                    <Star key={i} size={11}
                                        fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
                                        stroke={i <= Math.round(rating) ? '#f59e0b' : 'var(--border)'}
                                    />
                                ))}
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: 2 }}>{rating}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({totalRatings})</span>
                            </div>
                        ) : (
                            <span style={{
                                fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                                background: 'rgba(50,83,67,0.07)', color: 'var(--ku-green)',
                                border: '1px solid rgba(50,83,67,0.15)',
                            }}>New</span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>• KU Counselor</span>
                    </div>
                </div>

                {/* Availability badge top-right */}
                {isAvailable && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'rgba(50,83,67,0.08)', border: '1px solid rgba(50,83,67,0.15)',
                        borderRadius: 20, padding: '3px 10px',
                        fontSize: '0.67rem', fontWeight: 700, color: 'var(--ku-green)',
                        flexShrink: 0,
                    }}>
                        <CheckCircle2 size={10} strokeWidth={2.5} />
                        Available
                    </div>
                )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '0 -4px' }} />

            {/* Bio */}
            {profile?.bio ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, flexGrow: 1 }}>
                    {profile.bio.slice(0, 110)}{profile.bio.length > 110 ? '…' : ''}
                </p>
            ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, flexGrow: 1 }}>
                    No bio added yet.
                </p>
            )}

            {/* Specialization pills */}
            {specs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {specs.map((s) => {
                        const c = SPEC_COLORS[s] ?? SPEC_COLORS['academic'];
                        return (
                            <span key={s} style={{
                                fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
                                borderRadius: 20, border: `1px solid ${c.border}`,
                                background: c.bg, color: c.color,
                                letterSpacing: '0.03em', textTransform: 'uppercase',
                            }}>
                                {SPEC_LABELS[s] ?? s}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Slots */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: '0.8rem',
                color: isAvailable ? 'var(--ku-green)' : 'var(--text-muted)',
                fontWeight: isAvailable ? 600 : 400,
            }}>
                <Calendar size={13} strokeWidth={2} />
                {isAvailable
                    ? `${slots} time slot${slots > 1 ? 's' : ''} available`
                    : 'No availability set'}
            </div>

            {/* Book button */}
            <Link
                href={`/student/book/${counselor._id}`}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: isAvailable ? 'var(--ku-green)' : 'var(--border)',
                    color: isAvailable ? '#fff' : 'var(--text-muted)',
                    padding: '13px 20px', borderRadius: 12,
                    fontWeight: 700, fontSize: '0.9rem',
                    textDecoration: 'none',
                    transition: 'opacity 0.2s',
                    pointerEvents: isAvailable ? 'auto' : 'none',
                    opacity: isAvailable ? 1 : 0.5,
                    marginTop: 4,
                }}
                onMouseEnter={e => { if (isAvailable) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={e => { if (isAvailable) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
                Book Session
                <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
        </div>
    );
}

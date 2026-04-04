import Link from 'next/link';

const SPEC_LABELS: Record<string, string> = {
    academic: 'Academic',
    career: 'Career',
    mental_health: 'Mental Health',
};

export default function CounselorCard({ counselor }: { counselor: any }) {
    const profile = counselor.profile;
    const specs: string[] = profile?.specializations ?? [];

    return (
        <div className="glass" style={{
            padding: 24, borderRadius: 16,
            display: 'flex', flexDirection: 'column', gap: 14,
            transition: 'all 0.2s',
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--ku-green-light)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.transform = '';
            }}>
            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--ku-green), var(--ku-green-light))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', flexShrink: 0,
                }}>
                    {counselor.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {counselor.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>KU Counselor</div>
                </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {profile.bio.slice(0, 120)}{profile.bio.length > 120 ? '…' : ''}
                </p>
            )}

            {/* Specializations */}
            {specs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {specs.map((s) => (
                        <span key={s} className={`badge spec-${s}`}>{SPEC_LABELS[s] ?? s}</span>
                    ))}
                </div>
            )}

            {/* Availability */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📅</span>
                {profile?.availableSlots?.length > 0
                    ? `${profile.availableSlots.length} time slot${profile.availableSlots.length > 1 ? 's' : ''} available`
                    : 'No availability set'}
            </div>

            {/* Book button */}
            <Link href={`/student/book/${counselor._id}`} className="btn-primary" style={{
                textDecoration: 'none', textAlign: 'center', marginTop: 'auto',
            }}>
                Book Session
            </Link>
        </div>
    );
}

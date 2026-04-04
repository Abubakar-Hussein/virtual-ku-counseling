interface StatsCardProps {
    label: string;
    value: string | number;
    icon: string;
    color?: string;
    trend?: string;
}

export default function StatsCard({ label, value, icon, color = 'var(--ku-green)', trend }: StatsCardProps) {
    return (
        <div className="glass fade-up" style={{
            padding: '24px',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.3)`;
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${color}22`,
                border: `1px solid ${color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
            }}>
                {icon}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {value}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {label}
            </div>
            {trend && (
                <div style={{ fontSize: '0.75rem', color: 'var(--ku-green-light)', fontWeight: 500 }}>
                    {trend}
                </div>
            )}
        </div>
    );
}

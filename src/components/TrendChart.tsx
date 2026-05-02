'use client';

interface TrendData {
    date: string;
    count: number;
}

interface TrendChartProps {
    data: TrendData[];
    height?: number;
    color?: string;
}

export default function TrendChart({ data, height = 80, color = 'var(--ku-green)' }: TrendChartProps) {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data.map(d => d.count), 1);
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (d.count / max) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div style={{ width: '100%', height, position: 'relative' }}>
            <svg 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none" 
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
                {/* Area under the line */}
                <polyline
                    fill={`${color}20`}
                    stroke="none"
                    points={`0,100 ${points} 100,100`}
                />
                {/* The trend line */}
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    style={{ filter: `drop-shadow(0 2px 4px ${color}40)` }}
                />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                <span>{new Date(data[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(data[data.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
        </div>
    );
}

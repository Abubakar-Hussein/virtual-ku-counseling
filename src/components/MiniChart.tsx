'use client';

interface ChartData {
    label: string;
    value: number;
    color?: string;
}

interface MiniChartProps {
    data: ChartData[];
    height?: number;
}

export default function MiniChart({ data, height = 150 }: MiniChartProps) {
    const max = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div style={{ width: '100%', height, display: 'flex', alignItems: 'flex-end', gap: 12, paddingTop: 20 }}>
            {data.map((item, i) => {
                const percentage = (item.value / max) * 100;
                return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
                        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                            <div 
                                style={{ 
                                    width: '100%', 
                                    height: `${percentage}%`, 
                                    background: item.color || 'var(--ku-green)', 
                                    borderRadius: '6px 6px 2px 2px',
                                    transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    minHeight: item.value > 0 ? 4 : 0
                                }} 
                                title={`${item.label}: ${item.value}`}
                            >
                                <div style={{ 
                                    position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)'
                                }}>
                                    {item.value}
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', textAlign: 'center' }}>
                            {item.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

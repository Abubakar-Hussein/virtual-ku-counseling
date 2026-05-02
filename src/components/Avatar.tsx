'use client';

interface AvatarProps {
    name?: string;
    src?: string | null;
    size?: number;
    fontSize?: string;
    style?: React.CSSProperties;
}

export default function Avatar({ name = 'User', src, size = 40, fontSize = '0.9rem', style }: AvatarProps) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    ...style,
                }}
                onError={(e) => {
                    (e.target as HTMLImageElement).src = ''; // Fallback to initials on error
                }}
            />
        );
    }

    // Generate initials
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Generate a consistent color based on name
    const colors = [
        'linear-gradient(135deg, #3b82f6, #2563eb)', // blue
        'linear-gradient(135deg, #10b981, #059669)', // green
        'linear-gradient(135deg, #f59e0b, #d97706)', // amber
        'linear-gradient(135deg, #ef4444, #dc2626)', // red
        'linear-gradient(135deg, #8b5cf6, #7c3aed)', // violet
        'linear-gradient(135deg, #ec4899, #db2777)', // pink
    ];
    
    const colorIndex = name.length % colors.length;
    const background = colors[colorIndex];

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize,
                fontWeight: 700,
                border: '1.5px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                flexShrink: 0,
                ...style,
            }}
        >
            {initials}
        </div>
    );
}

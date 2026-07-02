import { CalendarHeart } from 'lucide-react';

export default function Logo({ size = 40, className = '', style = {} }: { size?: number, className?: string, style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: 'var(--ku-green)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style
      }}
    >
      <CalendarHeart size={size * 0.6} strokeWidth={2.5} />
    </div>
  );
}

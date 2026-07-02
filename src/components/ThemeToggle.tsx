'use client';

import * as React from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) return <div style={{ width: 36, height: 36 }} />;

  // Show the icon matching the current theme
  const currentIcon =
    theme === 'light' ? <Sun size={16} /> :
    theme === 'dark' ? <Moon size={16} /> :
    <Monitor size={16} />;

  const options = [
    { key: 'light', label: 'Light', icon: <Sun size={15} /> },
    { key: 'dark', label: 'Dark', icon: <Moon size={15} /> },
    { key: 'system', label: 'System', icon: <Monitor size={15} /> },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', width: 'fit-content' }}>
      {/* Single trigger button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        title="Change theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--ku-green)',
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: open ? '0 0 0 3px rgba(0,136,68,0.25)' : 'none',
        }}
      >
        {currentIcon}
      </button>

      {/* Dropdown popup */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 140,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          zIndex: 100,
          animation: 'fadeInDown 0.15s ease',
        }}>
          {options.map(opt => {
            const active = theme === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => { setTheme(opt.key); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: active ? 'rgba(0,136,68,0.15)' : 'transparent',
                  color: active ? 'var(--ku-green-light)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s ease',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                {opt.icon}
                {opt.label}
                {active && <Check size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: 40, height: 40 }} />;

  return (
    <div style={{ 
      display: 'flex', 
      background: 'rgba(0,0,0,0.05)', 
      padding: '4px', 
      borderRadius: '12px',
      gap: '4px',
      border: '1px solid var(--border)',
      width: 'fit-content'
    }}>
      <ThemeButton 
        active={theme === 'light'} 
        onClick={() => setTheme('light')} 
        icon={<Sun size={16} />} 
        label="Light"
      />
      <ThemeButton 
        active={theme === 'dark'} 
        onClick={() => setTheme('dark')} 
        icon={<Moon size={16} />} 
        label="Dark"
      />
      <ThemeButton 
        active={theme === 'system'} 
        onClick={() => setTheme('system')} 
        icon={<Monitor size={16} />} 
        label="System"
      />
    </div>
  );
}

function ThemeButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: 'none',
        background: active ? 'var(--ku-green)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {icon}
    </button>
  );
}

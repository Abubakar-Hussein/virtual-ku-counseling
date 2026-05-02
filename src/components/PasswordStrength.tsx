'use client';

/**
 * Visual password strength meter.
 * Shows a color-coded bar and requirement checklist.
 */
export default function PasswordStrength({ password }: { password: string }) {
    if (!password) return null;

    const checks = [
        { label: 'At least 8 characters', pass: password.length >= 8 },
        { label: 'Contains uppercase letter', pass: /[A-Z]/.test(password) },
        { label: 'Contains lowercase letter', pass: /[a-z]/.test(password) },
        { label: 'Contains a number', pass: /\d/.test(password) },
        { label: 'Contains special character', pass: /[^A-Za-z0-9]/.test(password) },
    ];

    const score = checks.filter(c => c.pass).length;

    const getColor = () => {
        if (score <= 1) return '#ef4444';
        if (score <= 2) return '#f97316';
        if (score <= 3) return '#eab308';
        if (score <= 4) return '#22c55e';
        return '#10b981';
    };

    const getLabel = () => {
        if (score <= 1) return 'Very Weak';
        if (score <= 2) return 'Weak';
        if (score <= 3) return 'Fair';
        if (score <= 4) return 'Strong';
        return 'Very Strong';
    };

    const color = getColor();

    return (
        <div style={{ marginTop: 8 }}>
            {/* Strength bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: i <= score ? color : 'rgba(255,255,255,0.08)',
                            transition: 'background 0.3s ease',
                        }}
                    />
                ))}
            </div>

            {/* Label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color, transition: 'color 0.3s' }}>
                    {getLabel()}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{score}/5</span>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {checks.map((check, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.72rem',
                            color: check.pass ? '#4ade80' : 'var(--text-muted)',
                            transition: 'color 0.2s',
                        }}
                    >
                        <span style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            background: check.pass ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${check.pass ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            transition: 'all 0.2s',
                        }}>
                            {check.pass ? '✓' : ''}
                        </span>
                        {check.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

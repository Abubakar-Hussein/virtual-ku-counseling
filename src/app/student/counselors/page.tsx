'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import CounselorCard from '@/components/CounselorCard';
import NotificationBell from '@/components/NotificationBell';
import EmptyState from '@/components/EmptyState';
import { CounselorCardSkeleton } from '@/components/Skeleton';
import { Users2 } from 'lucide-react';

const FILTERS = [
    { value: '',              label: 'All Counselors' },
    { value: 'academic',     label: 'Academic' },
    { value: 'career',       label: 'Career' },
    { value: 'mental_health',label: 'Mental Health' },
];

export default function CounselorListPage() {
    const [counselors, setCounselors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        async function fetchCounselors() {
            setLoading(true);
            try {
                const url = filter ? `/api/counselors?specialization=${filter}` : '/api/counselors';
                const res = await fetch(url);
                const data = await res.json();
                if (Array.isArray(data)) setCounselors(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCounselors();
    }, [filter]);

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 20, padding: '4px 12px',
                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)',
                            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            <Users2 size={12} strokeWidth={2.5} /> Our Team
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Find Your Counselor
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Browse our professional university counselors and book a session that fits your schedule.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Filter bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 32, flexWrap: 'wrap',
                }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>
                        Specialization:
                    </span>
                    {FILTERS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value)}
                            style={{
                                padding: '8px 18px', borderRadius: 20, fontSize: '0.83rem',
                                cursor: 'pointer', transition: 'all 0.18s', fontWeight: filter === value ? 700 : 500,
                                background: filter === value ? 'var(--ku-green)' : 'var(--bg-card)',
                                color: filter === value ? '#fff' : 'var(--text-secondary)',
                                border: filter === value ? '1px solid var(--ku-green)' : '1px solid var(--border)',
                                boxShadow: filter === value ? '0 2px 12px rgba(50,83,67,0.18)' : 'none',
                            }}
                        >
                            {label}
                        </button>
                    ))}

                    {!loading && counselors.length > 0 && (
                        <span style={{
                            marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)',
                            background: 'rgba(50,83,67,0.06)', border: '1px solid rgba(50,83,67,0.12)',
                            borderRadius: 20, padding: '5px 14px',
                        }}>
                            {counselors.length} counselor{counselors.length !== 1 ? 's' : ''} found
                        </span>
                    )}
                </div>

                {/* Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        <CounselorCardSkeleton />
                        <CounselorCardSkeleton />
                        <CounselorCardSkeleton />
                    </div>
                ) : counselors.length === 0 ? (
                    <EmptyState
                        icon=""
                        title="No counselors found"
                        description={filter
                            ? `We couldn't find any specialists in ${filter.replace('_', ' ')} right now. Try another category.`
                            : 'There are currently no counselors registered in the system.'}
                        actionLabel={filter ? 'Show All Counselors' : undefined}
                        actionHref="/student/counselors"
                    />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {counselors.map((c) => (
                            <CounselorCard key={c._id} counselor={c} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

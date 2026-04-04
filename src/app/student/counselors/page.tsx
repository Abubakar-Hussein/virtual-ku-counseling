'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import CounselorCard from '@/components/CounselorCard';
import NotificationBell from '@/components/NotificationBell';

export default function CounselorListPage() {
    const [counselors, setCounselors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        async function fetchCounselors() {
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
            <main className="dashboard-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Our Counselors</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Find the right specialist for your needs from our professional university team.</p>
                    </div>
                    <NotificationBell />
                </header>

                {/* Filters */}
                <div className="glass" style={{ padding: '16px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Specialization:</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {['', 'academic', 'career', 'mental_health'].map((spec) => (
                            <button
                                key={spec}
                                onClick={() => setFilter(spec)}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    background: filter === spec ? 'var(--ku-green)' : 'rgba(255,255,255,0.05)',
                                    color: filter === spec ? '#fff' : 'var(--text-secondary)',
                                    border: filter === spec ? '1px solid var(--ku-green-light)' : '1px solid var(--border)',
                                }}
                            >
                                {spec === '' ? 'All' : spec.replace('_', ' ').charAt(0).toUpperCase() + spec.replace('_', ' ').slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Finding counselors...</div>
                ) : counselors.length === 0 ? (
                    <div className="glass" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No counselors found matching this criteria.
                    </div>
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

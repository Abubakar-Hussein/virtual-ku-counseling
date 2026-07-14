'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Sparkles, Star, MapPin, Video, ArrowRight, Users } from 'lucide-react';

interface MatchedCounselor {
    _id: string; name: string; email: string; profileImage?: string;
    specializations: string[]; bio: string; averageRating: number;
    totalRatings: number; meetLink?: string; matchScore: number; reasons: string[];
}

import { Suspense } from 'react';

function IntakeResultsContent() {
    const searchParams = useSearchParams();
    const intakeId = searchParams.get('intakeId');
    const [counselors, setCounselors] = useState<MatchedCounselor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!intakeId) return;
        fetch(`/api/counselors/match?intakeId=${intakeId}`)
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setCounselors(d); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [intakeId]);

    const specLabel = (s: string) => ({ academic: 'Academic', career: 'Career', mental_health: 'Mental Health' }[s] || s);

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
                            <Sparkles size={12} strokeWidth={2.5} /> Your Matches
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Recommended Counselors</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Based on your assessment, here are your best matches.</p>
                    </div>
                    <NotificationBell />
                </header>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {[1, 2, 3].map(i => <div key={i} className="glass skeleton" style={{ height: 200, borderRadius: 20 }} />)}
                    </div>
                ) : counselors.length === 0 ? (
                    <div className="glass" style={{ padding: 48, textAlign: 'center', borderRadius: 20 }}>
                        <Users size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
                        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No matches found</h3>
                        <p style={{ color: '#6b7280', marginBottom: 24 }}>Try browsing all counselors instead.</p>
                        <Link href="/student/counselors" style={{ color: '#325343', fontWeight: 700, textDecoration: 'none' }}>Browse All Counselors →</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
                        {counselors.map((c, i) => (
                            <div key={c._id} className="glass" style={{ padding: 28, borderRadius: 20, position: 'relative', overflow: 'hidden', border: i === 0 ? '2px solid rgba(50,83,67,0.3)' : undefined }}>
                                {i === 0 && <div style={{ position: 'absolute', top: 0, right: 0, background: '#325343', color: '#fff', padding: '4px 16px 4px 20px', borderRadius: '0 0 0 16px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em' }}>BEST MATCH</div>}

                                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                    {/* Avatar */}
                                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--ku-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, flexShrink: 0 }}>
                                        {c.name?.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{c.name}</h3>
                                            <div style={{ background: 'rgba(50,83,67,0.08)', border: '1px solid rgba(50,83,67,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#325343' }}>
                                                {c.matchScore}% Match
                                            </div>
                                        </div>

                                        {/* Specializations */}
                                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                            {c.specializations.map(s => (
                                                <span key={s} style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(50,83,67,0.06)', color: '#325343', border: '1px solid rgba(50,83,67,0.12)' }}>
                                                    {specLabel(s)}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Rating */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: '0.85rem', color: '#6b7280' }}>
                                            {c.averageRating > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={14} fill="#f59e0b" color="#f59e0b" /> {c.averageRating.toFixed(1)} ({c.totalRatings})</span>}
                                            {c.meetLink && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Video size={14} /> Virtual available</span>}
                                        </div>

                                        {/* Match reasons */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                                            {c.reasons.map((r, j) => (
                                                <span key={j} style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 99, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓ {r}</span>
                                            ))}
                                        </div>

                                        <Link href={`/student/book/${c._id}`} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                                            borderRadius: 12, background: '#325343', color: '#fff', textDecoration: 'none',
                                            fontWeight: 700, fontSize: '0.85rem',
                                        }}>Book Session <ArrowRight size={14} /></Link>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Link href="/student/counselors" style={{ textAlign: 'center', display: 'block', color: '#6b7280', fontSize: '0.9rem', marginTop: 12, textDecoration: 'none', fontWeight: 600 }}>
                            Or browse all counselors →
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function IntakeResultsPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading matches...</div>}>
            <IntakeResultsContent />
        </Suspense>
    );
}

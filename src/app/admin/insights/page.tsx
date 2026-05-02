'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import TrendChart from '@/components/TrendChart';
import MiniChart from '@/components/MiniChart';

export default function InsightsPage() {
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const res = await fetch(`/api/admin/stats?startDate=${dateRange.start}&endDate=${dateRange.end}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [dateRange]);

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Advanced Insights</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Real-world benchmarks and clinical outcomes analysis.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="glass" style={{ padding: '6px 12px', display: 'flex', gap: 12, alignItems: 'center', borderRadius: 12 }}>
                            <input 
                                type="date" 
                                value={dateRange.start} 
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                            <input 
                                type="date" 
                                value={dateRange.end} 
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                            />
                        </div>
                        <NotificationBell />
                    </div>
                </header>

                <div className="glass" style={{ padding: 32 }}>
                    {statsLoading ? (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            Loading analytics...
                        </div>
                    ) : stats ? (
                        <React.Fragment>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 40 }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ku-green-light)', marginBottom: 16 }}>Service Mix Breakdown</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {stats.serviceMix.length === 0 ? (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No session data yet.</p>
                                        ) : stats.serviceMix.map((item: any) => (
                                            <div key={item.label}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                                    <span>{item.label}</span>
                                                    <span style={{ fontWeight: 600 }}>{item.percentage}%</span>
                                                </div>
                                                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ 
                                                        height: '100%', 
                                                        width: `${item.percentage}%`, 
                                                        background: item.label.includes('Mental') ? 'var(--ku-green)' : item.label.includes('Academic') ? 'var(--ku-gold)' : '#3b82f6' 
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ku-green-light)', marginBottom: 16 }}>Operational KPIs</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Avg. Lead Time</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.summary.avgLeadTime} Days</div>
                                            <div style={{ fontSize: '0.7rem', color: parseFloat(stats.summary.avgLeadTime) < 3 ? '#4ade80' : '#f87171', marginTop: 4 }}>
                                                {parseFloat(stats.summary.avgLeadTime) < 3 ? 'Efficient' : 'Needs Optimization'}
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>No-Show Rate</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.summary.noShowRate}%</div>
                                            <div style={{ fontSize: '0.7rem', color: parseFloat(stats.summary.noShowRate) < 10 ? '#4ade80' : '#f87171', marginTop: 4 }}>
                                                {parseFloat(stats.summary.noShowRate) < 10 ? 'Healthy' : 'High'}
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Appointments</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.summary.totalAppointments}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Total System Vol.</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Student Reach</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.summary.studentReach}%</div>
                                            <div style={{ fontSize: '0.7rem', color: '#4ade80', marginTop: 4 }}>Engagement Metric</div>
                                        </div>
                                    </div>
                                </div>

                                <div>

                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ku-green-light)', marginBottom: 16 }}>Clinical Outcomes Distribution</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {!stats.progressDistribution || stats.progressDistribution.length === 0 ? (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No progress data for this period.</p>
                                        ) : stats.progressDistribution.map((item: any) => (
                                            <div key={item.label}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                                    <span>{item.label}</span>
                                                    <span style={{ fontWeight: 600 }}>{item.percentage}%</span>
                                                </div>
                                                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ 
                                                        height: '100%', 
                                                        width: `${item.percentage}%`, 
                                                        background: item.label === 'Improved' ? '#10b981' : item.label === 'Stable' ? '#3b82f6' : item.label === 'Declined' ? '#ef4444' : '#6b7280' 
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ku-green-light)', marginBottom: 16 }}>Activity Trend (Last 30 Days)</h3>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid var(--border)' }}>
                                        <TrendChart data={stats.trends} />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
                                        Platform usage frequency and student engagement velocity.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40, marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 40 }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ku-green-light)', marginBottom: 16 }}>Counselor Performance Rankings</h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                    <th style={{ padding: '12px 8px' }}>Counselor</th>
                                                    <th style={{ padding: '12px 8px' }}>Total Sessions</th>
                                                    <th style={{ padding: '12px 8px' }}>Completion Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.counselorPerformance.length === 0 ? (
                                                    <tr><td colSpan={3} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No performance data for this period.</td></tr>
                                                ) : stats.counselorPerformance.map((c: any) => (
                                                    <tr key={c._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '12px 8px', fontWeight: 500 }}>{c.name}</td>
                                                        <td style={{ padding: '12px 8px' }}>{c.total}</td>
                                                        <td style={{ padding: '12px 8px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                                                                    <div style={{ height: '100%', width: `${(c.completed / c.total) * 100}%`, background: 'var(--ku-green)' }} />
                                                                </div>
                                                                <span>{((c.completed / c.total) * 100).toFixed(0)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ku-green-light)', marginBottom: 16 }}>Peak Demand (Hourly)</h3>
                                    <MiniChart 
                                        data={stats.hourlyDemand.map((h: any) => ({
                                            label: h.hour,
                                            value: h.count
                                        }))}
                                        height={160}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
                                        Highest booking volume is concentrated between 09:00 - 14:00.
                                    </p>
                                </div>
                            </div>
                        </React.Fragment>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load insights.</div>
                    )}
                </div>
            </main>
        </div>
    );
}

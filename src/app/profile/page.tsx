'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';
import Avatar from '@/components/Avatar';

const SPECIALIZATIONS = [
    { value: 'academic', label: 'Academic Support' },
    { value: 'career', label: 'Career Counseling' },
    { value: 'mental_health', label: 'Mental Health & Wellness' },
];

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        studentId: '',
        role: 'student',
        password: '',
        bio: '',
        profileImage: '' as string | null,
        specializations: [] as string[]
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    setProfile({ ...profile, ...data });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSpecToggle = (val: string) => {
        setProfile(prev => {
            const specs = [...prev.specializations];
            if (specs.includes(val)) return { ...prev, specializations: specs.filter(s => s !== val) };
            return { ...prev, specializations: [...specs, val] };
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) { // 1MB limit
            showToast('Image must be less than 1MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfile(prev => ({ ...prev, profileImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        if (profile.password && profile.password.length < 8) {
            setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
            showToast('Password must be at least 8 characters', 'error');
            setSaving(false);
            return;
        }

        if (profile.phone) {
            const phoneRegex = /^\+2547\d{8}$/;
            if (!phoneRegex.test(profile.phone)) {
                setMessage({ text: 'Phone must be in format +2547XXXXXXXX', type: 'error' });
                showToast('Phone must be in format +2547XXXXXXXX', 'error');
                setSaving(false);
                return;
            }
        }

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: profile.name,
                    phone: profile.phone,
                    password: profile.password || undefined,
                    bio: profile.role === 'counselor' ? profile.bio : undefined,
                    profileImage: profile.profileImage || undefined,
                    specializations: profile.role === 'counselor' ? profile.specializations : undefined
                })
            });

            if (res.ok) {
                setMessage({ text: 'Profile updated successfully!', type: 'success' });
                showToast('Profile updated successfully!', 'success');
                setProfile({ ...profile, password: '' });
                // Update session to reflect changes (like profileImage) globally
                update();
            } else {
                const data = await res.json();
                setMessage({ text: data.error || 'Failed to update', type: 'error' });
                showToast(data.error || 'Failed to update profile', 'error');
            }
        } catch (err) {
            setMessage({ text: 'An unexpected error occurred.', type: 'error' });
            showToast('An unexpected error occurred', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Loading profile...
            </main>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Profile</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details and security settings.</p>
                    </div>
                    <NotificationBell />
                </header>

                <div className="glass" style={{ padding: '32px', maxWidth: 800 }}>
                    {message.text && (
                        <div style={{
                            padding: 16, marginBottom: 24, borderRadius: 10,
                            background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                            border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                            color: message.type === 'error' ? '#f87171' : '#4ade80'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Section 1: Basic Info */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ku-green-light)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                                Personal Information
                            </h2>
                            
                            {/* Avatar Upload */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
                                <Avatar name={profile.name} src={profile.profileImage} size={80} fontSize="1.8rem" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Profile Photo</label>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button 
                                            type="button" 
                                            className="btn-secondary" 
                                            onClick={() => document.getElementById('avatar-input')?.click()}
                                            style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                                        >
                                            Change Photo
                                        </button>
                                        <input 
                                            id="avatar-input" 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleImageChange} 
                                            style={{ display: 'none' }} 
                                        />
                                        {profile.profileImage && (
                                            <button 
                                                type="button" 
                                                className="btn-danger" 
                                                onClick={() => setProfile({ ...profile, profileImage: null })}
                                                style={{ padding: '8px 16px', fontSize: '0.75rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>JPG or PNG. Max size of 1MB.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" className="form-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" className="form-input" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+254700000000" maxLength={13} title="Format: +2547 followed by 8 digits" />
                                </div>
                                <div className="form-group" style={{ opacity: 0.6 }}>
                                    <label>Email Address 🔒</label>
                                    <input type="email" className="form-input" value={profile.email} readOnly title="Email cannot be changed" />
                                </div>
                                {profile.role === 'student' && (
                                    <div className="form-group" style={{ opacity: 0.6 }}>
                                        <label>Student ID 🔒</label>
                                        <input type="text" className="form-input" value={profile.studentId} readOnly />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section 2: Counselor Info (Conditional) */}
                        {profile.role === 'counselor' && (
                            <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ku-gold)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                                    Professional Profile
                                </h2>
                
                                <div className="form-group">
                                    <label>Brief Bio / Introduction</label>
                                    <textarea 
                                        className="form-input" 
                                        value={profile.bio} 
                                        onChange={e => setProfile({ ...profile, bio: e.target.value })} 
                                        placeholder="Tell students about your experience and counseling style..."
                                        style={{ minHeight: 120, resize: 'vertical' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Areas of Specialization</label>
                                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                                        {SPECIALIZATIONS.map(spec => (
                                            <label key={spec.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={profile.specializations.includes(spec.value)}
                                                    onChange={() => handleSpecToggle(spec.value)}
                                                    style={{ width: 18, height: 18, accentColor: 'var(--ku-green)' }}
                                                />
                                                {spec.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section 3: Security */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f87171', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                                Security
                            </h2>
                            <div className="form-group" style={{ maxWidth: 300 }}>
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    value={profile.password} 
                                    onChange={e => setProfile({ ...profile, password: e.target.value })} 
                                    placeholder="Leave blank to keep current" 
                                />
                            </div>
                        </section>

                        <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 16 }}>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? 'Saving Changes...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

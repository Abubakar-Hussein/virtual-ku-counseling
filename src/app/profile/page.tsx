'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';
import Avatar from '@/components/Avatar';
import { Settings, Shield, UserCircle, Briefcase } from 'lucide-react';

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

        if (profile.name) {
            const nameRegex = /^[A-Za-z\s\-\']+$/;
            if (!nameRegex.test(profile.name.trim())) {
                showToast('Name can only contain letters, spaces, hyphens, and apostrophes', 'error');
                setSaving(false);
                return;
            }
        }

        if (profile.password && profile.password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            setSaving(false);
            return;
        }

        if (profile.phone) {
            const phoneRegex = /^\+2547\d{8}$/;
            if (!phoneRegex.test(profile.phone)) {
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
                    studentId: profile.role === 'student' ? profile.studentId : undefined,
                    password: profile.password || undefined,
                    bio: profile.role === 'counselor' ? profile.bio : undefined,
                    profileImage: profile.profileImage || undefined,
                    specializations: profile.role === 'counselor' ? profile.specializations : undefined
                })
            });

            if (res.ok) {
                showToast('Profile updated successfully!', 'success');
                setProfile({ ...profile, password: '' });
                // Update session to reflect changes (like profileImage) globally
                update();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to update profile', 'error');
            }
        } catch (err) {
            showToast('An unexpected error occurred', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--text-muted)' }}>Loading profile...</div>
            </main>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content page-transition">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(50,83,67,0.07)', border: '1px solid rgba(50,83,67,0.15)',
                            borderRadius: 20, padding: '4px 12px',
                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--ku-green)',
                            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12,
                        }}>
                            <Settings size={12} strokeWidth={2.5} /> Settings
                        </div>
                        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            My Profile
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Manage your personal details and security settings.
                        </p>
                    </div>
                    <NotificationBell />
                </header>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '32px 36px', maxWidth: 840, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                        
                        {/* Section 1: Basic Info */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                                <UserCircle size={18} strokeWidth={2.5} color="var(--ku-green)" />
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Personal Information</h2>
                            </div>
                            
                            {/* Avatar Upload */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 8, padding: '16px', background: 'rgba(50,83,67,0.02)', borderRadius: 16, border: '1px solid var(--border)' }}>
                                <Avatar name={profile.name} src={profile.profileImage} size={84} fontSize="1.8rem" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Profile Photo</div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button 
                                            type="button" 
                                            onClick={() => document.getElementById('avatar-input')?.click()}
                                            style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: 8, background: 'rgba(50,83,67,0.08)', color: 'var(--ku-green)', border: '1px solid rgba(50,83,67,0.2)', fontWeight: 700, cursor: 'pointer' }}
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
                                                onClick={() => setProfile({ ...profile, profileImage: null })}
                                                style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: 8, background: 'transparent', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>JPG or PNG. Max size of 1MB.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Full Name</label>
                                    <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(50,83,67,0.4)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Phone Number</label>
                                    <input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+254700000000" maxLength={13} title="Format: +2547 followed by 8 digits"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(50,83,67,0.4)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>
                                <div style={{ opacity: 0.7 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email Address</label>
                                    <input type="email" value={profile.email} readOnly title="Email cannot be changed"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }}
                                    />
                                </div>
                                {profile.role === 'student' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Student ID</label>
                                        <input type="text" value={profile.studentId} onChange={e => setProfile({ ...profile, studentId: e.target.value })}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                            onFocus={e => e.target.style.borderColor = 'rgba(50,83,67,0.4)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                        />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section 2: Counselor Info */}
                        {profile.role === 'counselor' && (
                            <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                                    <Briefcase size={18} strokeWidth={2.5} color="var(--ku-green)" />
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Professional Profile</h2>
                                </div>
                
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Brief Bio / Introduction</label>
                                    <textarea 
                                        value={profile.bio} 
                                        onChange={e => setProfile({ ...profile, bio: e.target.value })} 
                                        placeholder="Tell students about your experience and counseling style..."
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', minHeight: 120, resize: 'vertical' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(50,83,67,0.4)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Areas of Specialization</label>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                                        {SPECIALIZATIONS.map(spec => {
                                            const isSelected = profile.specializations.includes(spec.value);
                                            return (
                                                <button 
                                                    key={spec.value}
                                                    type="button"
                                                    onClick={() => handleSpecToggle(spec.value)}
                                                    style={{ 
                                                        padding: '8px 16px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                        border: `1px solid ${isSelected ? 'rgba(50,83,67,0.3)' : 'var(--border)'}`,
                                                        background: isSelected ? 'rgba(50,83,67,0.08)' : 'var(--bg-main)',
                                                        color: isSelected ? 'var(--ku-green)' : 'var(--text-secondary)'
                                                    }}
                                                >
                                                    {spec.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section 3: Security */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                                <Shield size={18} strokeWidth={2.5} color="#dc2626" />
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Security</h2>
                            </div>
                            <div style={{ maxWidth: 320 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>New Password</label>
                                <input 
                                    type="password" 
                                    value={profile.password} 
                                    onChange={e => setProfile({ ...profile, password: e.target.value })} 
                                    placeholder="Leave blank to keep current" 
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(50,83,67,0.4)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                />
                            </div>
                        </section>

                        <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 8 }}>
                            <button type="submit" disabled={saving} style={{
                                padding: '12px 28px', borderRadius: 12, border: 'none',
                                background: saving ? 'rgba(50,83,67,0.5)' : 'var(--ku-green)',
                                color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(50,83,67,0.2)'
                            }}>
                                {saving ? 'Saving Changes...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

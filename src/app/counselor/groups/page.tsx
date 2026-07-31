'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Users, Calendar, Clock, Plus, Video } from 'lucide-react';

export default function CounselorGroupsPage() {
  const [activeTab, setActiveTab] = useState('my');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('General Wellness');
  const [datetime, setDatetime] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [tags, setTags] = useState('');

  const TOPICS = [
    'Anxiety Management', 'Stress Relief', 'Exam Preparation', 'Grief Support',
    'Self-Esteem Building', 'Mindfulness', 'Career Guidance', 'Relationship Skills', 'General Wellness'
  ];

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/groups?filter=my');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || data || []);
      } else {
        setSessions([
           {
             id: '1',
             topic: 'Anxiety Management',
             title: 'Overcoming Midterm Stress',
             description: 'Join us for a workshop on managing anxiety during exams.',
             datetime: '2026-08-05T15:00:00Z',
             duration: 60,
             enrolledCount: 15,
             status: 'scheduled',
             roomUrl: '/room/123'
           }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my') {
      fetchSessions();
    }
  }, [activeTab]);

  const handleLaunch = async (sessionId: string) => {
    try {
      await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'launch', sessionId }),
      });
      window.location.href = `/room/${sessionId}`;
    } catch (error) {
      console.error('Failed to launch session:', error);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          topic,
          datetime,
          duration: parseInt(duration),
          maxParticipants: parseInt(maxParticipants),
          isAnonymous,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        }),
      });
      alert('Session created successfully!');
      setActiveTab('my');
      // Reset form
      setTitle(''); setDescription(''); setTopic('General Wellness'); setDatetime('');
      setDuration('60'); setMaxParticipants('20'); setIsAnonymous(true); setTags('');
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session');
    }
  };

  return (
    <div className="dashboard-layout flex h-screen bg-[#f3f4f6]">
      <Sidebar />
      <div className="flex-1 flex flex-col page-transition overflow-y-auto">
        <header className="flex justify-between items-center p-8 bg-white shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Group Sessions</h1>
          </div>
          <NotificationBell />
        </header>

        <main className="p-8">
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'my' ? 'text-[#325343] border-b-2 border-[#325343]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Sessions
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'create' ? 'text-[#325343] border-b-2 border-[#325343]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Create New
            </button>
          </div>

          {activeTab === 'my' ? (
            loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--ku-green, #325343)' }}></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map(session => (
                  <div key={session.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                        {session.topic}
                      </span>
                      {session.status === 'scheduled' && <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">Upcoming</span>}
                      {session.status === 'live' && <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 animate-pulse">Live</span>}
                      {session.status === 'completed' && <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">Completed</span>}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{session.title}</h3>
                    
                    <div className="space-y-2 mb-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(session.datetime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{session.enrolledCount !== undefined ? session.enrolledCount : (session.enrolledStudents?.length || 0)} enrolled</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {session.status === 'scheduled' && (
                        <button 
                          onClick={() => handleLaunch(session.id)}
                          className="w-full py-2 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: 'var(--ku-green, #325343)' }}
                        >
                          Launch
                        </button>
                      )}
                      {session.status === 'live' && (
                        <a 
                          href={session.roomUrl}
                          className="block w-full text-center py-2 rounded-xl text-white font-medium bg-red-500 hover:bg-red-600 transition-colors"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="col-span-1 md:col-span-3 text-center py-12 text-gray-500">
                    No sessions found.
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="max-w-2xl bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-gray-100">
              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#325343] focus:border-[#325343]" placeholder="e.g. Navigating Finals Stress" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#325343] focus:border-[#325343]" placeholder="What will this session cover?"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#325343] focus:border-[#325343]">
                      {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <input type="datetime-local" required value={datetime} onChange={e => setDatetime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#325343] focus:border-[#325343]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#325343] focus:border-[#325343]">
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                    <input type="number" required value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} min="1" max="100" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#325343] focus:border-[#325343]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#325343] focus:border-[#325343]" placeholder="e.g. mindfulness, students, exams" />
                </div>

                <div className="flex items-center">
                  <input type="checkbox" id="anonymous" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="h-4 w-4 text-[#325343] focus:ring-[#325343] border-gray-300 rounded" />
                  <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900">
                    Allow Anonymous Participation
                  </label>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--ku-green, #325343)' }}>
                    Create Session
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

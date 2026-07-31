'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { Users, Calendar, Clock, UserCheck, Video } from 'lucide-react';

export default function StudentGroupsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'my' ? '/api/groups?filter=my' : '/api/groups';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || data || []);
      } else {
        // Fallback for UI testing if API is not yet implemented
        setSessions([
           {
             id: '1',
             topic: 'Anxiety Management',
             title: 'Overcoming Midterm Stress',
             description: 'Join us for a workshop on managing anxiety during exams.',
             counselorName: 'Dr. Jane Smith',
             datetime: '2026-08-05T15:00:00Z',
             duration: 60,
             maxParticipants: 20,
             enrolledStudents: ['user1', 'user2', 'user3'],
             status: 'scheduled',
             roomUrl: '/room/123'
           },
           {
             id: '2',
             topic: 'Mindfulness',
             title: 'Daily Meditation Practice',
             description: 'A quick 30-minute mindfulness session to start your day.',
             counselorName: 'Dr. John Doe',
             datetime: new Date().toISOString(),
             duration: 30,
             maxParticipants: 10,
             enrolledStudents: ['user1', 'current_user'],
             status: 'live',
             roomUrl: '/room/456'
           }
        ].filter(s => activeTab === 'upcoming' ? true : s.enrolledStudents.includes('current_user')));
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  const handleEnrollAction = async (action: string, sessionId: string) => {
    setEnrollingId(sessionId);
    try {
      await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sessionId }),
      });
      fetchSessions();
    } catch (error) {
      console.error(`Error modifying enrollment:`, error);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="dashboard-layout flex h-screen bg-[#f3f4f6]">
      <Sidebar />
      <div className="flex-1 flex flex-col page-transition overflow-y-auto">
        <header className="flex justify-between items-center p-8 bg-white shadow-sm">
          <div>
            <div className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 text-white" style={{ backgroundColor: 'var(--ku-green, #325343)' }}>
              Group Sessions
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Wellness Workshops</h1>
            <p className="text-gray-500 mt-1">Join anonymous, counselor-led group sessions</p>
          </div>
          <NotificationBell />
        </header>

        <main className="p-8">
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'upcoming' ? 'text-[#325343] border-b-2 border-[#325343]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'my' ? 'text-[#325343] border-b-2 border-[#325343]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Sessions
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--ku-green, #325343)' }}></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sessions.map(session => {
                const isFull = session.enrolledStudents.length >= session.maxParticipants;
                const isEnrolled = session.enrolledStudents.includes('current_user'); 
                const fillPercentage = Math.min(100, (session.enrolledStudents.length / session.maxParticipants) * 100);

                return (
                  <div key={session.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {session.topic}
                      </span>
                      {session.status === 'live' && (
                        <div className="flex items-center gap-2 text-red-500 text-sm font-semibold animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Live
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 800 }}>{session.title}</h3>
                    <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-2">{session.description}</p>
                    
                    <div className="space-y-3 mb-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        <span>{session.counselorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(session.datetime).toLocaleDateString()} at {new Date(session.datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{session.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{session.maxParticipants - session.enrolledStudents.length} spots remaining</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-[#325343] h-2 rounded-full transition-all" style={{ width: `${fillPercentage}%` }}></div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {session.status === 'live' ? (
                        <a href={session.roomUrl} className="block w-full text-center py-3 rounded-xl text-white font-medium bg-red-500 hover:bg-red-600 transition-colors">
                          Join Now
                        </a>
                      ) : isEnrolled ? (
                        <div className="flex gap-3 items-center">
                          <span className="flex-1 text-center py-3 rounded-xl font-medium text-green-700 bg-green-50 border border-green-200">
                            Enrolled ✓
                          </span>
                          <button 
                            onClick={() => handleEnrollAction('unenroll', session.id)}
                            disabled={enrollingId === session.id}
                            className="px-6 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            Leave
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEnrollAction('enroll', session.id)}
                          disabled={isFull || enrollingId === session.id}
                          className={`w-full py-3 rounded-xl font-medium transition-colors ${isFull ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-white hover:opacity-90'}`}
                          style={{ backgroundColor: isFull ? '' : 'var(--ku-green, #325343)' }}
                        >
                          {isFull ? 'Full' : 'Enroll'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <div className="col-span-1 md:col-span-2 text-center py-12 text-gray-500">
                  No sessions found.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

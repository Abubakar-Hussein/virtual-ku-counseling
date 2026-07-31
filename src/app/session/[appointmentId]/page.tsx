'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Video, PhoneOff, Loader2, ArrowLeft } from 'lucide-react';

export default function VideoSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const appointmentId = params?.appointmentId as string;

  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/video/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      setRoomUrl(data.roomUrl);
      setToken(data.token);
    } catch (err) {
      console.error(err);
      setError('Unable to start session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchRoom();
    }
  }, [appointmentId]);

  const handleLeave = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Preparing your session...</p>
      </div>
    );
  }

  if (error || !roomUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center gap-2">
          <PhoneOff className="w-5 h-5" />
          <p className="font-medium">{error || 'Unable to start session'}</p>
        </div>
        <button
          onClick={fetchRoom}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const iframeSrc = token ? `${roomUrl}?t=${token}` : roomUrl;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Top Bar */}
      <div 
        className="flex items-center justify-between px-4 shrink-0" 
        style={{ height: '56px', backgroundColor: '#1a1a2e', color: '#fff' }}
      >
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-400" />
          <h1 className="font-bold text-lg">KU Wellness Session</h1>
        </div>
        
        <button 
          onClick={handleLeave}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors flex items-center gap-2 text-sm"
        >
          Leave
        </button>
      </div>

      {/* Video Call iframe */}
      <div className="w-full flex-1 bg-black" style={{ height: 'calc(100vh - 56px)' }}>
        <iframe
          src={iframeSrc}
          className="w-full h-full border-none"
          allow="camera; microphone; fullscreen; speaker; display-capture"
        />
      </div>
    </div>
  );
}

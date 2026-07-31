// Daily.co REST API wrapper
// Set DAILY_API_KEY in .env.local to your Daily.co API key

const DAILY_API_KEY = process.env.DAILY_API_KEY || '';
const DAILY_API_URL = 'https://api.daily.co/v1';

export async function createDailyRoom(name: string, expiryMinutes = 120) {
    const exp = Math.floor(Date.now() / 1000) + expiryMinutes * 60;
    const res = await fetch(`${DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${DAILY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 40),
            privacy: 'private',
            properties: {
                exp,
                enable_chat: true,
                enable_screenshare: true,
                enable_recording: false,
                max_participants: 2,
                enable_knocking: true,
                start_audio_off: false,
                start_video_off: false,
            },
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        console.error('[DAILY] Room creation failed:', err);
        // Return a fallback mock room for development
        return { url: `https://kuwellness.daily.co/${name}`, name, id: 'mock' };
    }
    return res.json();
}

export async function createDailyGroupRoom(name: string, maxParticipants = 25, expiryMinutes = 180) {
    const exp = Math.floor(Date.now() / 1000) + expiryMinutes * 60;
    const res = await fetch(`${DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${DAILY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: `group-${name}`.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 40),
            privacy: 'private',
            properties: {
                exp,
                enable_chat: true,
                enable_screenshare: true,
                max_participants: maxParticipants,
                enable_knocking: true,
            },
        }),
    });
    if (!res.ok) {
        return { url: `https://kuwellness.daily.co/group-${name}`, name: `group-${name}`, id: 'mock' };
    }
    return res.json();
}

export async function createMeetingToken(roomName: string, userName: string, isOwner = false) {
    const res = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${DAILY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            properties: {
                room_name: roomName,
                user_name: userName,
                is_owner: isOwner,
                enable_screenshare: true,
            },
        }),
    });
    if (!res.ok) return { token: '' };
    return res.json();
}

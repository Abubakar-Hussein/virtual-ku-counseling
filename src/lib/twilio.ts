// Twilio SMS wrapper
// Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env.local

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '';

export async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_PHONE) {
        console.log('[TWILIO] Mock SMS to', to, ':', body);
        return { success: true, sid: 'mock_' + Date.now() };
    }

    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
        const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
        const params = new URLSearchParams({ To: to, From: TWILIO_PHONE, Body: body });

        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await res.json();
        if (res.ok) return { success: true, sid: data.sid };
        return { success: false, error: data.message };
    } catch (err: any) {
        console.error('[TWILIO] Error:', err.message);
        return { success: false, error: err.message };
    }
}

export async function sendAppointmentReminder(phone: string, studentName: string, counselorName: string, dateStr: string, timeStr: string) {
    return sendSMS(phone,
        `Hi ${studentName}! 🌿 Reminder: Your session with ${counselorName} is scheduled for ${dateStr} at ${timeStr}. Open KU Wellness to join. — KU Wellness`
    );
}

export async function sendNewMessageNotification(phone: string, recipientName: string, senderName: string) {
    return sendSMS(phone,
        `Hi ${recipientName}, you have a new message from ${senderName} on KU Wellness. Open the app to read it. — KU Wellness`
    );
}

export async function sendGroupSessionReminder(phone: string, studentName: string, sessionTitle: string, dateStr: string) {
    return sendSMS(phone,
        `Hi ${studentName}! 🧘 Your group session "${sessionTitle}" starts on ${dateStr}. Join from your KU Wellness dashboard. — KU Wellness`
    );
}

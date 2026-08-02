/**
 * Calendar Link Generator Utility
 * Generates "Add to Calendar" URLs for Google Calendar, Outlook, and .ics downloads.
 * Uses the same link-based approach as Calendly, Cal.com, etc.
 */

export interface CalendarEvent {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location?: string;       // e.g. Google Meet link
    organizer?: string;      // e.g. counselor name
}

/**
 * Format a Date to Google Calendar's required format: YYYYMMDDTHHmmSSZ
 */
function toGoogleDateFormat(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format a Date to Outlook's required ISO format (no milliseconds)
 */
function toOutlookDateFormat(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

/**
 * Format a Date to ICS DTSTART/DTEND format: YYYYMMDDTHHmmSS
 * Uses Africa/Nairobi (EAT, UTC+3) timezone by default.
 */
function toICSDateFormat(date: Date): string {
    // Offset the UTC date to EAT (UTC+3) for display purposes
    const eat = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    const y = eat.getUTCFullYear();
    const m = String(eat.getUTCMonth() + 1).padStart(2, '0');
    const d = String(eat.getUTCDate()).padStart(2, '0');
    const h = String(eat.getUTCHours()).padStart(2, '0');
    const mi = String(eat.getUTCMinutes()).padStart(2, '0');
    const s = String(eat.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${d}T${h}${mi}${s}`;
}

/**
 * Generate a Google Calendar "Add Event" URL.
 * Opens in a new tab and pre-fills the event form.
 *
 * @see https://github.com/nickel-nickel/add-to-calendar-links
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        details: event.description,
        dates: `${toGoogleDateFormat(event.startDate)}/${toGoogleDateFormat(event.endDate)}`,
    });

    if (event.location) {
        params.set('location', event.location);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook Web "Add Event" URL.
 * Works with both Outlook.com and Microsoft 365 accounts.
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
        rru: 'addevent',
        subject: event.title,
        body: event.description,
        startdt: toOutlookDateFormat(event.startDate),
        enddt: toOutlookDateFormat(event.endDate),
        path: '/calendar/action/compose',
    });

    if (event.location) {
        params.set('location', event.location);
    }

    return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

/**
 * Generate an ICS (iCalendar) string for a single event.
 * Compatible with Apple Calendar, Google Calendar (import), Outlook (import), and others.
 * Uses Africa/Nairobi timezone (EAT, UTC+3).
 */
export function generateICSString(event: CalendarEvent): string {
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@ku-wellness`;
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//KU Wellness//Calendar Sync//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        // VTIMEZONE for Africa/Nairobi (EAT, UTC+3 — no DST)
        'BEGIN:VTIMEZONE',
        'TZID:Africa/Nairobi',
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0300',
        'TZOFFSETTO:+0300',
        'TZNAME:EAT',
        'END:STANDARD',
        'END:VTIMEZONE',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART;TZID=Africa/Nairobi:${toICSDateFormat(event.startDate)}`,
        `DTEND;TZID=Africa/Nairobi:${toICSDateFormat(event.endDate)}`,
        `SUMMARY:${escapeICSText(event.title)}`,
        `DESCRIPTION:${escapeICSText(event.description)}`,
    ];

    if (event.location) {
        lines.push(`LOCATION:${escapeICSText(event.location)}`);
    }

    // Add 15-minute reminder
    lines.push(
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Session starting in 15 minutes',
        'END:VALARM',
    );

    lines.push('END:VEVENT', 'END:VCALENDAR');

    return lines.join('\r\n');
}

/**
 * Helper: build a CalendarEvent from appointment data.
 * Works on both server and client side.
 */
export function buildCalendarEvent(appointment: {
    date: string | Date;
    timeSlot: string;
    specialization?: string;
    otherPartyName?: string;
    meetLink?: string;
    reason?: string;
}): CalendarEvent {
    const date = new Date(appointment.date);
    const parts = appointment.timeSlot.split('-');

    let startH = 9, startM = 0, endH = 10, endM = 0;
    if (parts.length === 2) {
        const [sh, sm] = parts[0].trim().split(':').map(Number);
        const [eh, em] = parts[1].trim().split(':').map(Number);
        if (!isNaN(sh)) startH = sh;
        if (!isNaN(sm)) startM = sm;
        if (!isNaN(eh)) endH = eh;
        if (!isNaN(em)) endM = em;
    }

    // Build UTC dates from the appointment date + parsed time (in EAT)
    // The appointment.date is stored as a date-only value, times come from timeSlot
    const startDate = new Date(Date.UTC(
        date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        startH - 3, startM, 0  // Convert EAT to UTC by subtracting 3 hours
    ));
    const endDate = new Date(Date.UTC(
        date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        endH - 3, endM, 0
    ));

    const title = `KU Wellness: ${appointment.specialization || 'General'} Session${appointment.otherPartyName ? ` with ${appointment.otherPartyName}` : ''}`;

    let description = `${appointment.specialization || 'General'} counseling session`;
    if (appointment.reason) {
        description += `\nReason: ${appointment.reason}`;
    }
    if (appointment.meetLink) {
        description += `\nJoin: ${appointment.meetLink}`;
    }

    return {
        title,
        description,
        startDate,
        endDate,
        location: appointment.meetLink,
    };
}

/**
 * Escape special characters for ICS text values (RFC 5545 §3.3.11)
 */
function escapeICSText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

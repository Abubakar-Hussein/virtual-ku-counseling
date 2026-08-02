import nodemailer from 'nodemailer';
import { buildCalendarEvent, generateGoogleCalendarUrl, generateOutlookCalendarUrl, generateICSString } from './calendarLinks';

/* ------------------------------------------------------------------ */
/*  Transport Strategy                                                 */
/*                                                                     */
/*  1. If RESEND_API_KEY is set → use Resend HTTP API (bypasses SMTP   */
/*     firewalls entirely — recommended for university networks).      */
/*  2. Otherwise → fall back to SMTP (Gmail App Password).             */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Resend HTTP-based email sender (no extra packages needed)          */
/* ------------------------------------------------------------------ */

async function sendViaResend(
    apiKey: string,
    { from, to, subject, html, text, attachments }: { from: string; to: string; subject: string; html: string; text?: string; attachments?: Array<{ filename: string; content: string }> }
) {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ from, to: [to], subject, html, text, attachments }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend API error (${res.status}): ${body}`);
    }

    const data = await res.json();
    console.log('[EMAIL] Sent via Resend API →', to, '| id:', data.id);
    return data;
}

/* ------------------------------------------------------------------ */
/*  SMTP transporter (reused across calls in the same server process)  */
/* ------------------------------------------------------------------ */

let _smtpTransporter: nodemailer.Transporter | null = null;

function getSmtpTransporter() {
    if (_smtpTransporter) return _smtpTransporter;

    const port = Number(process.env.EMAIL_SERVER_PORT) || 587;
    const host = process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com';

    _smtpTransporter = nodemailer.createTransport({
        host,
        port,
        // Port 465 = implicit TLS (secure: true)
        // Port 587 = STARTTLS   (secure: false, upgrade via STARTTLS)
        secure: port === 465,
        auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        // Timeouts — generous but not infinite
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
        // Force TLS upgrade on port 587
        ...(port === 587 && {
            requireTLS: true,
            tls: {
                // Allow self-signed certs in dev; Gmail's cert is fine
                rejectUnauthorized: process.env.NODE_ENV === 'production',
                minVersion: 'TLSv1.2',
            },
        }),
        // Connection pooling
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
    } as any);

    return _smtpTransporter;
}

/* ------------------------------------------------------------------ */
/*  Generic send helper                                                */
/* ------------------------------------------------------------------ */

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{ filename: string; content: string }>;
}

export async function sendEmail({ to, subject, html, text, attachments }: SendEmailOptions) {
    const from = process.env.EMAIL_FROM || 'noreply@ku.ac.ke';
    const resendKey = process.env.RESEND_API_KEY;

    /* ── Strategy 1: Resend HTTP API (network-firewall-proof) ── */
    if (resendKey) {
        try {
            await sendViaResend(resendKey, { from, to, subject, html, text, attachments });
            return;
        } catch (err) {
            console.error('[EMAIL] Resend API failed, falling through to SMTP:', err);
            // Fall through to SMTP if Resend fails
        }
    }

    /* ── Strategy 2: SMTP via Nodemailer ── */
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
        console.warn('[EMAIL] SMTP credentials not set – skipping email to', to);
        return;
    }

    const transporter = getSmtpTransporter();

    // Verify SMTP connection before attempting to send
    try {
        await transporter.verify();
        console.log('[EMAIL] SMTP connection verified ✓');
    } catch (verifyErr: any) {
        console.error('[EMAIL] SMTP connection verification FAILED:', {
            code: verifyErr.code,
            message: verifyErr.message,
            host: process.env.EMAIL_SERVER_HOST,
            port: process.env.EMAIL_SERVER_PORT,
        });
        // Reset transporter so next attempt creates a fresh one
        _smtpTransporter = null;
        throw new Error(`SMTP connection failed: ${verifyErr.message}`);
    }

    // Send with a retry (one retry on transient failure)
    let lastError: any;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const info = await transporter.sendMail({ from, to, subject, html, text, attachments });
            console.log('[EMAIL] Sent via SMTP →', to, '| messageId:', info.messageId, '| response:', info.response);
            return;
        } catch (sendErr: any) {
            lastError = sendErr;
            console.error(`[EMAIL] SMTP send attempt ${attempt} failed:`, sendErr.message);
            if (attempt < 2) {
                // Reset transporter and wait before retrying
                _smtpTransporter = null;
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    throw lastError;
}

/* ------------------------------------------------------------------ */
/*  Diagnostic helper (exposed for the test-email route)              */
/* ------------------------------------------------------------------ */

export async function diagnoseEmailConfig(): Promise<{
    strategy: string;
    smtpHost: string | undefined;
    smtpPort: string | undefined;
    smtpUser: string | undefined;
    hasSmtpPassword: boolean;
    hasResendKey: boolean;
    smtpVerified: boolean;
    smtpError: string | null;
}> {
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const result = {
        strategy: hasResendKey ? 'Resend HTTP API (primary)' : 'SMTP only',
        smtpHost: process.env.EMAIL_SERVER_HOST,
        smtpPort: process.env.EMAIL_SERVER_PORT,
        smtpUser: process.env.EMAIL_SERVER_USER ? `${process.env.EMAIL_SERVER_USER.slice(0, 4)}***` : undefined,
        hasSmtpPassword: !!process.env.EMAIL_SERVER_PASSWORD,
        hasResendKey,
        smtpVerified: false,
        smtpError: null as string | null,
    };

    if (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD) {
        try {
            const transporter = getSmtpTransporter();
            await transporter.verify();
            result.smtpVerified = true;
        } catch (err: any) {
            result.smtpError = `${err.code || 'UNKNOWN'}: ${err.message}`;
            _smtpTransporter = null; // reset for next attempt
        }
    }

    return result;
}

/* ------------------------------------------------------------------ */
/*  Booking confirmation email                                         */
/* ------------------------------------------------------------------ */

interface BookingEmailParams {
    studentName: string;
    studentEmail: string;
    counselorName: string;
    date: Date;
    timeSlot: string;
    specialization: string;
    meetLink?: string | null;
}

export async function sendBookingConfirmationEmail(params: BookingEmailParams) {
    const { studentName, studentEmail, counselorName, date, timeSlot, specialization, meetLink } = params;
    const formattedDate = date.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const event = buildCalendarEvent({ date, timeSlot, specialization, otherPartyName: counselorName, meetLink: meetLink || undefined });
    const googleCalUrl = generateGoogleCalendarUrl(event);
    const outlookCalUrl = generateOutlookCalendarUrl(event);
    const icsContent = generateICSString(event);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Counseling Session Booked</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                KU Wellness
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Kenyatta University</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${studentName}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                Your counseling session has been successfully booked. Here are your session details:
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #dbeafe;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="6">
                      <tr>
                        <td style="width:140px;font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Counselor</td>
                        <td style="font-size:14px;color:#111827;font-weight:600;padding:6px 0;">${counselorName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Specialization</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${specialization}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Date</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Time</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${timeSlot}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                        <td style="padding:6px 0;">
                          <span style="background:#f0fdf4;color:#166534;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Confirmed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Google Meet CTA -->
              ${meetLink ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 28px;">
                    <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Google Meet Link</p>
                    <p style="margin:0 0 14px;font-size:13px;color:#4b7a5a;line-height:1.5;">
                      Your virtual counseling session will be held via Google Meet. Click the button below at your scheduled time to join.
                    </p>
                    <a href="${meetLink}" target="_blank"
                       style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      Join Google Meet →
                    </a>
                    <p style="margin:10px 0 0;font-size:11px;color:#6b7280;">
                      Or copy this link: <span style="color:#2563eb;">${meetLink}</span>
                    </p>
                  </td>
                </tr>
              </table>
              ` : `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 28px;">
                    <p style="margin:0 0 4px;font-size:13px;color:#9a3412;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Meeting Link Pending</p>
                    <p style="margin:0 0 0;font-size:13px;color:#9a3412;line-height:1.5;">
                      Your counselor has not yet assigned a Google Meet link for this session. The link will be provided to you soon.
                    </p>
                  </td>
                </tr>
              </table>
              `}

              <!-- Add to Calendar Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Add to Calendar</p>
                    <a href="${googleCalUrl}" target="_blank" style="display:inline-block;background:#4285F4;color:#ffffff;font-size:13px;font-weight:700;padding:10px 18px;border-radius:6px;text-decoration:none;margin-right:8px;">Google Calendar</a>
                    <a href="${outlookCalUrl}" target="_blank" style="display:inline-block;background:#0078D4;color:#ffffff;font-size:13px;font-weight:700;padding:10px 18px;border-radius:6px;text-decoration:none;">Outlook</a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                Kenyatta University Student Counseling Services
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Kenyatta University Student Counseling Services<br/>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

    const text = `
Hi ${studentName},

Your counseling session has been successfully booked.

Details:
Counselor: ${counselorName}
Specialization: ${specialization}
Date: ${formattedDate}
Time: ${timeSlot}
Status: Confirmed

Google Meet Link:
${meetLink || 'Your counselor will provide the link via the dashboard or student portal.'}

Please ensure the session is confirmed by your counselor before joining.
`.trim();

    await sendEmail({
        to: studentEmail,
        subject: `Session Booked – ${formattedDate} at ${timeSlot} | KU Wellness`,
        html,
        text,
        attachments: [{ filename: 'ku_wellness_session.ics', content: icsContent }],
    });
}

/* ------------------------------------------------------------------ */
/*  Registration Welcome Email                                        */
/* ------------------------------------------------------------------ */

interface RegistrationEmailParams {
    name: string;
    email: string;
    role: string;
}

export async function sendRegistrationEmail(params: RegistrationEmailParams) {
    const { name, email, role } = params;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to KU Wellness</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                Welcome to KU Wellness
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                You have successfully registered for the Kenyatta University Virtual Counseling system as a ${role}.
                You can now log in to the portal using your university email address.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;text-align:center;">
                <tr>
                  <td>
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?role=${role}" target="_blank"
                       style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      Log In Here →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

    const text = `
Hi ${name},

You have successfully registered for the Kenyatta University Virtual Counseling system as a ${role}.
You can now log in to the portal using your university email address.

Log in here: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?role=${role}
`.trim();

    await sendEmail({
        to: email,
        subject: `Welcome to KU Wellness`,
        html,
        text,
    });
}

/* ------------------------------------------------------------------ */
/*  Reset Password Email                                              */
/* ------------------------------------------------------------------ */

interface ResetPasswordEmailParams {
    name: string;
    email: string;
    resetToken: string;
}

export async function sendResetPasswordEmail(params: ResetPasswordEmailParams) {
    const { name, email, resetToken } = params;
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password - KU Wellness</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                KU Wellness
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                You requested a password reset. Please click the button below to reset your password. This link will expire in 1 hour.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;text-align:center;">
                <tr>
                  <td>
                    <a href="${resetUrl}" target="_blank"
                       style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
                If you did not request this, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

    const text = `
Hi ${name},

You requested a password reset. Please use the link below to reset your password. This link will expire in 1 hour.

Reset Password: ${resetUrl}

If you did not request this, please ignore this email.
`.trim();

    await sendEmail({
        to: email,
        subject: `Reset Your Password | KU Wellness`,
        html,
        text,
    });
}

/* ------------------------------------------------------------------ */
/*  Booking Request Email (sent on initial booking to BOTH parties)   */
/* ------------------------------------------------------------------ */

interface BookingRequestEmailParams {
    studentName: string;
    studentEmail: string;
    counselorName: string;
    counselorEmail: string;
    date: Date;
    timeSlot: string;
    specialization: string;
    reason: string;
}

export async function sendBookingRequestEmails(params: BookingRequestEmailParams) {
    const { studentName, studentEmail, counselorName, counselorEmail, date, timeSlot, specialization, reason } = params;
    const formattedDate = date.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // ── Email to Student: "Your booking has been submitted" ──
    const studentHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Request Submitted</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                KU Wellness
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Kenyatta University</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${studentName}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                Your counseling session request has been submitted and is awaiting confirmation from your counselor.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #dbeafe;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="6">
                      <tr>
                        <td style="width:140px;font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Counselor</td>
                        <td style="font-size:14px;color:#111827;font-weight:600;padding:6px 0;">${counselorName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Specialization</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${specialization}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Date</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Time</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${timeSlot}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                        <td style="padding:6px 0;">
                          <span style="background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Pending</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 28px;">
                    <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.5;">
                      You will receive another email once your counselor confirms or updates your appointment.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                Kenyatta University Student Counseling Services
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Kenyatta University Student Counseling Services<br/>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

    // ── Email to Counselor: "New booking request from student" ──
    const counselorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Booking Request</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                KU Wellness
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Kenyatta University</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${counselorName}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                You have received a new counseling session request from a student. Please review and confirm or decline.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #dbeafe;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="6">
                      <tr>
                        <td style="width:140px;font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Student</td>
                        <td style="font-size:14px;color:#111827;font-weight:600;padding:6px 0;">${studentName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Specialization</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${specialization}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Date</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Time</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${timeSlot}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Reason</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${reason}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;text-align:center;">
                <tr>
                  <td>
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/counselor/appointments" target="_blank"
                       style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      Review in Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                Kenyatta University Student Counseling Services
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Kenyatta University Student Counseling Services<br/>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

    // Send both emails in parallel
    const results = await Promise.allSettled([
        sendEmail({
            to: studentEmail,
            subject: `Booking Submitted – ${formattedDate} at ${timeSlot} | KU Wellness`,
            html: studentHtml,
            text: `Hi ${studentName},\n\nYour counseling session request has been submitted.\n\nCounselor: ${counselorName}\nSpecialization: ${specialization}\nDate: ${formattedDate}\nTime: ${timeSlot}\nStatus: Pending\n\nYou will receive another email once your counselor confirms the appointment.`,
        }),
        sendEmail({
            to: counselorEmail,
            subject: `New Booking Request from ${studentName} – ${formattedDate} | KU Wellness`,
            html: counselorHtml,
            text: `Hi ${counselorName},\n\nYou have a new booking request.\n\nStudent: ${studentName}\nSpecialization: ${specialization}\nDate: ${formattedDate}\nTime: ${timeSlot}\nReason: ${reason}\n\nPlease log in to your dashboard to confirm or decline.`,
        }),
    ]);

    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`[EMAIL] Booking request email ${i === 0 ? 'to student' : 'to counselor'} failed:`, r.reason);
        }
    });
}

/* ------------------------------------------------------------------ */
/*  Counselor Confirmation Email (when counselor confirms a session)  */
/* ------------------------------------------------------------------ */

interface CounselorConfirmEmailParams {
    counselorName: string;
    counselorEmail: string;
    studentName: string;
    date: Date;
    timeSlot: string;
    specialization: string;
    meetLink?: string | null;
}

export async function sendCounselorConfirmationEmail(params: CounselorConfirmEmailParams) {
    const { counselorName, counselorEmail, studentName, date, timeSlot, specialization, meetLink } = params;
    const formattedDate = date.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Session Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                KU Wellness
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Kenyatta University</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${counselorName}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                You have confirmed the following counseling session. Both you and the student have been notified.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="6">
                      <tr>
                        <td style="width:140px;font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Student</td>
                        <td style="font-size:14px;color:#111827;font-weight:600;padding:6px 0;">${studentName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Specialization</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${specialization}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Date</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Time</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${timeSlot}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                        <td style="padding:6px 0;">
                          <span style="background:#f0fdf4;color:#166534;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Confirmed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${meetLink ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 28px;">
                    <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Google Meet Link</p>
                    <a href="${meetLink}" target="_blank"
                       style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;margin-top:10px;">
                      Join Google Meet →
                    </a>
                    <p style="margin:10px 0 0;font-size:11px;color:#6b7280;">
                      Or copy: <span style="color:#2563eb;">${meetLink}</span>
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                Kenyatta University Student Counseling Services
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Kenyatta University Student Counseling Services<br/>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

    await sendEmail({
        to: counselorEmail,
        subject: `Session Confirmed – ${studentName} on ${formattedDate} | KU Wellness`,
        html,
        text: `Hi ${counselorName},\n\nYou have confirmed a session with ${studentName}.\n\nDate: ${formattedDate}\nTime: ${timeSlot}\nSpecialization: ${specialization}\n${meetLink ? `Meet Link: ${meetLink}` : ''}\n\nBoth you and the student have been notified.`,
    });
}

/* ------------------------------------------------------------------ */
/*  Counselor Pending Approval — notify admin                         */
/* ------------------------------------------------------------------ */

interface CounselorPendingApprovalParams {
    counselorName: string;
    counselorEmail: string;
    adminEmail: string;
    counselorId: string;
}

export async function sendCounselorPendingApprovalEmail(params: CounselorPendingApprovalParams) {
    const { counselorName, counselorEmail, adminEmail, counselorId } = params;
    const adminUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/users`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Counselor Registration – Approval Required</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                KU Wellness — Admin Alert
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Action Required</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>Administrator</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                A new counselor has registered and is awaiting your approval before they can access the platform.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #dbeafe;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="6">
                      <tr>
                        <td style="width:120px;font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Name</td>
                        <td style="font-size:14px;color:#111827;font-weight:600;padding:6px 0;">${counselorName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Email</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${counselorEmail}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                        <td style="padding:6px 0;">
                          <span style="background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Pending Approval</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;text-align:center;">
                <tr>
                  <td>
                    <a href="${adminUrl}" target="_blank"
                       style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      Review in Admin Panel →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                Kenyatta University — KU Wellness
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Kenyatta University Student Counseling Services<br/>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

    await sendEmail({
        to: adminEmail,
        subject: `New Counselor Registration Pending Approval — ${counselorName} | KU Wellness`,
        html,
        text: `A new counselor has registered and needs your approval.\n\nName: ${counselorName}\nEmail: ${counselorEmail}\n\nPlease log in to the admin panel to approve or reject: ${adminUrl}`,
    });
}

/* ------------------------------------------------------------------ */
/*  Counselor Approved — notify the counselor                         */
/* ------------------------------------------------------------------ */

interface CounselorApprovedParams {
    counselorName: string;
    counselorEmail: string;
}

export async function sendCounselorApprovedEmail(params: CounselorApprovedParams) {
    const { counselorName, counselorEmail } = params;
    const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?role=counselor`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Approved — KU Wellness</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#16a34a 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                KU Wellness
              </h1>
              <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">Counselor Account Approved</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${counselorName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Great news! Your counselor account on <strong>KU Wellness</strong> has been reviewed and <strong style="color:#16a34a;">approved</strong> by the system administrator.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                You can now log in and start accepting student counseling sessions.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;text-align:center;">
                <tr>
                  <td>
                    <a href="${loginUrl}" target="_blank"
                       style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      Log In to Your Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                Kenyatta University — KU Wellness
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Kenyatta University Student Counseling Services<br/>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

    await sendEmail({
        to: counselorEmail,
        subject: `Your Counselor Account Has Been Approved | KU Wellness`,
        html,
        text: `Hi ${counselorName},\n\nYour counselor account on KU Wellness has been approved by the administrator.\n\nYou can now log in here: ${loginUrl}\n\nWelcome aboard!`,
    });
}

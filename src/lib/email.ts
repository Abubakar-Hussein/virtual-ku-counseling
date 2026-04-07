import nodemailer from 'nodemailer';

/* ------------------------------------------------------------------ */
/*  Transporter (reused across calls in the same server process)       */
/* ------------------------------------------------------------------ */

function createTransporter() {
    const port = Number(process.env.EMAIL_SERVER_PORT) || 465;
    return nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
        },
    });
}

/* ------------------------------------------------------------------ */
/*  Generic send helper                                                 */
/* ------------------------------------------------------------------ */

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
    const from = process.env.EMAIL_FROM || 'noreply@ku.ac.ke';

    // Skip silently if credentials are not configured
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
        console.warn('[EMAIL] SMTP credentials not set – skipping email to', to);
        return;
    }

    const transporter = createTransporter();
    await transporter.sendMail({ from, to, subject, html, text });
    console.log('[EMAIL] Sent to', to, '—', subject);
}

/* ------------------------------------------------------------------ */
/*  Booking confirmation email                                          */
/* ------------------------------------------------------------------ */

interface BookingEmailParams {
    studentName: string;
    studentEmail: string;
    counselorName: string;
    date: Date;
    timeSlot: string;
    specialization: string;
    appointmentId: string;
}

function buildMeetLink(appointmentId: string): string {
    const base = process.env.GOOGLE_MEET_BASE_URL || 'https://meet.google.com';
    // Generate a short, unique-ish meet code from the appointment's ID
    const code = appointmentId.slice(-10).replace(/(.{3})(.{4})(.{3})/, '$1-$2-$3');
    return `${base}/${code}`;
}

export async function sendBookingConfirmationEmail(params: BookingEmailParams) {
    const { studentName, studentEmail, counselorName, date, timeSlot, specialization, appointmentId } = params;

    const meetLink = buildMeetLink(appointmentId);
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
                🎓 KU Virtual Counseling
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
                          <span style="background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;">Pending Confirmation</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Google Meet CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 28px;">
                    <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">📹 Google Meet Link</p>
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

              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                ⚠️ Please ensure the session is confirmed by your counselor before joining. 
                You will receive another notification once your booking is confirmed.
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
Status: Pending Confirmation

Google Meet Link:
${meetLink}

Please ensure the session is confirmed by your counselor before joining.
`.trim();

    await sendEmail({
        to: studentEmail,
        subject: `✅ Session Booked – ${formattedDate} at ${timeSlot} | KU Counseling`,
        html,
        text,
    });
}

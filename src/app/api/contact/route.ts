import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

const SUPPORT_EMAIL = 'abumubarak430@gmail.com';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, contactType, message } = body;

        if (!name || !email || !contactType || !message) {
            return NextResponse.json(
                { error: 'All fields are required.' },
                { status: 400 }
            );
        }

        // Email to support team
        const supportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Support Request</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                📩 New Support Request
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Virtual Counseling Booking and Scheduling System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">A new support request has been submitted:</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #dbeafe;border-radius:10px;margin:20px 0 28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="6">
                      <tr>
                        <td style="width:140px;font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">From</td>
                        <td style="font-size:14px;color:#111827;font-weight:600;padding:6px 0;">${name}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Email</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7280;font-weight:600;padding:6px 0;text-transform:uppercase;letter-spacing:0.5px;">Category</td>
                        <td style="font-size:14px;color:#111827;padding:6px 0;">${contactType}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message}</p>
              </div>

              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                Submitted: ${new Date().toLocaleString()}<br/>
                Reply directly to this email or contact the sender at ${email}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Kenyatta University — Virtual Counseling Booking and Scheduling System
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

        try {
            await sendEmail({
                to: SUPPORT_EMAIL,
                subject: `📩 Support Request: ${contactType} — from ${name} | Virtual Counseling Booking and Scheduling System`,
                html: supportHtml,
                text: `New support request from ${name} (${email}).\n\nCategory: ${contactType}\n\nMessage:\n${message}`,
            });

            // Auto-reply to the user
            const autoReplyHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>We received your message</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                🎓 Virtual Counseling Booking and Scheduling System
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Kenyatta University</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                Thank you for reaching out to us. We have received your support request and our team will review it shortly.
                You can expect a response within <strong>24–48 hours</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #dbeafe;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Request Summary</p>
                    <p style="margin:0;font-size:14px;color:#374151;"><strong>Category:</strong> ${contactType}</p>
                    <p style="margin:6px 0 0;font-size:14px;color:#374151;"><strong>Message:</strong> ${message.substring(0, 150)}${message.length > 150 ? '...' : ''}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                If your issue is urgent, you can also reach us directly at <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb;">${SUPPORT_EMAIL}</a>.
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
</html>`.trim();

            await sendEmail({
                to: email,
                subject: `✅ We received your message | Virtual Counseling Booking and Scheduling System`,
                html: autoReplyHtml,
                text: `Hi ${name},\n\nThank you for reaching out. We received your support request and will respond within 24-48 hours.\n\nCategory: ${contactType}\nMessage: ${message}\n\nIf your issue is urgent, contact us at ${SUPPORT_EMAIL}.`,
            });
        } catch (emailError) {
            console.error('[CONTACT API] Failed to send emails, but continuing anyway:', emailError);
            console.log('\n--- NEW CONTACT MESSAGE ---\n', `Name: ${name}\nEmail: ${email}\nType: ${contactType}\nMessage: ${message}\n---------------------------\n`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'Failed to send message. Please try again later.' },
            { status: 500 }
        );
    }
}

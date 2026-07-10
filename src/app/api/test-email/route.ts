import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, diagnoseEmailConfig } from '@/lib/email';

export async function GET(req: NextRequest) {
    try {
        const testEmail = req.nextUrl.searchParams.get('email') || process.env.EMAIL_SERVER_USER;
        const diagnoseOnly = req.nextUrl.searchParams.get('diagnose') === 'true';

        // Diagnostics mode — check configuration without sending
        if (diagnoseOnly) {
            const diagnosis = await diagnoseEmailConfig();
            return NextResponse.json({ diagnosis });
        }

        if (!testEmail) {
            return NextResponse.json({ error: 'No email address provided to send test to.' }, { status: 400 });
        }

        console.log(`[TEST EMAIL] Attempting to send test email to: ${testEmail}`);

        const startTime = Date.now();
        await sendEmail({
            to: testEmail,
            subject: 'Test Email from KU Wellness App',
            html: `
                <div style="font-family:sans-serif;padding:24px;">
                    <h1 style="color:#1a3a5c;">SMTP Configuration Test</h1>
                    <p>If you are reading this, your email configuration is working correctly!</p>
                    <p style="color:#6b7280;font-size:13px;">Sent at: ${new Date().toISOString()}</p>
                </div>
            `,
        });
        const elapsed = Date.now() - startTime;

        return NextResponse.json({
            message: `Test email successfully sent to ${testEmail}`,
            deliveryTimeMs: elapsed,
        });
    } catch (error: any) {
        console.error('[TEST EMAIL] Error sending test email:', error);

        // Also include diagnosis info in the error response
        let diagnosis = null;
        try {
            diagnosis = await diagnoseEmailConfig();
        } catch { /* ignore */ }

        return NextResponse.json(
            {
                error: 'Failed to send email',
                details: error.message,
                diagnosis,
            },
            { status: 500 }
        );
    }
}

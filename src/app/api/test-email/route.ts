import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
    try {
        const testEmail = req.nextUrl.searchParams.get('email') || process.env.EMAIL_SERVER_USER;
        
        if (!testEmail) {
            return NextResponse.json({ error: 'No email address provided to send test to.' }, { status: 400 });
        }

        console.log(`[TEST EMAIL] Attempting to send test email to: ${testEmail}`);
        
        await sendEmail({
            to: testEmail,
            subject: 'Test Email from KU Counseling App',
            html: `<h1>SMTP Configuration Test</h1><p>If you are reading this, your email configuration is working correctly!</p>`,
        });

        return NextResponse.json({ message: `Test email successfully sent to ${testEmail}` });
    } catch (error: any) {
        console.error('[TEST EMAIL] Error sending test email:', error);
        return NextResponse.json({ error: 'Failed to send email', details: error.message }, { status: 500 });
    }
}

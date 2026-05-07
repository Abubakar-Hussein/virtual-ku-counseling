import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import { sendResetPasswordEmail } from '@/lib/email';
import { createRateLimiter } from '@/lib/rateLimit';

// 3 forgot-password attempts per IP per 15 minutes
const forgotPasswordLimiter = createRateLimiter({ limit: 3, windowMs: 15 * 60 * 1000 });

export async function POST(req: NextRequest) {
    const limited = forgotPasswordLimiter(req);
    if (limited) return limited;

    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ email });

        if (!user) {
            // Return success even if user not found for security (prevent email enumeration)
            return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetPasswordExpires;
        await user.save();

        // Send email — don't let email failures block the response
        try {
            await sendResetPasswordEmail({
                name: user.name,
                email: user.email,
                resetToken,
            });
        } catch (emailError: any) {
            console.error('FORGOT_PASSWORD_EMAIL_ERROR', emailError?.message || emailError);
            // Token is saved, so even if email fails now the user can retry.
            // Don't return a 500 — the reset token exists in the DB.
        }

        return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (error: any) {
        console.error('FORGOT_PASSWORD_ERROR', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


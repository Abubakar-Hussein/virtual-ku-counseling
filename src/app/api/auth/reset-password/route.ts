import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import { createRateLimiter } from '@/lib/rateLimit';

// 5 password-reset attempts per IP per 15 minutes
const resetPasswordLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

export async function POST(req: NextRequest) {
    const limited = resetPasswordLimiter(req);
    if (limited) return limited;

    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return NextResponse.json({ error: 'Password reset token is invalid or has expired' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return NextResponse.json({ message: 'Password has been reset successfully' });
    } catch (error: any) {
        console.error('RESET_PASSWORD_ERROR', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

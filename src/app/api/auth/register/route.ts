import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connectDB } from '@/lib/mongodb';
import { sendRegistrationEmail, sendCounselorPendingApprovalEmail } from '@/lib/email';
import User from '@/models/User';
import CounselorProfile from '@/models/CounselorProfile';
import { logAction } from '@/lib/audit';
import { createRateLimiter } from '@/lib/rateLimit';

// 5 registration attempts per IP per 15 minutes
const registerLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

export async function POST(req: NextRequest) {
    const limited = registerLimiter(req);
    if (limited) return limited;

    try {
        const body = await req.json();
        const { firstName, lastName, name: providedName, email, password, role, studentId, phone } = body;

        let name = providedName;
        if (!name && firstName && lastName) {
            name = `${firstName} ${lastName}`;
        }

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Name, email, password and role are required' }, { status: 400 });
        }

        const isStudentEmail = /^[^\s@]+@students\.ku\.ac\.ke$/.test(email);
        const isStaffEmail = /^[^\s@]+@ku\.ac\.ke$/.test(email);
        const isGmail = /^[^\s@]+@gmail\.com$/.test(email);

        if (role === 'student' && !isStudentEmail) {
            return NextResponse.json({ error: 'Students must use a @students.ku.ac.ke email' }, { status: 400 });
        }

        if (role === 'admin' && !isStaffEmail) {
            return NextResponse.json({ error: 'Administrators must use a @ku.ac.ke email' }, { status: 400 });
        }

        if (role === 'counselor' && !isStaffEmail && !isGmail) {
            return NextResponse.json({ error: 'Counselors must use a @ku.ac.ke or @gmail.com email' }, { status: 400 });
        }

        if (!isStudentEmail && !isStaffEmail && !isGmail) {
            return NextResponse.json({ error: 'Email must be a valid university (@ku.ac.ke) or @gmail.com address' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        if (phone) {
            const phoneRegex = /^\+2547\d{8}$/;
            if (!phoneRegex.test(phone)) {
                return NextResponse.json({ error: 'Phone number must be in format +2547XXXXXXXX (13 characters)' }, { status: 400 });
            }
        }

        await connectDB();

        const existing = await User.findOne({ email });
        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }

        let finalRole = role || 'student';
        if (email.toLowerCase() === 'admin@ku.ac.ke') {
            finalRole = 'admin';
        }

        // Counselors must be approved by admin before they can log in
        const isCounselor = finalRole === 'counselor';
        const approvalStatus = isCounselor ? 'pending' : 'approved';

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstName,
            lastName,
            name,
            email,
            password: hashed,
            role: finalRole,
            approvalStatus,
            studentId,
            phone,
        });

        // Audit Log
        await logAction({
            userId: user._id.toString(),
            userName: user.name,
            action: 'REGISTER',
            resource: 'USER',
            details: `New account created with role: ${finalRole}${isCounselor ? ' (pending approval)' : ''}`,
            ipAddress: req.headers.get('x-forwarded-for') || undefined
        });

        // Create a CounselorProfile so admin can assign meeting links immediately
        if (isCounselor) {
            await CounselorProfile.findOneAndUpdate(
                { userId: user._id },
                { $setOnInsert: { userId: user._id, specializations: [], bio: '', availableSlots: [], meetLink: '' } },
                { upsert: true, new: true }
            );
        }

        if (isCounselor) {
            // Notify admin that a counselor needs approval
            try {
                const adminEmail = process.env.ADMIN_EMAIL || 'admin@ku.ac.ke';
                await sendCounselorPendingApprovalEmail({
                    counselorName: name,
                    counselorEmail: email,
                    adminEmail,
                    counselorId: user._id.toString(),
                });
            } catch (err) {
                console.error('[EMAIL ERROR]: Failed to send admin notification', err);
            }

            return NextResponse.json(
                { message: 'Registration submitted. Your account is pending admin approval. You will receive an email once approved.', userId: user._id.toString(), pending: true },
                { status: 201 }
            );
        }

        // Non-counselor: send welcome email immediately
        try {
            await sendRegistrationEmail({ name, email, role: finalRole });
        } catch (err) {
            console.error('[EMAIL ERROR]: Failed to send registration email', err);
        }

        return NextResponse.json(
            { message: 'Account created successfully', userId: user._id.toString() },
            { status: 201 }
        );
    } catch (err: any) {
        console.error('[REGISTER ERROR FULL]:', err);

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val: any) => val.message);
            return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
        }

        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

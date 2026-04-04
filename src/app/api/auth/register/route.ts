import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, role, studentId, phone } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Name, email, password and role are required' }, { status: 400 });
        }

        const isStudentEmail = /^[^\s@]+@students\.ku\.ac\.ke$/.test(email);
        const isStaffEmail = /^[^\s@]+@ku\.ac\.ke$/.test(email);

        if (role === 'student' && !isStudentEmail) {
            return NextResponse.json({ error: 'Students must use a @students.ku.ac.ke email' }, { status: 400 });
        }

        if ((role === 'counselor' || role === 'admin') && !isStaffEmail) {
            return NextResponse.json({ error: 'Staff must use a @ku.ac.ke email' }, { status: 400 });
        }

        if (!isStudentEmail && !isStaffEmail) {
            return NextResponse.json({ error: 'Email must be a valid university address' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        await connectDB();

        const existing = await User.findOne({ email });
        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }

        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({
            name,
            email,
            password: hashed,
            role: role || 'student',
            studentId,
            phone,
        });

        return NextResponse.json(
            { message: 'Account created successfully', userId: user._id.toString() },
            { status: 201 }
        );
    } catch (err: any) {
        console.error('[REGISTER ERROR FULL]:', err);

        // Handle Mongoose validation errors specifically
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val: any) => val.message);
            return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
        }

        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

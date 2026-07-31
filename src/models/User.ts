import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IUser extends Document {
    firstName?: string;
    lastName?: string;
    name: string;
    email: string;
    password: string;
    role: 'student' | 'counselor' | 'admin';
    approvalStatus?: 'pending' | 'approved';
    studentId?: string;
    phone?: string;
    smsConsent?: boolean;
    profileImage?: string;
    calendarProvider?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        name: { 
            type: String, 
            required: true, 
            trim: true,
            validate: {
                validator: (v: string) => /^[A-Za-z\s\-\']+$/.test(v),
                message: 'Name can only contain letters, spaces, hyphens, and apostrophes.'
            }
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            validate: {
                validator: (v: string) => /^[^\s@]+@students\.ku\.ac\.ke$/.test(v) || /^[^\s@]+@ku\.ac\.ke$/.test(v) || /^[^\s@]+@gmail\.com$/.test(v),
                message: 'Email must be a valid @ku.ac.ke, @students.ku.ac.ke or @gmail.com address',
            },
        },
        password: { type: String, required: true, minlength: 8 },
        role: { type: String, enum: ['student', 'counselor', 'admin'], default: 'student', index: true },
        approvalStatus: { type: String, enum: ['pending', 'approved'], default: 'approved' },
        studentId: { type: String },
        phone: {
            type: String,
            validate: {
                validator: (v: string) => !v || /^\+2547\d{8}$/.test(v),
                message: 'Phone number must be in format +2547XXXXXXXX',
            },
        },
        smsConsent: { type: Boolean, default: false },
        profileImage: { type: String },
        calendarProvider: { type: String },
        resetPasswordToken: { type: String, index: true, sparse: true },
        resetPasswordExpires: { type: Date },
    },
    { timestamps: true }
);

const User = models.User || model<IUser>('User', UserSchema);
export default User;

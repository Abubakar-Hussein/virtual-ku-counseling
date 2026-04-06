import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'counselor' | 'admin';
    studentId?: string;
    phone?: string;
    profileImage?: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            validate: {
                validator: (v: string) => /^[^\s@]+@students\.ku\.ac\.ke$/.test(v) || /^[^\s@]+@ku\.ac\.ke$/.test(v),
                message: 'Email must be a valid @ku.ac.ke or @students.ku.ac.ke address',
            },
        },
        password: { type: String, required: true, minlength: 8 },
        role: { type: String, enum: ['student', 'counselor', 'admin'], default: 'student' },
        studentId: { type: String },
        phone: { type: String },
        profileImage: { type: String },
    },
    { timestamps: true }
);

const User = models.User || model<IUser>('User', UserSchema);
export default User;

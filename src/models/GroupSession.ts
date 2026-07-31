import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupSession extends Document {
    title: string;
    description: string;
    topic: string;
    counselorId: mongoose.Types.ObjectId;
    scheduledAt: Date;
    duration: number; // minutes
    maxParticipants: number;
    enrolledStudents: mongoose.Types.ObjectId[];
    status: 'upcoming' | 'live' | 'completed' | 'cancelled';
    roomUrl?: string;
    isAnonymous: boolean;
    tags: string[];
    createdAt: Date;
}

const GroupSessionSchema = new Schema<IGroupSession>({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    topic: { type: String, required: true, enum: ['Anxiety Management', 'Stress Relief', 'Exam Preparation', 'Grief Support', 'Self-Esteem Building', 'Mindfulness', 'Career Guidance', 'Relationship Skills', 'General Wellness'] },
    counselorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    maxParticipants: { type: Number, default: 20 },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['upcoming', 'live', 'completed', 'cancelled'], default: 'upcoming' },
    roomUrl: String,
    isAnonymous: { type: Boolean, default: true },
    tags: [String],
}, { timestamps: true });

export default mongoose.models.GroupSession || mongoose.model<IGroupSession>('GroupSession', GroupSessionSchema);

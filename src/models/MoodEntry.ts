import mongoose, { Schema, Document } from 'mongoose';

export interface IMoodEntry extends Document {
    studentId: mongoose.Types.ObjectId;
    date: Date;
    mood: number;
    energy: number;
    sleep: number;
    anxiety: number;
    journal?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const MoodEntrySchema: Schema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    mood: { type: Number, required: true, min: 1, max: 10 },
    energy: { type: Number, min: 1, max: 5, default: 3 },
    sleep: { type: Number, min: 1, max: 5, default: 3 },
    anxiety: { type: Number, min: 1, max: 5, default: 3 },
    journal: { type: String, maxlength: 2000 },
    tags: [{ type: String }],
}, { timestamps: true });

MoodEntrySchema.index({ studentId: 1, date: -1 }, { unique: true });
MoodEntrySchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.models.MoodEntry || mongoose.model<IMoodEntry>('MoodEntry', MoodEntrySchema);

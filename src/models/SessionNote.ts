import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionNote extends Document {
    appointmentId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    counselorId: mongoose.Types.ObjectId;
    notes: string;
    actionItems: string;
    progressIndicator: string; // e.g., 'Improved', 'Stable', 'Declined'
    createdAt: Date;
    updatedAt: Date;
}

const SessionNoteSchema: Schema = new Schema({
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    counselorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, required: true }, // In a real production system, this should be encrypted
    actionItems: { type: String, default: '' },
    progressIndicator: { type: String, enum: ['Improved', 'Stable', 'Declined', 'Not Evaluated'], default: 'Not Evaluated' },
}, { timestamps: true });

// Indexes for fast retrieval by student or counselor
SessionNoteSchema.index({ studentId: 1, createdAt: -1 });
SessionNoteSchema.index({ counselorId: 1 });
// Compound index for clinical progress report filtering
SessionNoteSchema.index({ createdAt: -1, progressIndicator: 1 });

export default mongoose.models.SessionNote || mongoose.model<ISessionNote>('SessionNote', SessionNoteSchema);

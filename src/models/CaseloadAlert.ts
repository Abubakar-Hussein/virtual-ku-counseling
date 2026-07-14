import mongoose, { Schema, Document } from 'mongoose';

export interface ICaseloadAlert extends Document {
    counselorId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    type: string;
    message: string;
    severity: string;
    acknowledged: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CaseloadAlertSchema: Schema = new Schema({
    counselorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['low_mood', 'mood_decline', 'inactivity', 'missed_session', 'high_urgency'], required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    acknowledged: { type: Boolean, default: false },
}, { timestamps: true });

CaseloadAlertSchema.index({ counselorId: 1, acknowledged: 1 });
CaseloadAlertSchema.index({ counselorId: 1, createdAt: -1 });
CaseloadAlertSchema.index({ counselorId: 1, studentId: 1, type: 1 });

export default mongoose.models.CaseloadAlert || mongoose.model<ICaseloadAlert>('CaseloadAlert', CaseloadAlertSchema);

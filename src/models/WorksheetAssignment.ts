import mongoose, { Schema, Document } from 'mongoose';

export interface IWorksheetAssignment extends Document {
    worksheetId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    counselorId: mongoose.Types.ObjectId;
    status: 'pending' | 'in_progress' | 'completed' | 'reviewed';
    responses: { questionId: string; answer: any }[];
    counselorFeedback?: string;
    assignedAt: Date;
    completedAt?: Date;
    reviewedAt?: Date;
}

const WorksheetAssignmentSchema = new Schema<IWorksheetAssignment>({
    worksheetId: { type: Schema.Types.ObjectId, ref: 'Worksheet', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    counselorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'reviewed'], default: 'pending' },
    responses: [{ questionId: String, answer: Schema.Types.Mixed }],
    counselorFeedback: String,
    assignedAt: { type: Date, default: Date.now },
    completedAt: Date,
    reviewedAt: Date,
}, { timestamps: true });

export default mongoose.models.WorksheetAssignment || mongoose.model<IWorksheetAssignment>('WorksheetAssignment', WorksheetAssignmentSchema);

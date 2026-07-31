import mongoose, { Schema, Document } from 'mongoose';

export interface IWorksheet extends Document {
    title: string;
    description: string;
    category: string;
    questions: {
        id: string;
        type: 'text' | 'scale' | 'multiChoice' | 'checkbox';
        label: string;
        options?: string[];
        required: boolean;
    }[];
    createdBy: mongoose.Types.ObjectId;
    isTemplate: boolean;
    createdAt: Date;
}

const WorksheetSchema = new Schema<IWorksheet>({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General', enum: ['CBT', 'Anxiety', 'Depression', 'Stress', 'Self-Esteem', 'Relationships', 'General'] },
    questions: [{
        id: { type: String, required: true },
        type: { type: String, enum: ['text', 'scale', 'multiChoice', 'checkbox'], required: true },
        label: { type: String, required: true },
        options: [String],
        required: { type: Boolean, default: true },
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isTemplate: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Worksheet || mongoose.model<IWorksheet>('Worksheet', WorksheetSchema);

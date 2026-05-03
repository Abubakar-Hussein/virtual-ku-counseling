import mongoose, { Schema, Document } from 'mongoose';

export interface IIntake extends Document {
    studentId: mongoose.Types.ObjectId;
    appointmentId: mongoose.Types.ObjectId;
    mood: number; // 1-10
    concerns: string[]; // ['Anxiety', 'Depression', 'Academic Stress', etc.]
    description: string;
    isUrgent: boolean;
    previousTherapy: boolean;
    createdAt: Date;
}

const IntakeSchema: Schema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    mood: { type: Number, required: true, min: 1, max: 10 },
    concerns: [{ type: String }],
    description: { type: String, required: true },
    isUrgent: { type: Boolean, default: false },
    previousTherapy: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Intake || mongoose.model<IIntake>('Intake', IntakeSchema);

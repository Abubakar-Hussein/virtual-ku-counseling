import mongoose, { Schema, Document } from 'mongoose';

export interface IIntake extends Document {
    studentId: mongoose.Types.ObjectId;
    appointmentId?: mongoose.Types.ObjectId;
    mood: number;
    concerns: string[];
    description: string;
    isUrgent: boolean;
    previousTherapy: boolean;
    // Extended fields for advanced intake
    sleepQuality?: number;
    anxietyLevel?: string;
    stressLevel?: number;
    preferredCounselorGender?: string;
    preferredSessionType?: string;
    goalsForCounseling?: string[];
    lifeSatisfaction?: number;
    socialSupport?: string;
    completedAt?: Date;
    createdAt: Date;
}

const IntakeSchema: Schema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', index: true },
    mood: { type: Number, required: true, min: 1, max: 10 },
    concerns: [{ type: String }],
    description: { type: String, required: true },
    isUrgent: { type: Boolean, default: false },
    previousTherapy: { type: Boolean, default: false },
    // Extended
    sleepQuality: { type: Number, min: 1, max: 5 },
    anxietyLevel: { type: String, enum: ['none', 'mild', 'moderate', 'severe'] },
    stressLevel: { type: Number, min: 1, max: 10 },
    preferredCounselorGender: { type: String, enum: ['male', 'female', 'no_preference'], default: 'no_preference' },
    preferredSessionType: { type: String, enum: ['in_person', 'virtual', 'no_preference'], default: 'no_preference' },
    goalsForCounseling: [{ type: String }],
    lifeSatisfaction: { type: Number, min: 1, max: 10 },
    socialSupport: { type: String, enum: ['strong', 'moderate', 'weak', 'none'] },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Intake || mongoose.model<IIntake>('Intake', IntakeSchema);

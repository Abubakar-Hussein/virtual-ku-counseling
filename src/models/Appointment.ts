import { Schema, Document, models, model } from 'mongoose';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface IAppointment extends Document {
    studentId: Schema.Types.ObjectId;
    counselorId: Schema.Types.ObjectId;
    date: Date;
    timeSlot: string; // "09:00-10:00"
    specialization: string;
    status: AppointmentStatus;
    reason: string;
    notes?: string; // counselor-only notes
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        counselorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        timeSlot: { type: String, required: true },
        specialization: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: 'pending',
        },
        reason: { type: String, required: true },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

// Index for efficient counselor schedule queries
AppointmentSchema.index({ counselorId: 1, date: 1 });
AppointmentSchema.index({ studentId: 1, date: -1 });

export default models.Appointment || model<IAppointment>('Appointment', AppointmentSchema);

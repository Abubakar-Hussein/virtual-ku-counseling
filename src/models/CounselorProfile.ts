import { Schema, Document, models, model } from 'mongoose';

export type Specialization = 'academic' | 'career' | 'mental_health';

export interface ITimeSlot {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
    startTime: string; // "09:00"
    endTime: string;   // "10:00"
}

export interface ICounselorProfile extends Document {
    userId: Schema.Types.ObjectId;
    specializations: Specialization[];
    bio: string;
    availableSlots: ITimeSlot[];
    maxDailyBookings: number;
    meetLink?: string;
}

const TimeSlotSchema = new Schema<ITimeSlot>({
    day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
}, { _id: false });

const CounselorProfileSchema = new Schema<ICounselorProfile>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        specializations: [{ type: String, enum: ['academic', 'career', 'mental_health'] }],
        bio: { type: String, default: '' },
        availableSlots: [TimeSlotSchema],
        maxDailyBookings: { type: Number, default: 8 },
        meetLink: { type: String, default: '' },
    },
    { timestamps: true }
);

export default models.CounselorProfile || model<ICounselorProfile>('CounselorProfile', CounselorProfileSchema);

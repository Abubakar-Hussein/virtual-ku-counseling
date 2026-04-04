import { Schema, Document, models, model } from 'mongoose';

export interface INotification extends Document {
    userId: Schema.Types.ObjectId;
    message: string;
    type: 'reminder' | 'confirmation' | 'cancellation' | 'general';
    read: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ['reminder', 'confirmation', 'cancellation', 'general'],
            default: 'general',
        },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1 });

export default models.Notification || model<INotification>('Notification', NotificationSchema);

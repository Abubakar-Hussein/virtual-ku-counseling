import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    content: string;
    messageType: 'text' | 'file' | 'system';
    fileUrl?: string;
    fileName?: string;
    read: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
    fileUrl: String,
    fileName: String,
    read: { type: Boolean, default: false },
    readAt: Date,
}, { timestamps: true });

MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

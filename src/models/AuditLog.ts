import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    userId: string;
    userName: string;
    action: string; // 'LOGIN', 'BOOK_APPOINTMENT', 'DELETE_USER', 'UPDATE_PROFILE', etc.
    details: string;
    resource: string; // 'USER', 'APPOINTMENT', 'PROFILE'
    ipAddress?: string;
    createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    resource: { type: String, required: true },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Indexes for faster searching by admin
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ resource: 1 });
// Compound indexes for report filtering (date range + action/resource)
AuditLogSchema.index({ createdAt: -1, action: 1 });
AuditLogSchema.index({ createdAt: -1, resource: 1 });
// TTL index: automatically delete logs older than 90 days to prevent unbounded growth
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Use safe pattern — never delete from mongoose.models in production
export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

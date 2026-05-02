import AuditLog from '@/models/AuditLog';
import { connectDB } from './mongodb';

interface AuditParams {
    userId: string;
    userName: string;
    action: string;
    resource: string;
    details: string;
    ipAddress?: string;
}

export async function logAction({ userId, userName, action, resource, details, ipAddress }: AuditParams) {
    try {
        await connectDB();
        await AuditLog.create({
            userId,
            userName,
            action,
            resource,
            details,
            ipAddress
        });
    } catch (error) {
        console.error('AUDIT_LOG_ERROR:', error);
        // We don't throw here to avoid breaking the main request flow
    }
}

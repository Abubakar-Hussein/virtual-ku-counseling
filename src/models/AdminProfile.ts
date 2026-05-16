import mongoose, { Schema, Document, models, model } from 'mongoose';

/**
 * AdminProfile — stores updatable fields for the hardcoded admin account.
 * The admin user has no MongoDB User document (credentials come from .env),
 * so this collection acts as their editable profile store.
 * Only one document ever exists (singleton keyed by adminKey: 'default').
 */
export interface IAdminProfile extends Document {
    adminKey: string; // always 'default' — singleton document
    name: string;
    phone: string;
    profileImage?: string;
}

const AdminProfileSchema = new Schema<IAdminProfile>(
    {
        adminKey: { type: String, default: 'default', unique: true },
        name: { type: String, default: 'System Administrator' },
        phone: { type: String, default: '' },
        profileImage: { type: String, default: null },
    },
    { timestamps: true }
);

export default models.AdminProfile || model<IAdminProfile>('AdminProfile', AdminProfileSchema);

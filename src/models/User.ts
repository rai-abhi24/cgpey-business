import mongoose, { Document, Schema, Types } from "mongoose";

export type UserRole = "ADMIN" | "MERCHANT" | "SUPPORT";

export interface IUser extends Document {
    _id: Types.ObjectId;
    userId: string;

    name?: string;
    email?: string;
    phone?: string;
    passwordHash?: string;

    role: UserRole;
    permissions?: string[]; // Fine-grained permissions

    merchantId?: Types.ObjectId | null;

    lastLoginAt?: Date;
    lastLoginIp?: string;
    lastActivityAt?: Date;

    isActive: boolean;
    deactivatedAt?: Date;
    deactivationReason?: string;

    metadata?: Record<string, any>;

    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        name: {
            type: String,
            trim: true,
        },

        email: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        phone: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            index: true,
        },

        passwordHash: {
            type: String,
            select: false, // Don't return in queries by default
        },

        role: {
            type: String,
            enum: ["ADMIN", "MERCHANT", "SUPPORT"],
            required: true,
            index: true,
        },

        permissions: [String],

        merchantId: {
            type: Schema.Types.ObjectId,
            ref: "Merchant",
            default: null,
            index: true,
        },

        lastLoginAt: { type: Date },
        lastLoginIp: String,
        lastActivityAt: { type: Date },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        deactivatedAt: Date,
        deactivationReason: String,

        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

UserSchema.index({ merchantId: 1, role: 1 });
UserSchema.index({ email: 1, isActive: 1 }, { sparse: true });
UserSchema.index({ phone: 1, isActive: 1 }, { sparse: true });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

export const User =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
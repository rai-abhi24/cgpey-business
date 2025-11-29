import mongoose, { Document, Schema, Types } from "mongoose";

export type UserRole = "ADMIN" | "MERCHANT";

export interface IUser extends Document {
    _id: Types.ObjectId;
    userId: string;

    email?: string;
    phone?: string;
    passwordHash?: string;
    role: UserRole;

    merchantId?: Types.ObjectId | null;

    lastLoginAt?: Date;
    isActive: boolean;

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

        email: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

        passwordHash: { type: String },

        role: {
            type: String,
            enum: ["ADMIN", "MERCHANT"],
            required: true,
            index: true,
        },

        merchantId: {
            type: Schema.Types.ObjectId,
            ref: "Merchant",
            default: null,
            index: true,
        },

        lastLoginAt: { type: Date },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

UserSchema.index({ merchantId: 1, role: 1 });

export const User =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISession extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    merchantId?: Types.ObjectId | null;
    deviceInfo: {
        ip?: string;
        userAgent?: string;
    };
    token: string;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        merchantId: {
            type: Schema.Types.ObjectId,
            ref: "Merchant",
            default: null,
            index: true,
        },

        deviceInfo: {
            ip: { type: String },
            userAgent: { type: String },
        },

        token: {
            type: String,
            required: true,
            unique: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: true }
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session =
    mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
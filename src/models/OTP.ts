import mongoose, { Schema, Document } from "mongoose";

export enum Purpose {
    LOGIN = "login",
    SIGNUP = "signup",
    VERIFY = "verify",
}

export interface IOtp extends Document {
    phone: string;
    otp: string;
    purpose: Purpose;
    isUsed: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
    {
        phone: { type: String, required: true, index: true },
        otp: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: Object.values(Purpose),
            default: Purpose.LOGIN,
        },
        isUsed: { type: Boolean, default: false },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ phone: 1, purpose: 1, isUsed: 1 });

export const Otp =
    mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
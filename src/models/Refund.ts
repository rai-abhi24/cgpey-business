import mongoose, { Document, Schema, Types } from "mongoose";

export enum RefundState {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

export type RefundInitiator = "merchant" | "system";

export interface IRefund extends Document {
    _id: Types.ObjectId;
    refundId: string;
    merchantId: Types.ObjectId;
    paymentId: Types.ObjectId;
    amount: number;
    reason?: string;
    gatewayRef?: string;
    state: RefundState;
    initiatedBy: RefundInitiator;
    initiatedAt?: Date;
    completedAt?: Date;
    meta?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
    {
        refundId: {
            type: String,
            required: true,
            unique: true,
        },

        merchantId: {
            type: Schema.Types.ObjectId,
            ref: "Merchant",
            required: true,
            index: true,
        },

        paymentId: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        reason: String,
        gatewayRef: String,

        state: {
            type: String,
            enum: Object.values(RefundState),
            default: RefundState.PENDING,
            index: true,
        },

        initiatedBy: {
            type: String,
            enum: ["merchant", "system"],
            default: "merchant",
        },

        initiatedAt: { type: Date },
        completedAt: { type: Date },

        meta: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

RefundSchema.index({ refundId: 1 }, { unique: true });

export const Refund =
    mongoose.models.Refund || mongoose.model<IRefund>("Refund", RefundSchema);
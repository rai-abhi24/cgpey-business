import mongoose, { Document, Schema, Types } from "mongoose";

export enum RefundState {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REVERSED = "REVERSED",
}

export type RefundInitiator = "merchant" | "system" | "support";

export interface IRefund extends Document {
    _id: Types.ObjectId;
    refundId: string;
    merchantId: Types.ObjectId;
    paymentId: Types.ObjectId;

    // Refund Details
    amount: number;
    currency: string;
    reason?: string;
    notes?: string;

    // Gateway Information
    gatewayRef?: string;
    gatewayResponse?: Record<string, any>;

    // Status
    state: RefundState;
    initiatedBy: RefundInitiator;
    initiatedByUserId?: Types.ObjectId;

    // Timing
    initiatedAt?: Date;
    processingAt?: Date;
    completedAt?: Date;
    failedAt?: Date;

    // Webhook Status
    webhookSent: boolean;
    webhookSentAt?: Date;
    webhookAttempts: number;

    // Reversal Information
    reversedAt?: Date;
    reversalReason?: string;

    // Metadata
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
            index: true,
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
            min: 1,
        },

        currency: {
            type: String,
            default: "INR",
        },

        reason: String,
        notes: String,

        gatewayRef: {
            type: String,
            index: true,
            sparse: true,
        },

        gatewayResponse: {
            type: Schema.Types.Mixed,
        },

        state: {
            type: String,
            enum: Object.values(RefundState),
            default: RefundState.PENDING,
            index: true,
        },

        initiatedBy: {
            type: String,
            enum: ["merchant", "system", "customer", "support"],
            default: "merchant",
        },

        initiatedByUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        initiatedAt: { type: Date },
        processingAt: { type: Date },
        completedAt: { type: Date },
        failedAt: { type: Date },

        webhookSent: {
            type: Boolean,
            default: false,
        },

        webhookSentAt: Date,
        webhookAttempts: {
            type: Number,
            default: 0,
        },

        reversedAt: Date,
        reversalReason: String,

        meta: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

RefundSchema.index({ paymentId: 1, state: 1 });
RefundSchema.index({ merchantId: 1, state: 1 });
RefundSchema.index({ initiatedAt: -1 });
RefundSchema.index({ gatewayRef: 1 }, { sparse: true });
RefundSchema.index({ webhookSent: 1 });

export const Refund =
    mongoose.models.Refund || mongoose.model<IRefund>("Refund", RefundSchema);
import mongoose, { Document, Schema, Types } from "mongoose";

export enum IncomingWebhookStatus {
    PENDING = "PENDING",
    PROCESSED = "PROCESSED",
    FAILED = "FAILED",
    IGNORED = "IGNORED",
}

export interface IIncomingWebhook extends Document {
    _id: Types.ObjectId;

    // Gateway Information
    gateway: string;
    event: string;
    gatewayWebhookId: string;

    // Payload & Security
    rawPayload: string;
    parsedPayload: Record<string, any>;
    signature: string;
    signatureVerified: boolean;

    // Processing Status
    status: IncomingWebhookStatus;
    processedAt?: Date;
    processingError?: string;
    processingDuration?: number; // ms

    // References
    paymentId?: Types.ObjectId;
    merchantId?: Types.ObjectId;
    refundId?: Types.ObjectId;

    // Metadata
    headers?: Record<string, string>;
    sourceIp?: string;
    userAgent?: string;

    createdAt: Date;
    updatedAt: Date;
}

const IncomingWebhookSchema = new Schema<IIncomingWebhook>(
    {
        gateway: {
            type: String,
            required: true,
            index: true
        },

        event: {
            type: String,
            required: true,
            index: true
        },

        gatewayWebhookId: {
            type: String,
            required: true,
            index: true
        },

        rawPayload: {
            type: String,
            required: true
        },

        parsedPayload: {
            type: Schema.Types.Mixed,
            required: true
        },

        signature: {
            type: String
        },

        signatureVerified: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: Object.values(IncomingWebhookStatus),
            default: IncomingWebhookStatus.PENDING,
            index: true,
        },

        processedAt: Date,
        processingError: String,
        processingDuration: Number,

        paymentId: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
            index: true
        },

        merchantId: {
            type: Schema.Types.ObjectId,
            ref: "Merchant",
            index: true
        },

        refundId: {
            type: Schema.Types.ObjectId,
            ref: "Refund",
            index: true
        },

        headers: {
            type: Schema.Types.Mixed
        },

        sourceIp: String,
        userAgent: String,
    },
    {
        timestamps: true
    }
);

// Prevent duplicate processing of same gateway webhook
IncomingWebhookSchema.index(
    { gateway: 1, gatewayWebhookId: 1 },
    { unique: true }
);

// Index for processing queue
IncomingWebhookSchema.index({
    status: 1,
    createdAt: 1
});

// Index for finding webhooks by references
IncomingWebhookSchema.index({
    paymentId: 1,
    gateway: 1,
    event: 1
});

export const IncomingWebhook =
    mongoose.models.IncomingWebhook || mongoose.model<IIncomingWebhook>("IncomingWebhook", IncomingWebhookSchema);
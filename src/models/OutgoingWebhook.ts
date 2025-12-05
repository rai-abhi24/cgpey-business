import mongoose, { Document, Schema, Types } from "mongoose";

export enum OutgoingWebhookStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
    RETRYING = "RETRYING",
}

export enum WebhookEventType {
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    PAYMENT_PENDING = "PAYMENT_PENDING",
    PAYMENT_EXPIRED = "PAYMENT_EXPIRED",

    REFUND_INITIATED = "REFUND_INITIATED",
    REFUND_PROCESSED = "REFUND_PROCESSED",
    REFUND_FAILED = "REFUND_FAILED",

    SETTLEMENT_CREATED = "SETTLEMENT_CREATED",
    SETTLEMENT_PROCESSED = "SETTLEMENT_PROCESSED",

    CHARGEBACK_INITIATED = "CHARGEBACK_INITIATED",
    CHARGEBACK_RESOLVED = "CHARGEBACK_RESOLVED",
}

export interface IOutgoingWebhook extends Document {
    _id: Types.ObjectId;

    // Merchant Information
    merchantId: Types.ObjectId;

    // Event Information
    eventType: WebhookEventType;

    // References
    paymentId: Types.ObjectId;
    refundId?: Types.ObjectId;
    settlementId?: Types.ObjectId;

    // Webhook Configuration
    url: string; // Target URL
    fallbackUrl?: string;
    secret?: string; // For HMAC signature

    // Payload
    payload: Record<string, any>;
    headers?: Record<string, string>;
    signature?: string; // HMAC signature

    // Delivery Status
    status: OutgoingWebhookStatus;
    attempts: number;
    maxAttempts: number;

    // Response Tracking
    responseStatus?: number;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    deliveredAt?: Date;

    // Retry Logic
    nextRetryAt?: Date;
    retryDelayMs: number;
    lastError?: string;
    lastAttemptAt?: Date;

    // Deduplication
    idempotencyKey: string; // hash(merchantId + paymentId + eventType + attempt)

    // Performance Metrics
    deliveryDuration?: number; // ms
    totalAttemptsDuration?: number; // ms

    // Metadata
    metadata?: Record<string, any>;

    createdAt: Date;
    updatedAt: Date;
}

const OutgoingWebhookSchema = new Schema<IOutgoingWebhook>(
    {
        merchantId: {
            type: Schema.Types.ObjectId,
            ref: "Merchant",
            required: true,
            index: true,
        },

        eventType: {
            type: String,
            enum: Object.values(WebhookEventType),
            required: true,
            index: true,
        },

        paymentId: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
            index: true,
        },

        refundId: {
            type: Schema.Types.ObjectId,
            ref: "Refund",
            index: true,
        },

        settlementId: {
            type: Schema.Types.ObjectId,
            ref: "Settlement",
            index: true,
        },

        url: {
            type: String,
            required: true,
        },

        fallbackUrl: String,
        secret: String,

        payload: {
            type: Schema.Types.Mixed,
            required: true,
        },

        headers: {
            type: Schema.Types.Mixed,
        },

        signature: String,

        status: {
            type: String,
            enum: Object.values(OutgoingWebhookStatus),
            default: OutgoingWebhookStatus.PENDING,
            index: true,
        },

        attempts: {
            type: Number,
            default: 0,
        },

        maxAttempts: {
            type: Number,
            default: 3,
        },

        responseStatus: Number,
        responseBody: String,
        responseHeaders: {
            type: Schema.Types.Mixed,
        },

        deliveredAt: Date,

        nextRetryAt: Date,
        retryDelayMs: {
            type: Number,
            default: 1000,
        },

        lastError: String,
        lastAttemptAt: Date,

        idempotencyKey: {
            type: String,
            required: true,
            index: true,
        },

        deliveryDuration: Number,
        totalAttemptsDuration: Number,

        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true
    }
);

// Index for deduplication - prevent sending same webhook multiple times
OutgoingWebhookSchema.index(
    {
        merchantId: 1,
        paymentId: 1,
        eventType: 1,
        status: 1
    },
    {
        name: "webhook_deduplication"
    }
);

// Index for retry queue
OutgoingWebhookSchema.index(
    {
        nextRetryAt: 1,
        attempts: 1
    },
    {
        partialFilterExpression: {
            status: OutgoingWebhookStatus.FAILED,
            attempts: { $lt: "$maxAttempts" }
        }
    }
);

// Index for finding webhooks by merchant and status
OutgoingWebhookSchema.index(
    {
        merchantId: 1,
        status: 1,
        createdAt: -1
    }
);

// Index for monitoring and reporting
OutgoingWebhookSchema.index(
    {
        eventType: 1,
        status: 1,
        createdAt: 1
    }
);

export const OutgoingWebhook =
    mongoose.models.OutgoingWebhook || mongoose.model<IOutgoingWebhook>("OutgoingWebhook", OutgoingWebhookSchema);
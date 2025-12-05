import mongoose, { Document, Schema, Types } from "mongoose";

export enum Gateway {
    PHONEPE = "PHONEPE",
}

export enum PaymentState {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED",
    REFUNDED = "REFUNDED"
}

export enum PaymentMode {
    UPI_QR = "UPI_QR",
    UPI_INTENT = "UPI_INTENT",
    UPI_COLLECT = "UPI_COLLECT",
    NET_BANKING = "NET_BANKING",
    CARD = "CARD",
}

export enum CheckoutType {
    STANDARD = "STANDARD",
    CUSTOM = "CUSTOM",
}

export interface IPayment extends Document {
    _id: Types.ObjectId;
    paymentId: string;
    merchantOrderId: string;
    merchantId: Types.ObjectId;
    merchantRedirectUrl?: string;

    customer?: {
        email?: string;
        phone?: string;
        name?: string;
        geoLocation?: {
            lat: number;
            lng: number;
        }
    };

    paymentMode: PaymentMode;
    amount: string;
    currency: string;
    refundableAmount: string; // Amount available for refund
    state: PaymentState;

    clientIp?: string;

    upi?: {
        type?: string;
        utr?: string;
        upiTransactionId?: string;
        vpa?: string;
    };

    card?: {
        last4?: string;
        network?: string;
        issuer?: string;
        token?: string;
    };

    gateway: Gateway;
    gatewayTxnId?: string;
    gatewayReference?: string; // Gateway's reference ID
    idempotencyKey?: string;
    checkoutType: CheckoutType;

    gatewayResponse?: Record<string, any>;

    // Webhook Status (ENHANCED)
    webhookStatus: {
        merchant: {
            successSent: boolean;
            failureSent: boolean;
            refundSent: boolean;
            lastSentAt?: Date;
            attempts: number;
            lastOutgoingWebhookId?: Types.ObjectId;
        };
        pg: {
            receivedAt?: Date;
            pgWebhookId?: string;
            eventType?: string;
            lastIncomingWebhookId?: Types.ObjectId;
        };
    };

    // Timing
    initiatedAt?: Date;
    completedAt?: Date;
    expiredAt?: Date;

    // Refund Information
    totalRefunded: number;
    refundCount: number;

    // Metadata
    metadata?: Record<string, any>;
    notes?: string;

    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema(
    {
        email: String,
        phone: String,
        name: String,
        userId: String,
    },
    { _id: false }
);

const UpiSchema = new Schema(
    {
        type: { type: String, enum: ["UPI"] },
        utr: { type: String, index: true },
        upiTransactionId: String,
        vpa: String,
    },
    { _id: false }
);

const CardSchema = new Schema(
    {
        last4: String,
        network: String,
        issuer: String,
        token: String,
    },
    { _id: false }
);

const MerchantWebhookStatusSchema = new Schema(
    {
        successSent: { type: Boolean, default: false },
        failureSent: { type: Boolean, default: false },
        refundSent: { type: Boolean, default: false },
        lastSentAt: Date,
        attempts: { type: Number, default: 0 },
        lastOutgoingWebhookId: { type: Schema.Types.ObjectId, ref: "OutgoingWebhook" },
    },
    { _id: false }
);

const PgWebhookStatusSchema = new Schema(
    {
        receivedAt: Date,
        pgWebhookId: String,
        eventType: String,
        lastIncomingWebhookId: { type: Schema.Types.ObjectId, ref: "IncomingWebhook" },
    },
    { _id: false }
);

const WebhookStatusSchema = new Schema(
    {
        merchant: { type: MerchantWebhookStatusSchema, required: true, default: {} },
        pg: { type: PgWebhookStatusSchema, required: true, default: {} },
    },
    { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
    {
        paymentId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        merchantOrderId: {
            type: String,
            required: true,
        },

        merchantId: {
            type: Schema.Types.ObjectId,
            ref: "Merchant",
            required: true,
            index: true,
        },

        customer: CustomerSchema,
        paymentMode: {
            type: String,
            enum: Object.values(PaymentMode),
            required: true,
        },

        amount: {
            type: String,
            required: true,
        },

        currency: {
            type: String,
            default: "INR",
        },

        refundableAmount: {
            type: String,
            default: function () { return this.amount; }
        },

        clientIp: String,

        state: {
            type: String,
            enum: Object.values(PaymentState),
            default: PaymentState.PENDING,
            index: true,
        },

        upi: UpiSchema,
        card: CardSchema,

        gateway: {
            type: String,
            enum: Object.values(Gateway),
            required: true,
            index: true,
        },

        gatewayTxnId: {
            type: String,
            index: true,
            sparse: true
        },

        gatewayReference: {
            type: String,
            index: true,
            sparse: true
        },

        idempotencyKey: {
            type: String,
            unique: true,
            sparse: true,
        },

        checkoutType: {
            type: String,
            enum: Object.values(CheckoutType),
            default: CheckoutType.STANDARD,
        },

        gatewayResponse: {
            type: Schema.Types.Mixed,
        },

        webhookStatus: WebhookStatusSchema,

        initiatedAt: Date,
        completedAt: Date,
        expiredAt: Date,

        totalRefunded: {
            type: Number,
            default: 0,
        },

        refundCount: {
            type: Number,
            default: 0,
        },

        metadata: {
            type: Schema.Types.Mixed,
        },

        notes: String,
    },
    {
        timestamps: true,
    }
);

PaymentSchema.index({ merchantId: 1, state: 1 });
PaymentSchema.index({ merchantId: 1, merchantOrderId: 1 }, { unique: true });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ updatedAt: -1 });
PaymentSchema.index({ 'upi.utr': 1 }, { sparse: true });
PaymentSchema.index({ state: 1, "webhookStatus.merchant.successSent": 1 });
PaymentSchema.index({ "customer.email": 1 }, { sparse: true });
PaymentSchema.index({ "customer.phone": 1 }, { sparse: true });
PaymentSchema.index({ amount: 1 });
PaymentSchema.index({ completedAt: 1 }, { sparse: true });

export const Payment =
    mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
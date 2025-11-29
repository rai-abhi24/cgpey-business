import mongoose, { Document, Schema, Types } from "mongoose";

export enum Gateway {
    PHONEPE = "PHONEPE",
}

export enum PaymentState {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED",
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
    merchantId: Types.ObjectId; // ref Merchant
    orderMetaInfo?: Record<string, any>;

    paymentMode: PaymentMode;
    amount: number;
    currency: string;
    state: PaymentState;

    upi?: {
        type?: string;
        utr?: string;
        upiTransactionId?: string;
        vpa?: string;
    };

    gateway: Gateway;
    gatewayTxnId?: string;
    idempotencyKey?: string;
    checkoutType: CheckoutType;

    gatewayResponse?: Record<string, any>;
    webhookApplied: boolean;

    initiatedAt?: Date;
    completedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        paymentId: {
            type: String,
            required: true,
            unique: true,
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

        orderMetaInfo: {
            type: Schema.Types.Mixed,
        },

        paymentMode: {
            type: String,
            enum: Object.values(PaymentMode),
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            default: "INR",
        },

        state: {
            type: String,
            enum: Object.values(PaymentState),
            default: PaymentState.PENDING,
            index: true,
        },

        upi: {
            type: {
                type: String,
                enum: ["UPI"],
            },
            utr: { type: String, index: true },
            upiTransactionId: { type: String },
            vpa: { type: String },
        },

        gateway: {
            type: String,
            enum: Object.values(Gateway),
            required: true,
        },

        gatewayTxnId: { type: String, index: true },

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

        webhookApplied: {
            type: Boolean,
            default: false,
        },

        initiatedAt: Date,
        completedAt: Date,
    },
    {
        timestamps: true,
    }
);

PaymentSchema.index({ merchantId: 1, state: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ updatedAt: -1 });
PaymentSchema.index(
    { merchantId: 1, merchantOrderId: 1 },
    { unique: true }
);

export const Payment =
    mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
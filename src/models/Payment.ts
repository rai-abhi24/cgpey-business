import mongoose, { Schema, Document } from "mongoose";

/* -------------------------------------------------------------
   1️⃣ Enums for controlled states — used across the platform
------------------------------------------------------------- */
export enum PaymentState {
    CREATED = "CREATED",
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED",
    UNKNOWN = "UNKNOWN",
}

export enum CheckoutType {
    STANDARD = "STANDARD",
    CUSTOM = "CUSTOM",
}

export enum RefundState {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

/* -------------------------------------------------------------
   2️⃣ TypeScript Interface for document typing
------------------------------------------------------------- */
export interface IPayment extends Document {
    paymentId: string; // internal system id for tracking
    merchantOrderId: string;
    merchantId?: string;

    gateway: string;
    gatewayTxnId?: string;
    idempotencyKey?: string;

    amount: number;
    currency: string;
    state: PaymentState;
    checkoutType: CheckoutType;

    meta?: Record<string, any>;
    metaInfo?: Record<string, any>;

    gatewayResponse?: Record<string, any>;
    webhookApplied: boolean;

    refund?: {
        refundId?: string;
        amount?: number;
        state?: RefundState | null;
        meta?: Record<string, any>;
        initiatedAt?: Date;
        completedAt?: Date;
    };

    createdAt?: Date;
    updatedAt?: Date;
}

/* -------------------------------------------------------------
   3️⃣ Sub-schema for better structure
------------------------------------------------------------- */
const RefundSchema = new Schema(
    {
        refundId: { type: String, index: true },
        amount: { type: Number },
        state: {
            type: String,
            enum: Object.values(RefundState),
            default: null,
            index: true,
        },
        meta: { type: Schema.Types.Mixed },
        initiatedAt: { type: Date },
        completedAt: { type: Date },
    },
    { _id: false }
);

/* -------------------------------------------------------------
   4️⃣ Main Payment Schema
------------------------------------------------------------- */
const PaymentSchema = new Schema<IPayment>(
    {
        // Core identifiers
        paymentId: { type: String, index: true },
        merchantOrderId: { type: String, required: true, index: true },
        merchantId: { type: String, index: true },

        // Gateway info
        gateway: { type: String, required: true, index: true },
        gatewayTxnId: { type: String, unique: true, sparse: true },
        idempotencyKey: { type: String, unique: true, sparse: true },

        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },

        state: {
            type: String,
            enum: Object.values(PaymentState),
            default: PaymentState.CREATED,
            index: true,
        },
        checkoutType: {
            type: String,
            enum: Object.values(CheckoutType),
            default: CheckoutType.STANDARD,
            index: true,
        },

        meta: { type: Schema.Types.Mixed },
        metaInfo: { type: Schema.Types.Mixed },

        gatewayResponse: { type: Schema.Types.Mixed },
        webhookApplied: { type: Boolean, default: false },
        refund: RefundSchema,
    },
    { timestamps: true }
);

/* -------------------------------------------------------------
   5️⃣ Indexes for performance
------------------------------------------------------------- */
PaymentSchema.index({ createdAt: -1 });

/* -------------------------------------------------------------
   6️⃣ Export Model
------------------------------------------------------------- */
export const Payment =
    mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
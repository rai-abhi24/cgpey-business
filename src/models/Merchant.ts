import mongoose, { Document, Schema, Types } from "mongoose";

export type MerchantMode = "UAT" | "PROD";

export interface IMerchant extends Document {
    merchantId: string;
    merchantName: string;
    businessName: string;
    businessEntityType: string;
    phonepeMerchantId?: string;

    email: string;
    phone: string;
    website: string;

    businessRegistrationNumber?: string;
    businessAddress?: string;

    perTransactionLimit: number;
    dailyTransactionLimit?: number;
    monthlyTransactionLimit?: number;

    totalTransactions: number;
    totalVolume: number;
    lastTransactionAt?: Date;

    webhookConfig: {
        enabled: boolean;
        url: string;
        fallbackUrl?: string;
        secret: string;
        timeoutMs: number;
        maxRetries: number;
        retryDelayMs: number;
        events: string[];
        alertOnFailure: boolean;
        alertEmail?: string;
    };

    allowedIPs?: string[];

    apiKeys: {
        uat: { publicKey: string; secretKey: string };
        prod: { publicKey: string; secretKey: string };
    };

    allowedModes: MerchantMode[];
    activeMode: MerchantMode;

    status: "pending" | "approved" | "rejected" | "suspended";
    canSwitchMode: boolean;
    isActive: boolean;

    approvedAt?: Date;
    approvedBy?: Types.ObjectId;
    suspendedAt?: Date;
    suspendedReason?: string;

    createdAt: Date;
    updatedAt: Date;
}

const ApiKeySchema = new Schema(
    {
        publicKey: { type: String, required: true },
        secretKey: { type: String, required: true },
    },
    { _id: false }
);

const WebhookConfigSchema = new Schema(
    {
        url: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        fallbackUrl: String,
        secret: { type: String, required: true },
        timeoutMs: { type: Number, default: 5000 },
        maxRetries: { type: Number, default: 3 },
        retryDelayMs: { type: Number, default: 1000 },
        events: { type: [String], default: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'REFUND_PROCESSED'] },
        alertOnFailure: { type: Boolean, default: true },
        alertEmail: String,
    },
    { _id: false }
);

const MerchantSchema = new Schema<IMerchant>(
    {
        merchantId: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        phonepeMerchantId: String,
        merchantName: { type: String, required: true },
        businessName: { type: String, required: true },
        businessEntityType: { type: String, required: true },

        // Contact Information
        email: { type: String, required: true, index: true },
        phone: { type: String, required: true, index: true },
        website: { type: String, required: true },

        // Business Details
        businessRegistrationNumber: String,
        businessAddress: String,

        // Limits
        perTransactionLimit: { type: Number, required: true },
        dailyTransactionLimit: Number,
        monthlyTransactionLimit: Number,

        totalTransactions: { type: Number, default: 0 },
        totalVolume: { type: Number, default: 0 },
        lastTransactionAt: Date,

        // Webhook Configuration
        webhookConfig: { type: WebhookConfigSchema, required: true },

        // IP Security
        allowedIPs: [String],

        // API Keys
        apiKeys: {
            uat: { type: ApiKeySchema, required: true },
            prod: { type: ApiKeySchema, required: true },
        },

        allowedModes: {
            type: [String],
            enum: ["UAT", "PROD"],
            default: ["UAT"],
        },

        activeMode: {
            type: String,
            enum: ["UAT", "PROD"],
            default: "UAT",
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "suspended"],
            default: "pending",
            index: true,
        },

        canSwitchMode: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        approvedAt: Date,
        approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
        suspendedAt: Date,
        suspendedReason: String,
    },
    { timestamps: true }
);

MerchantSchema.index({ status: 1, isActive: 1 });
MerchantSchema.index({ createdAt: -1 });
MerchantSchema.index({ "webhookConfig.enabled": 1 });
MerchantSchema.index({ "apiKeys.uat.publicKey": 1 }, { sparse: true });
MerchantSchema.index({ "apiKeys.prod.publicKey": 1 }, { sparse: true });

export const Merchant =
    mongoose.models.Merchant || mongoose.model<IMerchant>("Merchant", MerchantSchema);
import mongoose, { Document, Schema } from "mongoose";

export type MerchantMode = "UAT" | "PROD";

export interface IMerchant extends Document {
    merchantId: string;
    merchantName: string;
    businessName: string;
    businessEntityType: string;

    email: string;
    phone: string;
    website: string;
    perTransactionLimit: number;

    callbackUrls?: {
        uat?: string;
        prod?: string;
    };

    apiKeys: {
        uat: { publicKey: string; secretKey: string };
        prod: { publicKey: string; secretKey: string };
    };

    allowedModes: MerchantMode[];
    activeMode: MerchantMode;

    status: "pending" | "approved" | "rejected";
    canSwitchMode: boolean;
    isActive: boolean;

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

const MerchantSchema = new Schema<IMerchant>(
    {
        merchantId: { type: String, unique: true, required: true, index: true },

        merchantName: { type: String, required: true },
        businessName: { type: String, required: true },

        businessEntityType: { type: String, required: true },

        email: { type: String, required: true, index: true },
        phone: { type: String, required: true, index: true },

        website: { type: String, required: true },

        perTransactionLimit: { type: Number, required: true },

        callbackUrls: {
            uat: { type: String },
            prod: { type: String },
        },

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
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },

        canSwitchMode: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

MerchantSchema.index({ email: 1 });
MerchantSchema.index({ phone: 1 });

export const Merchant =
    mongoose.models.Merchant || mongoose.model<IMerchant>("Merchant", MerchantSchema);
import mongoose, { Schema, Document } from "mongoose";

export interface IWebhook extends Document {
    gateway: string;
    event: string;
    state?: string;
    signatureHash?: string;
    payload?: any;
    processed: boolean;
    processedAt?: Date;
    retries: number;
    lastError?: string;
    lastRetryAt?: Date;
}

const WebhookSchema = new Schema<IWebhook>(
    {
        gateway: { type: String, index: true },
        event: { type: String, index: true },
        state: { type: String },
        signatureHash: { type: String, unique: true, sparse: true },
        payload: { type: Schema.Types.Mixed },
        processed: { type: Boolean, default: false },
        processedAt: { type: Date },
        retries: { type: Number, default: 0 },
        lastError: { type: String },
        lastRetryAt: { type: Date },
    },
    { timestamps: true }
);

WebhookSchema.index({ gateway: 1, event: 1 });
WebhookSchema.index({ processed: 1 });

export const Webhook =
    mongoose.models.Webhook || mongoose.model<IWebhook>("Webhook", WebhookSchema);
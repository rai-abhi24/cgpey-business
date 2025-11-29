import { connectDB } from "@/lib/mongo";
import { Webhook } from "@/models";
import { Types } from "mongoose";

export async function listWebhooks(merchantId: string, limit = 50) {
    await connectDB();
    return Webhook.find({ merchantId }).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function replayWebhook(merchantId: string, webhookId: string) {
    await connectDB();
    if (!Types.ObjectId.isValid(webhookId)) {
        throw new Error("Invalid webhook id");
    }
    const webhook = await Webhook.findOne({ _id: webhookId, merchantId });
    if (!webhook) {
        throw new Error("Webhook not found");
    }

    webhook.retries += 1;
    webhook.lastRetryAt = new Date();
    webhook.processed = false;
    webhook.lastError = undefined;
    await webhook.save();

    return webhook.toObject();
}

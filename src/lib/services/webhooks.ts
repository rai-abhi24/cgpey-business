import { connectDB } from "@/lib/mongo";
import { IncomingWebhook } from "@/models";
import { Types } from "mongoose";

export async function listWebhooks(merchantId: string, limit = 50) {
    await connectDB();
    return IncomingWebhook.find({ merchantId }).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function replayWebhook(merchantId: string, webhookId: string) {
    await connectDB();
    if (!Types.ObjectId.isValid(webhookId)) {
        throw new Error("Invalid webhook id");
    }
    const webhook = await IncomingWebhook.findOne({ _id: webhookId, merchantId });
    if (!webhook) {
        throw new Error("Webhook not found");
    }

    // IncomingWebhook.retries += 1;
    // IncomingWebhook.lastRetryAt = new Date();
    // IncomingWebhook.processed = false;
    // IncomingWebhook.lastError = undefined;
    // await IncomingWebhook.save();

    // return IncomingWebhook.toObject();
}

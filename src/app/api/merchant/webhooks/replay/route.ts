import { NextRequest, NextResponse } from "next/server";
import { getMerchantSession } from "@/lib/session/merchant";
import { replayWebhook } from "@/lib/services/webhooks";

export async function POST(req: NextRequest) {
    const session = await getMerchantSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        if (!body?.webhookId) {
            return NextResponse.json({ success: false, message: "Missing webhook id" }, { status: 400 });
        }
        const record = await replayWebhook(session.merchantId, body.webhookId);
        return NextResponse.json({ success: true, webhook: record });
    } catch (error) {
        console.error("Webhook replay failed", error);
        return NextResponse.json({ success: false, message: "Failed to replay webhook" }, { status: 500 });
    }
}

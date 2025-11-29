import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session/session";
import { replayWebhook } from "@/lib/services/webhooks";
import { ISession } from "@/types/session";

export async function POST(req: NextRequest) {
    const session: ISession | null = await getSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (!session.merchantId) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

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

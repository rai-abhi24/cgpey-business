import { NextRequest, NextResponse } from "next/server";
import { getMerchantSession } from "@/lib/session/merchant";
import { listWebhooks } from "@/lib/services/webhooks";

export async function GET(req: NextRequest) {
    const session = await getMerchantSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const limit = Number(searchParams.get("limit")) || 50;
        const data = await listWebhooks(session.merchantId, Math.min(limit, 200));
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Webhook list failed", error);
        return NextResponse.json({ success: false, message: "Failed to load webhooks" }, { status: 500 });
    }
}

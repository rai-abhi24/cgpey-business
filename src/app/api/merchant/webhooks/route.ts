import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session/session";
import { listWebhooks } from "@/lib/services/webhooks";
import { ISession } from "@/types/session";

export async function GET(req: NextRequest) {
    const session: ISession | null = await getSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (!session.merchantId) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

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

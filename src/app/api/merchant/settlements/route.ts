import { NextRequest, NextResponse } from "next/server";
import { getMerchantSession } from "@/lib/session/merchant";
import { listSettlements } from "@/lib/services/settlements";
import { SettlementStatus } from "@/models/Settlement";

export async function GET(req: NextRequest) {
    const session = await getMerchantSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get("status") as SettlementStatus | null;
        const settlements = await listSettlements(session.merchantId, statusParam || undefined);
        return NextResponse.json({ success: true, data: settlements });
    } catch (error) {
        console.error("Failed to fetch settlements", error);
        return NextResponse.json({ success: false, message: "Failed to fetch settlements" }, { status: 500 });
    }
}

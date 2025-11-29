import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session/session";
import { listSettlements } from "@/lib/services/settlements";
import { SettlementStatus } from "@/models/Settlement";
import { ISession } from "@/types/session";

export async function GET(req: NextRequest) {
    const session: ISession | null = await getSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (!session.merchantId) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

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

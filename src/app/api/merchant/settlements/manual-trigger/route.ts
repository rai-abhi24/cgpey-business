import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session/session";
import { triggerManualSettlement } from "@/lib/services/settlements";
import { manualSettlementSchema } from "@/validations/merchant";
import { ISession } from "@/types/session";

export async function POST(req: NextRequest) {
    const session: ISession | null = await getSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (!session.merchantId) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = manualSettlementSchema.safeParse({
            ...body,
            amount: Number(body?.amount),
            fees: body?.fees ? Number(body.fees) : undefined,
        });
        if (!parsed.success) {
            return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
        }

        const settlement = await triggerManualSettlement(session.merchantId, {
            cycleStart: parsed.data.cycleStart,
            cycleEnd: parsed.data.cycleEnd,
            amount: parsed.data.amount,
            fees: parsed.data.fees,
            settlementMode: parsed.data.settlementMode,
            notes: parsed.data.notes,
        });

        return NextResponse.json({ success: true, settlement });
    } catch (error) {
        console.error("Manual settlement trigger failed", error);
        return NextResponse.json({ success: false, message: "Could not trigger settlement" }, { status: 500 });
    }
}

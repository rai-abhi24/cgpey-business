import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Merchant } from "@/models";
import { getSession } from "@/lib/session/session";
import type { MerchantMode } from "@/models/Merchant";
import { ISession } from "@/types/session";

export async function POST(req: NextRequest) {
    try {
        const session: ISession | null = await getSession();
        if (!session || session.role !== "MERCHANT" || !session.merchantId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { mode } = await req.json();
        const nextMode = (mode || "").toUpperCase() as MerchantMode;

        await connectDB();

        const merchant = await Merchant.findOne({ merchantId: session.merchantId });
        if (!merchant) {
            return NextResponse.json(
                { success: false, message: "Merchant not found" },
                { status: 404 }
            );
        }

        if (!merchant.canSwitchMode) {
            return NextResponse.json(
                { success: false, message: "Mode switching is disabled for this merchant" },
                { status: 403 }
            );
        }

        if (!merchant.allowedModes.includes(nextMode)) {
            return NextResponse.json(
                { success: false, message: "Mode not allowed" },
                { status: 400 }
            );
        }

        merchant.activeMode = nextMode;
        await merchant.save();

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Mode switch error:", err);
        return NextResponse.json(
            { success: false, message: "Failed to update mode" },
            { status: 500 }
        );
    }
}
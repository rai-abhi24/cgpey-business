import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session/session";
import { connectDB } from "@/lib/mongo";
import { Merchant } from "@/models";
import { ISession } from "@/types/session";

export async function GET() {
    const session: ISession | null = await getSession();
    if (!session)
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const merchant: any = await Merchant.findById(session.merchantMongoId).lean();

    if (!merchant)
        return NextResponse.json({ success: false, message: "Merchant not found" }, { status: 404 });

    return NextResponse.json({
        success: true,
        profile: {
            businessName: merchant.businessName,
            email: merchant.email,
            phone: merchant.phone,
            website: merchant.website,
            callbackUrls: merchant.callbackUrls ?? {},
            apiKeys: merchant.apiKeys,
            allowedModes: merchant.allowedModes,
            activeMode: merchant.activeMode,
            canSwitchMode: merchant.canSwitchMode,
        },
        account: session.account,
    });
}

export async function POST(req: NextRequest) {
    const session: ISession | null = await getSession();
    if (!session)
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    await connectDB();

    await Merchant.findByIdAndUpdate(session.merchantMongoId, {
        callbackUrls: body.callbackUrls,
    });

    return NextResponse.json({ success: true });
}
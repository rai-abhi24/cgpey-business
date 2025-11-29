import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session/session";
import { connectDB } from "@/lib/mongo";
import { Merchant } from "@/models";
import crypto from "crypto";
import { ISession } from "@/types/session";

export async function POST(req: NextRequest) {
    const session: ISession | null = await getSession();
    if (!session)
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { env, keyType } = await req.json();

    if (!env || !keyType)
        return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });

    await connectDB();

    const newKey =
        keyType === "public"
            ? `api_` + crypto.randomBytes(16).toString("hex")
            : `sec_` + crypto.randomBytes(32).toString("hex");

    const update = {
        $set: {
            [`apiKeys.${env}.${keyType === "public" ? "publicKey" : "secretKey"}`]: newKey,
        },
    };

    await Merchant.findByIdAndUpdate(session.merchantMongoId, update);

    return NextResponse.json({
        success: true,
        message: "Key regenerated",
    });
}
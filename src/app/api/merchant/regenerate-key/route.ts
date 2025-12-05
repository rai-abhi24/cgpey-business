import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session/session";
import { connectDB } from "@/lib/mongo";
import { Merchant } from "@/models";
import { ISession } from "@/types/session";
import { generateApiKey, generateSecretKey } from "@/lib/crypto";

export async function POST(req: NextRequest) {
    const session: ISession | null = await getSession();
    if (!session)
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { env, keyType } = await req.json();

    if (!env || !keyType)
        return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });

    await connectDB();

    const newKey =
        keyType === "public" ? generateApiKey(env as "uat" | "prod") : generateSecretKey(env as "uat" | "prod");

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
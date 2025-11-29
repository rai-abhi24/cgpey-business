import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Merchant, User } from "@/models";
import { getSession } from "@/lib/session/session";

async function requireAdmin() {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        throw new Response("Unauthorized", { status: 401 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "all";

        const filter: any = {};

        if (status !== "all") {
            filter.status = status;
        }

        if (search) {
            const regex = new RegExp(search, "i");
            filter.$or = [
                { merchantId: regex },
                { merchantName: regex },
                { businessName: regex },
                { email: regex },
                { phone: regex },
            ];
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Merchant.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Merchant.countDocuments(filter),
        ]);

        return NextResponse.json({
            success: true,
            data,
            page,
            limit,
            total,
        });
    } catch (err: any) {
        if (err instanceof Response) return err;
        console.error("GET /merchants error", err);
        return NextResponse.json(
            { success: false, message: "Failed to load merchants" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        await connectDB();

        const body = await req.json();

        const {
            merchantName,
            businessName,
            email,
            phone,
            businessEntityType,
            website,
            perTransactionLimit,
            callbackUrlUat,
            callbackUrlProd,
            canSwitchMode,
        } = body;

        if (!merchantName || !businessName || !email || !phone || !businessEntityType || !website) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({
            $or: [{ phone }, { email }],
        }).lean();

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "User with same phone/email already exists" },
                { status: 400 }
            );
        }

        const merchantId = "MID" + Date.now();

        const apiKeyUat = `api_${crypto.randomBytes(16).toString("hex")}`;
        const apiSecretUat = `sec_${crypto.randomBytes(32).toString("hex")}`;
        const apiKeyProd = `api_${crypto.randomBytes(16).toString("hex")}`;
        const apiSecretProd = `sec_${crypto.randomBytes(32).toString("hex")}`;

        const merchant = await Merchant.create({
            merchantId,
            merchantName,
            businessName,
            email,
            phone,
            businessEntityType,
            website,
            perTransactionLimit,
            callbackUrls: {
                uat: callbackUrlUat,
                prod: callbackUrlProd,
            },
            apiKeys: {
                uat: { publicKey: apiKeyUat, secretKey: apiSecretUat },
                prod: { publicKey: apiKeyProd, secretKey: apiSecretProd },
            },
            allowedModes: ["UAT"],
            activeMode: "UAT",
            canSwitchMode: !!canSwitchMode,
            status: "pending",
            isActive: true,
        });

        await User.create({
            userId: "USR" + Date.now(),
            email,
            phone,
            role: "MERCHANT",
            merchantId: merchant._id,
            isActive: true,
        });

        return NextResponse.json({ success: true, merchant });
    } catch (err: any) {
        if (err instanceof Response) return err;
        console.error("POST /merchants error", err);

        if (err.code === 11000) {
            return NextResponse.json(
                { success: false, message: "Merchant or user already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: "Failed to create merchant" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin();
        await connectDB();

        const body = await req.json();
        const { merchantId, status, canSwitchMode } = body;

        if (!merchantId) {
            return NextResponse.json(
                { success: false, message: "merchantId is required" },
                { status: 400 }
            );
        }

        const update: any = {};
        if (status) update.status = status;
        if (typeof canSwitchMode === "boolean") update.canSwitchMode = canSwitchMode;

        const merchant = await Merchant.findOneAndUpdate(
            { merchantId },
            { $set: update },
            { new: true }
        );

        if (!merchant) {
            return NextResponse.json(
                { success: false, message: "Merchant not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, merchant });
    } catch (err: any) {
        if (err instanceof Response) return err;
        console.error("PATCH /merchants error", err);
        return NextResponse.json(
            { success: false, message: "Failed to update merchant" },
            { status: 500 }
        );
    }
}
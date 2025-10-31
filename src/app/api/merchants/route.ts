import { NextResponse } from "next/server";
import { generateApiKey, generateSecretKey } from "@/lib/crypto";
import { connectDB } from "@/lib/mongo";
import { Merchant } from "@/models";

export async function GET(req: Request) {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status") || "";

    const query: any = {};

    if (search) {
        query.$or = [
            { "business.legalName": { $regex: search, $options: "i" } },
            { "personal.email": { $regex: search, $options: "i" } },
        ];
    }

    if (status && status !== "all") {
        query.status = status;
    }

    const total = await Merchant.countDocuments(query);
    const merchants = await Merchant.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    return NextResponse.json({
        data: merchants,
        total,
        page,
        limit,
    });
}

export async function POST(req: Request) {
    await connectDB();
    const body = await req.json();

    const requiredFields = [
        "ownerName",
        "email",
        "mobileNumber",
        "password",
        "appName",
        "appType",
        "vpa",
        "merchantDomain",
        "ipAddress",
        "perTransactionLimit",
    ];

    for (const field of requiredFields) {
        if (!body[field]) {
            return NextResponse.json({ error: `${field} is required` }, { status: 400 });
        }
    }

    const apiKey = generateApiKey();
    const secretKey = generateSecretKey();

    const newMerchant = await Merchant.create({
        business: {
            legalName: body.appName,
        },
        personal: {
            name: body.ownerName,
            email: body.email,
        },
        businessEntityType: body.appType,
        status: "active",
        apiKey,
        secretKey,
        perTransactionLimit: body.perTransactionLimit,
        createdAt: new Date(),
    });

    return NextResponse.json({
        message: "Merchant created successfully",
        merchant: newMerchant,
    });
}
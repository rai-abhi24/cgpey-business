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

/**
 * POST /api/merchants
 * Create a new merchant (Admin only)
 */
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
            dailyTransactionLimit,
            monthlyTransactionLimit,
            businessRegistrationNumber,
            businessAddress,
            webhookUrl,
            allowedIPs,
            canSwitchMode,
            phonepeMerchantId,
        } = body;

        // 2. Validation
        if (!merchantName?.trim()) {
            return NextResponse.json(
                { success: false, message: "Merchant name is required" },
                { status: 400 }
            );
        }

        if (!businessName?.trim()) {
            return NextResponse.json(
                { success: false, message: "Business name is required" },
                { status: 400 }
            );
        }

        if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, message: "Valid email is required" },
                { status: 400 }
            );
        }

        if (!phone?.trim() || !/^\d{10}$/.test(phone)) {
            return NextResponse.json(
                { success: false, message: "Valid 10-digit phone number is required" },
                { status: 400 }
            );
        }

        const validEntityTypes = ["SOLE_PROPRIETOR", "PARTNERSHIP", "PVT_LTD", "LLP", "PUBLIC_LTD"];
        if (!businessEntityType || !validEntityTypes.includes(businessEntityType)) {
            return NextResponse.json(
                { success: false, message: "Valid business entity type is required" },
                { status: 400 }
            );
        }

        if (!website?.trim()) {
            return NextResponse.json(
                { success: false, message: "Website is required" },
                { status: 400 }
            );
        }

        // Validate website URL
        try {
            const url = new URL(website);
            if (!["http:", "https:", "www."].includes(url.protocol)) {
                return NextResponse.json(
                    { success: false, message: "Website must be a valid HTTP/HTTPS URL" },
                    { status: 400 }
                );
            }
        } catch (e) {
            return NextResponse.json(
                { success: false, message: "Invalid website URL format" },
                { status: 400 }
            );
        }

        if (!perTransactionLimit || perTransactionLimit <= 0) {
            return NextResponse.json(
                { success: false, message: "Per transaction limit must be greater than 0" },
                { status: 400 }
            );
        }

        if (webhookUrl) {
            try {
                const url = new URL(webhookUrl);
                if (!["http:", "https:"].includes(url.protocol)) {
                    return NextResponse.json(
                        { success: false, message: "Webhook URL must be HTTP/HTTPS" },
                        { status: 400 }
                    );
                }
            } catch (e) {
                return NextResponse.json(
                    { success: false, message: "Invalid webhook URL" },
                    { status: 400 }
                );
            }
        }

        // 3. Check for existing merchant/user
        const existingMerchant = await Merchant.findOne({
            $or: [
                { email: email.toLowerCase() },
                { phone },
            ],
        }).lean();

        if (existingMerchant) {
            return NextResponse.json(
                { success: false, message: "Merchant with same email or phone already exists" },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { phone },
            ],
        }).lean();

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "User with same email or phone already exists" },
                { status: 400 }
            );
        }

        // 4. Generate unique merchant ID
        const merchantId = `MID_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

        // 5. Generate API keys for UAT and PROD
        const apiKeyUat = `pk_uat_${crypto.randomBytes(16).toString("hex")}`;
        const apiSecretUat = `sk_uat_${crypto.randomBytes(32).toString("hex")}`;
        const apiKeyProd = `pk_live_${crypto.randomBytes(16).toString("hex")}`;
        const apiSecretProd = `sk_live_${crypto.randomBytes(32).toString("hex")}`;

        // 7. Create merchant record
        const merchant = await Merchant.create({
            merchantId,
            merchantName: merchantName.trim(),
            businessName: businessName.trim(),
            businessEntityType,
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            website: website.trim(),
            phonepeMerchantId: phonepeMerchantId?.trim() || undefined,

            // Optional business details
            businessRegistrationNumber: businessRegistrationNumber?.trim() || undefined,
            businessAddress: businessAddress?.trim() || undefined,

            // Transaction limits
            perTransactionLimit: Number(perTransactionLimit),
            dailyTransactionLimit: dailyTransactionLimit ? Number(dailyTransactionLimit) : undefined,
            monthlyTransactionLimit: monthlyTransactionLimit ? Number(monthlyTransactionLimit) : undefined,

            // Initial stats
            totalTransactions: 0,
            totalVolume: 0,

            // Webhook configuration
            webhookConfig: {
                enabled: true,
                url: webhookUrl || "",
                fallbackUrl: webhookUrl || undefined,
                timeoutMs: 5000,
                maxRetries: 3,
                retryDelayMs: 1000,
                events: ["PAYMENT_SUCCESS", "PAYMENT_FAILED", "REFUND_PROCESSED"],
                alertOnFailure: true,
                alertEmail: email.toLowerCase().trim(),
            },

            // IP Security (optional)
            allowedIPs: allowedIPs && Array.isArray(allowedIPs) ? allowedIPs : undefined,

            // API Keys
            apiKeys: {
                uat: {
                    publicKey: apiKeyUat,
                    secretKey: apiSecretUat,
                },
                prod: {
                    publicKey: apiKeyProd,
                    secretKey: apiSecretProd,
                },
            },

            // Mode settings
            allowedModes: ["UAT"], // Start with UAT only
            activeMode: "UAT",
            canSwitchMode: !!canSwitchMode,

            // Status
            status: "pending", // Requires admin approval
            isActive: true,
        });

        // 8. Create user account for merchant
        const userId = `USR_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

        await User.create({
            userId,
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            name: merchantName.trim(),
            role: "MERCHANT",
            merchantId: merchant._id,
            isActive: true,
        });

        // 9. Return success response
        return NextResponse.json(
            {
                success: true,
                message: "Merchant created successfully. Pending approval.",
                data: {
                    merchantId: merchant.merchantId,
                    merchantName: merchant.merchantName,
                    businessName: merchant.businessName,
                    email: merchant.email,
                    status: merchant.status,
                    activeMode: merchant.activeMode,
                    // Return API keys ONLY on creation for merchant to save
                    apiKeys: {
                        uat: {
                            publicKey: apiKeyUat,
                            secretKey: apiSecretUat,
                        },
                        prod: {
                            publicKey: apiKeyProd,
                            secretKey: apiSecretProd,
                        },
                    },
                    createdAt: merchant.createdAt,
                },
            },
            { status: 201 }
        );
    } catch (err: any) {
        // Handle custom errors from requireAdmin
        if (err instanceof Response) {
            return err;
        }

        console.error("POST /api/merchants error:", err);

        // Handle duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0];
            return NextResponse.json(
                {
                    success: false,
                    message: `Merchant with this ${field} already exists`,
                },
                { status: 400 }
            );
        }

        // Handle validation errors
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map((e: any) => e.message);
            return NextResponse.json(
                {
                    success: false,
                    message: errors[0],
                    errors,
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Failed to create merchant. Please try again.",
            },
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
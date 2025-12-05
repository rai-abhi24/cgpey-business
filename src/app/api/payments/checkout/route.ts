import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/mongo";
import { Merchant } from "@/models";
import { CreateCheckoutSchema } from "@/lib/validations/payment";

const CheckoutSessions = new Map();

function error(message: any, status = 400) {
    return NextResponse.json({ success: false, message }, { status });
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const apiKey = req.headers.get("x-api-key");
        const secretKey = req.headers.get("x-secret-key");
        if (!apiKey || !secretKey) {
            return error("Missing API key or secret key", 401);
        }

        const merchant =
            (await Merchant.findOne({ "apiKeys.uat.publicKey": apiKey })) ||
            (await Merchant.findOne({ "apiKeys.prod.publicKey": apiKey }));

        if (!merchant) return error("Invalid API key", 401);

        if (merchant.status !== "approved") {
            return error("Merchant not approved yet", 403);
        }

        const json = await req.json();
        const parsed = CreateCheckoutSchema.safeParse(json);

        if (!parsed.success) {
            const msg = parsed.error.issues
                .map((issue) => {
                    const path = issue.path.join(".");
                    return {
                        key: path,
                        error: issue.message,
                    }
                });
            return error(msg, 400);
        }

        const body = parsed.data;

        if (merchant.perTransactionLimit && body.amount > merchant.perTransactionLimit) {
            return error(
                `Amount exceeds merchant's per transaction limit of ₹${merchant.perTransactionLimit}`,
                400
            );
        }

        const internalOrderId = "ORD_" + crypto.randomBytes(6).toString("hex").toUpperCase();

        // Create a checkout session (for future validation)
        CheckoutSessions.set(internalOrderId, {
            merchantId: merchant._id,
            orderId: body.transactionId,
            amount: body.amount,
            description: body.description,
            redirectUrl: body.redirectUrl,
            meta: body.meta,
            status: "INITIATED",
            createdAt: new Date(),
        });

        const baseURL = new URL(req.url);
        const host = `${baseURL.protocol}//${baseURL.host}`;

        const checkoutUrl = `${host}/cgepy-checkout?orderId=${internalOrderId}&amount=${body.amount}`;

        return NextResponse.json({
            success: true,
            data: {
                checkoutUrl,
                orderId: internalOrderId,
                transactionId: body.transactionId,
                amount: body.amount,
            },
        });
    } catch (err) {
        console.error("Hosted Checkout API Error:", err);
        return error("Something went wrong", 500);
    }
}
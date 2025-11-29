import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongo";
import { Session, User, Merchant } from "@/models";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
    try {
        await connectDB();

        const token = req.headers
            .get("cookie")
            ?.split("; ")
            ?.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
            ?.split("=")[1];

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        let payload: any;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            console.log("Invalid token", err);
            return NextResponse.json(
                { success: false, message: "Invalid token" },
                { status: 401 }
            );
        }

        const { sessionId, userId, merchantMongoId } = payload;

        const sessionDoc = await Session.findOne({
            _id: sessionId,
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).lean();

        if (!sessionDoc) {
            return NextResponse.json(
                { success: false, message: "Session expired" },
                { status: 401 }
            );
        }

        const user: any = await User.findOne({ userId }).lean();
        if (!user || !user.isActive) {
            return NextResponse.json(
                { success: false, message: "User inactive" },
                { status: 401 }
            );
        }

        const baseSession = {
            role: user.role,
            userId: user.userId,
            phone: user.phone,
            email: user.email,
            lastLoginAt: user.lastLoginAt ?? null,
        };

        if (user.role === "ADMIN") {
            return NextResponse.json({
                success: true,
                session: baseSession,
            });
        }

        if (!merchantMongoId) {
            return NextResponse.json(
                { success: false, message: "Merchant not linked" },
                { status: 401 }
            );
        }

        const merchant: any = await Merchant.findById(merchantMongoId).lean();
        if (!merchant || !merchant.isActive) {
            return NextResponse.json(
                { success: false, message: "Merchant inactive" },
                { status: 401 }
            );
        }

        const merchantSession = {
            ...baseSession,
            merchantId: merchant.merchantId,
            merchantMongoId: merchant._id.toString(),
            currentMode: merchant.activeMode,
            allowedModes: merchant.allowedModes,
            account: {
                totalTransactions: 0,
                totalVolume: 0,
                balance: 0,
            }
        };

        return NextResponse.json({
            success: true,
            session: merchantSession,
        });
    } catch (err) {
        console.error("/auth/me error:", err);
        return NextResponse.json(
            { success: false, message: "Unexpected error" },
            { status: 500 }
        );
    }
}
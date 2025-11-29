import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Merchant, Session, User } from "@/models";
import { getSession } from "@/lib/session/session";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/constants";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
    try {
        const adminSession = await getSession();
        if (!adminSession || adminSession.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { merchantId } = await req.json();
        if (!merchantId) {
            return NextResponse.json(
                { success: false, message: "merchantId is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const merchant: any = await Merchant.findOne({ merchantId }).lean();
        if (!merchant || !merchant.isActive) {
            return NextResponse.json(
                { success: false, message: "Merchant not found or inactive" },
                { status: 404 }
            );
        }

        const adminUser: any = await User.findOne({ userId: adminSession.userId }).lean();
        if (!adminUser) {
            return NextResponse.json(
                { success: false, message: "Admin user not found" },
                { status: 404 }
            );
        }

        const sessionId = new Types.ObjectId();
        const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

        const payload = {
            sessionId: sessionId.toString(),
            userId: adminUser.userId,
            role: "MERCHANT",
            merchantId: merchant.merchantId,
            merchantMongoId: merchant._id.toString(),
            activeMode: merchant.activeMode,
            impersonatedBy: adminSession.userId,
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: SESSION_TTL_SECONDS,
        });

        await Session.create({
            _id: sessionId,
            userId: adminUser._id,
            merchantId: merchant._id,
            deviceInfo: {
                ip:
                    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                    "unknown",
                userAgent: req.headers.get("user-agent") || "unknown",
            },
            token,
            expiresAt,
            isActive: true,
        });

        const res = NextResponse.json({
            success: true,
            message: "Impersonation successful",
        });

        res.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_TTL_SECONDS,
        });

        return res;
    } catch (err) {
        console.error("Impersonate error:", err);
        return NextResponse.json(
            { success: false, message: "Unable to impersonate" },
            { status: 500 }
        );
    }
}
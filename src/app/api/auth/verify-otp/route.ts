import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { connectDB } from "@/lib/mongo";
import { Merchant, Otp, Session, User } from "@/models";
import { Purpose } from "@/models/OTP";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/constants";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
    console.warn("[AUTH] JWT_SECRET is not set");
}

interface SessionJwtPayload {
    sessionId: string;
    userId: string;
    role: string;
    merchantId?: string | null;
    merchantMongoId?: string | null;
    activeMode?: string;
}

export async function POST(req: NextRequest) {
    try {
        const { phone, otp } = await req.json();

        if (
            !phone ||
            typeof phone !== "string" ||
            phone.length !== 10 ||
            !otp ||
            typeof otp !== "string"
        ) {
            return NextResponse.json(
                { success: false, message: "Invalid request" },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({ phone });
        if (!user || !user.isActive) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        let merchant = null as InstanceType<typeof Merchant> | null;

        if (user.role === "MERCHANT") {
            if (!user.merchantId) {
                return NextResponse.json(
                    { success: false, message: "Merchant mapping missing" },
                    { status: 401 }
                );
            }

            merchant = await Merchant.findById(user.merchantId);
            if (!merchant || !merchant.isActive) {
                return NextResponse.json(
                    { success: false, message: "Merchant inactive" },
                    { status: 401 }
                );
            }
        }

        const otpDoc = await Otp.findOne({
            phone,
            purpose: Purpose.LOGIN,
            isUsed: false,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!otpDoc) {
            return NextResponse.json(
                { success: false, message: "Invalid or expired OTP" },
                { status: 400 }
            );
        }

        console.log("OTP doc:", otpDoc);
        console.log("OTP:", otp);

        const isValidOtp = otp === otpDoc.otp;
        if (!isValidOtp) {
            return NextResponse.json(
                { success: false, message: "Invalid OTP" },
                { status: 400 }
            );
        }

        otpDoc.isUsed = true;
        await otpDoc.save();

        user.lastLoginAt = new Date();
        await user.save();

        const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
        const sessionId = new Types.ObjectId();

        const payload: SessionJwtPayload = {
            sessionId: sessionId.toString(),
            userId: user.userId,
            role: user.role,
        };

        if (merchant) {
            payload.merchantMongoId = merchant._id.toString();
            payload.merchantId = merchant.merchantId;
            payload.activeMode = merchant.activeMode;
        } else {
            payload.merchantMongoId = null;
            payload.merchantId = null;
        }

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: SESSION_TTL_SECONDS,
        });

        await Session.create({
            _id: sessionId,
            userId: user._id,
            merchantId: merchant ? merchant._id : null,
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
            message: "Login successful",
            role: user.role,
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
        console.error("Verify OTP error:", err);
        return NextResponse.json(
            { success: false, message: "Verification failed" },
            { status: 500 }
        );
    }
}
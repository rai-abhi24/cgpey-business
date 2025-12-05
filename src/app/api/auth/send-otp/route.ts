import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Otp, User } from "@/models";
import { Purpose } from "@/models/OTP";
import { sendLoginOtpSms } from "@/lib/services/sms";

const OTP_TTL_MINUTES = 5;

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();

        if (!phone || typeof phone !== "string" || phone.length !== 10) {
            return NextResponse.json(
                { success: false, message: "Invalid phone number" },
                { status: 400 }
            );
        }

        await connectDB();
        
        const user: any = await User.findOne({ phone }).lean();
        if (!user || !user.isActive) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        if (user.role === "MERCHANT" && !user.merchantId) {
            return NextResponse.json(
                { success: false, message: "Merchant mapping missing" },
                { status: 401 }
            );
        }

        // Optional: SIMPLE rate limit – you can improve this later
        // const recentOtp = await Otp.findOne({
        //     phone,
        //     purpose: Purpose.LOGIN,
        //     isUsed: false,
        //     expiresAt: { $gt: new Date() },
        // }).sort({ createdAt: -1 });
        // if (recentOtp) { ... }

        const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

        // Invalidate previous unused OTPs for this phone
        await Otp.updateMany(
            { phone, purpose: Purpose.LOGIN, isUsed: false },
            { $set: { isUsed: true } }
        );

        await Otp.create({
            phone,
            otp: plainOtp,
            purpose: Purpose.LOGIN,
            expiresAt,
        });

        await sendLoginOtpSms(phone, plainOtp);

        return NextResponse.json({
            success: true,
            message: "OTP sent successfully",
            data: { phone },
        });
    } catch (err: any) {
        console.error("Send OTP Error:", err);
        return NextResponse.json(
            { success: false, message: "Failed to send OTP" },
            { status: 500 }
        );
    }
}
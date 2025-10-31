import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Merchant } from "@/models/Merchant";

export async function POST(req: Request) {
    try {
        const { phone, otp } = await req.json();

        if (!phone || !otp) {
            return NextResponse.json({ success: false, message: "Missing phone or OTP" }, { status: 400 });
        }

        await connectDB();

        const user = await Merchant.findOne({ phone });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Verify OTP (static for now)
        if (user.otp !== otp) {
            return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
        }

        // Check expiry
        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            return NextResponse.json({ success: false, message: "OTP expired" }, { status: 400 });
        }

        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "Login successful",
            data: {
                phone: user.phone,
                name: user.name || "User",
            },
        });
    } catch (err: any) {
        console.error("Verify OTP Error:", err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
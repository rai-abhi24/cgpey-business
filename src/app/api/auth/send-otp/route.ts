import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Merchant } from "@/models/Merchant";

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();

        if (!phone || phone.length !== 10) {
            return NextResponse.json({ success: false, message: "Invalid phone number" }, { status: 400 });
        }

        await connectDB();

        const staticOtp = "123456";
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const user = await Merchant.findOneAndUpdate(
            { phone },
            { otp: staticOtp, otpExpiresAt },
            { upsert: true, new: true }
        );

        console.log(`📩 OTP for ${phone} is ${staticOtp}`);

        return NextResponse.json({
            success: true,
            message: "OTP sent successfully",
            data: { phone: user.phone },
        });
    } catch (err: any) {
        console.error("Send OTP Error:", err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
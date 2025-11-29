import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongo";
import { Session, User, Merchant } from "@/models";
import { SESSION_COOKIE_NAME } from "../constants";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function getSession() {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    let payload: any = null;

    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
        console.log("Invalid token", e);
        return null;
    }

    const { sessionId, userId, merchantMongoId } = payload;

    const sessionDoc = await Session.findOne({
        _id: sessionId,
        isActive: true,
        expiresAt: { $gt: new Date() }
    }).lean();

    if (!sessionDoc) return null;

    const user: any = await User.findOne({ userId }).lean();
    if (!user) return null;

    const baseSession = {
        role: user.role,
        userId: user.userId,
        phone: user.phone,
        email: user.email,
        lastLoginAt: user.lastLoginAt ?? null,
    };

    if (user.role === "ADMIN") {
        return baseSession;
    }

    const merchant: any = await Merchant.findById(merchantMongoId).lean();
    if (!merchant) return null;

    return {
        ...baseSession,
        merchantId: merchant.merchantId,
        merchantMongoId: merchant._id.toString(),
        currentMode: merchant.activeMode,
        allowedModes: merchant.allowedModes,
        canSwitchMode: merchant.canSwitchMode !== false,
        account: {
            totalTransactions: 0,
            totalVolume: 0,
            balance: 0
        }
    };
}
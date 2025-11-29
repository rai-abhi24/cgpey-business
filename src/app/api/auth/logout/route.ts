import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongo";
import { Session } from "@/models";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

const JWT_SECRET = process.env.JWT_SECRET!;

interface SessionPayload {
    sessionId: string;
}

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        if (token && JWT_SECRET) {
            try {
                const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;
                await connectDB();
                await Session.findByIdAndUpdate(payload.sessionId, { isActive: false });
            } catch (error) {
                console.warn("Failed to invalidate session", error);
            }
        }

        const res = NextResponse.json({ success: true, message: "Logged out" });
        res.cookies.delete(SESSION_COOKIE_NAME);
        return res;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 });
    }
}
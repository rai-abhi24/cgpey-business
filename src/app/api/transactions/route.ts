import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Payment } from "@/models/Payment";

export async function GET(req: Request) {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status") || "";
    const dateRange = searchParams.get("dateRange") || "all";

    const query: any = {};

    /* -----------------------------
     🔍 Search Filter
    ----------------------------- */
    if (search) {
        query.$or = [
            { merchantOrderId: { $regex: search, $options: "i" } },
            { gateway: { $regex: search, $options: "i" } },
            { paymentId: { $regex: search, $options: "i" } },
            { gatewayTxnId: { $regex: search, $options: "i" } },
            { utr: { $regex: search, $options: "i" } },
        ];
    }

    /* -----------------------------
     🏷️ Status Filter
    ----------------------------- */
    if (status && status !== "all") {
        query.state = status;
    }

    /* -----------------------------
     🗓️ Date Range Filter
    ----------------------------- */
    const now = new Date();
    const dateFilters: Record<string, () => void> = {
        today: () => {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        },
        week: () => {
            const start = new Date();
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            query.createdAt = { $gte: start, $lte: new Date() };
        },
        month: () => {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            query.createdAt = { $gte: start, $lte: end };
        },
    };

    if (dateFilters[dateRange]) dateFilters[dateRange]();

    /* -----------------------------
     ⚡ Optimized Query
    ----------------------------- */
    const total = await Payment.countDocuments(query);

    // Select only necessary fields for UI — no sensitive data exposure
    const transactions = await Payment.find(query)
        .select(
            "merchantOrderId paymentId gatewayTxnId utr gateway paymentMode vpa amount state createdAt paymentInitiatedAt completedAt"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(); // lean() for plain JS objects → faster than hydrated mongoose docs

    /* -----------------------------
     🧠 Transform / format response for frontend
    ----------------------------- */
    const formatted = transactions.map((t) => {
        const started = new Date(t.createdAt);
        const completed = t.completedAt ? new Date(t.completedAt) : null;

        const duration =
            completed && started
                ? Math.round((completed.getTime() - started.getTime()) / 1000)
                : null;

        return {
            _id: t._id,
            merchantOrderId: t.merchantOrderId,
            paymentId: t.paymentId || "-",
            gatewayTxnId: t.gatewayTxnId || "-",
            utr: t.utr || "-",
            gateway: t.gateway,
            paymentMode: t.paymentMode || "-",
            vpa: t.vpa || "-",
            amount: t.amount,
            state: t.state,
            createdAt: t.createdAt,
            paymentInitiatedAt: t.paymentInitiatedAt || null,
            completedAt: t.completedAt || null,
            duration: duration ? `${duration}s` : "-",
        };
    });

    /* -----------------------------
     ✅ Send Clean Response
    ----------------------------- */
    return NextResponse.json({
        data: formatted,
        total,
        page,
        limit,
    });
}
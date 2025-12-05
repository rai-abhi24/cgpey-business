import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Payment, Refund } from "@/models";
import { getSession } from "@/lib/session/session";
import { PaymentState } from "@/models/Payment";

const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;

export async function GET() {
    try {
        const session: any = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const merchantId = session.merchantId;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date(today.getTime() - 6 * MILLIS_IN_DAY);

        const pipeline = [
            { $match: { merchantId, createdAt: { $gte: sevenDaysAgo } } },
            {
                $facet: {
                    todayStats: [
                        { $match: { createdAt: { $gte: today } } },
                        {
                            $group: {
                                _id: "$state",
                                amount: { $sum: "$amount" },
                                count: { $sum: 1 },
                            },
                        },
                    ],

                    trend: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: { date: "$createdAt", format: "%Y-%m-%d" },
                                },
                                amount: { $sum: "$amount" },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ],

                    upiSplit: [
                        {
                            $group: {
                                _id: "$upiApp",
                                count: { $sum: 1 },
                                amount: { $sum: "$amount" },
                            },
                        },
                    ],

                    hourly: [
                        {
                            $group: {
                                _id: { $hour: "$createdAt" },
                                count: { $sum: 1 },
                                amount: { $sum: "$amount" },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ],

                    failures: [
                        { $match: { state: { $ne: PaymentState.SUCCESS } } },
                        {
                            $group: {
                                _id: "$state",
                                count: { $sum: 1 },
                            },
                        },
                    ],
                },
            },
        ];

        const [result] = await Payment.aggregate(pipeline as any);

        const refunds = await Refund.aggregate([
            { $match: { merchantId, createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    amount: { $sum: "$refundAmount" },
                },
            },
        ]);

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                refunds,
            },
        });
    } catch (err) {
        console.error("Merchant analytics error:", err);
        return NextResponse.json(
            { success: false, message: "Failed to load analytics" },
            { status: 500 }
        );
    }
}
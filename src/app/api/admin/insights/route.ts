import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Merchant, Payment } from "@/models";

const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;

export async function GET() {
    try {
        await connectDB();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date(today.getTime() - 6 * MILLIS_IN_DAY);

        // --- 1. Merchant count ---
        const totalMerchants = await Merchant.countDocuments({ isActive: true });

        // --- 2. Top-level metrics ---
        const todayStats = await Payment.aggregate([
            { $match: { createdAt: { $gte: today } } },
            {
                $group: {
                    _id: "$state",
                    amount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // --- 3. State split ---
        const stateSplit = await Payment.aggregate([
            {
                $group: {
                    _id: "$state",
                    count: { $sum: 1 }
                }
            }
        ]);

        // --- 4. Mode split ---
        const modeSplit = await Payment.aggregate([
            {
                $group: {
                    _id: "$paymentMode",
                    amount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // --- 5. Top merchants leaderboard ---
        const topMerchants = await Payment.aggregate([
            {
                $group: {
                    _id: "$merchantId",
                    totalVolume: { $sum: "$amount" },
                    totalCount: { $sum: 1 }
                }
            },
            { $sort: { totalVolume: -1 } },
            { $limit: 10 }
        ]);

        // --- 6. 7-day trend ---
        const rawTrend = await Payment.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    amount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const trend = fillTrend(rawTrend, sevenDaysAgo, today);

        return NextResponse.json({
            success: true,
            data: {
                totalMerchants,
                todayStats,
                stateSplit,
                modeSplit,
                topMerchants,
                trend,
            }
        });
    } catch (error) {
        console.error("Admin insights error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch admin insights" },
            { status: 500 }
        );
    }
}

interface TrendItem {
    _id: string;
    amount: number;
    count: number;
}

interface FilledTrendItem {
    date: string;
    amount: number;
    count: number;
}

function fillTrend(
    series: TrendItem[],
    startDate: Date,
    endDate: Date
): FilledTrendItem[] {
    const result: FilledTrendItem[] = [];
    const lookup = new Map(series.map(i => [i._id, i]));

    for (let ts = startDate.getTime(); ts <= endDate.getTime(); ts += MILLIS_IN_DAY) {
        const dateObj = new Date(ts);
        const date = dateObj.toISOString().slice(0, 10);
        const row = lookup.get(date) || { amount: 0, count: 0 };
        result.push({
            date,
            amount: row.amount || 0,
            count: row.count || 0
        });
    }
    return result;
}
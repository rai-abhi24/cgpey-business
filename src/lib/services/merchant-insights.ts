import { connectDB } from "@/lib/mongo";
import { Payment } from "@/models";
import { PaymentState } from "@/models/Payment";
import type { MerchantMode } from "@/models/Merchant";

interface TrendPoint {
    date: string;
    amount: number;
    count: number;
}

export interface MerchantInsightsPayload {
    today: {
        totalVolume: number;
        totalCount: number;
        successCount: number;
        successRate: number;
        averageTicketSize: number;
    };
    monthToDate: {
        totalVolume: number;
        totalCount: number;
        successRate: number;
    };
    modeSplit: Array<{ mode: string; amount: number; count: number }>;
    stateSplit: Array<{ state: string; count: number }>;
    failures: Array<{ label: string; count: number }>;
    recentTrend: TrendPoint[];
    activeMode: MerchantMode;
}

const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;

const toStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export async function fetchMerchantInsights(merchantId: string, activeMode: MerchantMode): Promise<MerchantInsightsPayload> {
    await connectDB();

    const today = toStartOfDay(new Date());
    const mtdStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const sevenDaysAgo = toStartOfDay(new Date(today.getTime() - 6 * MILLIS_IN_DAY));

    const matchStage = {
        // merchantId,
        createdAt: { $gte: mtdStart },
    };

    const [insights] = await Payment.aggregate([
        { $match: matchStage },
        {
            $facet: {
                mtdTotals: [
                    {
                        $group: {
                            _id: "$state",
                            amount: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                ],
                modeSplit: [
                    {
                        $group: {
                            _id: "$paymentMode",
                            amount: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                ],
                stateSplit: [
                    {
                        $group: {
                            _id: "$state",
                            count: { $sum: 1 },
                        },
                    },
                ],
                todayTotals: [
                    { $match: { createdAt: { $gte: today } } },
                    {
                        $group: {
                            _id: "$state",
                            amount: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                ],
                recentTrend: [
                    { $match: { createdAt: { $gte: sevenDaysAgo } } },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                            },
                            amount: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ],
            },
        },
    ]);
    console.log(insights);
    
    const todayTotals = aggregateTotals(insights?.todayTotals ?? []);
    const mtdTotals = aggregateTotals(insights?.mtdTotals ?? []);

    const recentTrend = fillTrend(insights?.recentTrend ?? [], sevenDaysAgo, today);

    const modeSplit = (insights?.modeSplit ?? []).map((item: any) => ({
        mode: item._id,
        amount: item.amount,
        count: item.count,
    }));

    const stateSplit = (insights?.stateSplit ?? []).map((item: any) => ({
        state: item._id,
        count: item.count,
    }));

    const failures = stateSplit
        .filter((state: { state: string }) => state.state !== PaymentState.COMPLETED)
        .map((state: any) => ({ label: state.state, count: state.count }));

    return {
        today: todayTotals,
        monthToDate: {
            totalVolume: mtdTotals.totalVolume,
            totalCount: mtdTotals.totalCount,
            successRate: mtdTotals.successRate,
        },
        modeSplit,
        stateSplit,
        failures,
        recentTrend,
        activeMode,
    };
}

export function aggregateTotals(rows: Array<{ _id: string; amount: number; count: number }>) {
    const totalVolume = rows.reduce((acc, row) => acc + (row.amount || 0), 0);
    const totalCount = rows.reduce((acc, row) => acc + (row.count || 0), 0);
    const successRow = rows.find((row) => row._id === PaymentState.COMPLETED);
    const successCount = successRow?.count || 0;
    const successAmount = successRow?.amount || 0;
    const successRate = totalCount ? (successCount / totalCount) * 100 : 0;
    const averageTicketSize = successCount ? successAmount / successCount : 0;

    return {
        totalVolume,
        totalCount,
        successCount,
        successRate,
        averageTicketSize,
    };
}

export function fillTrend(series: Array<{ _id: string; amount: number; count: number }>, startDate: Date, endDate: Date): TrendPoint[] {
    const result: TrendPoint[] = [];
    const lookup = new Map(series.map((item) => [item._id, item]));

    for (let cursor = startDate.getTime(); cursor <= endDate.getTime(); cursor += MILLIS_IN_DAY) {
        const date = new Date(cursor);
        const key = date.toISOString().slice(0, 10);
        const row = lookup.get(key);
        result.push({
            date: key,
            amount: row?.amount || 0,
            count: row?.count || 0,
        });
    }
    return result;
}
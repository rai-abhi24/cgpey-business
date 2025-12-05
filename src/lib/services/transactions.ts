import { Types } from "mongoose";
import { connectDB } from "@/lib/mongo";
import { Payment } from "@/models";
import { PaymentState } from "@/models/Payment";

export interface TransactionFilters {
    cursor?: string | null;
    limit?: number;
    search?: string;
    status?: string;
    paymentMode?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: string;
    maxAmount?: string;
    environment?: string;
}

export interface PaginatedTransactions {
    data: any[];
    nextCursor: string | null;
    metrics: {
        totalCount: number;
        totalAmount: number;
        successRate: number;
    };
}

export async function fetchMerchantTransactions(merchantId: string, filters: TransactionFilters): Promise<PaginatedTransactions> {
    await connectDB();

    const baseFilter = buildBaseFilter(merchantId, filters);
    const limit = Math.min(Math.max(filters.limit || 25, 1), 100);
    const query = applyCursorFilter(baseFilter, filters.cursor);

    const documents = await Payment.find(query)
        .sort({ _id: -1 })
        .limit(limit)
        .select(
            "merchantOrderId paymentId gatewayTxnId utr gateway paymentMode amount state createdAt completedAt orderMetaInfo"
        )
        .lean();

    const nextCursor = documents.length === limit ? (documents[documents.length - 1] as any)._id.toString() : null;

    const metrics = await aggregateMetrics(baseFilter);

    return {
        data: documents.map(mapPaymentRow),
        nextCursor,
        metrics,
    };
}

export async function exportTransactions(merchantId: string, filters: TransactionFilters, cap = 5000) {
    await connectDB();
    const baseFilter = buildBaseFilter(merchantId, filters);
    const docs = await Payment.find(baseFilter)
        .sort({ _id: -1 })
        .limit(cap)
        .select(
            "merchantOrderId paymentId gatewayTxnId utr gateway paymentMode amount state createdAt completedAt orderMetaInfo"
        )
        .lean();
    return docs.map(mapPaymentRow);
}

function buildBaseFilter(merchantId: string, filters: TransactionFilters) {
    const query: Record<string, any> = {
        merchantId,
    };

    if (filters.environment) {
        query["orderMetaInfo.environment"] = filters.environment;
    }

    if (filters.status && filters.status !== "all") {
        query.state = filters.status;
    }

    if (filters.paymentMode && filters.paymentMode !== "all") {
        query.paymentMode = filters.paymentMode;
    }

    if (filters.search) {
        const regex = new RegExp(filters.search, "i");
        query.$or = [
            { merchantOrderId: regex },
            { paymentId: regex },
            { gatewayTxnId: regex },
            { utr: regex },
        ];
    }

    if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
            query.createdAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
            query.createdAt.$lte = new Date(filters.dateTo);
        }
    }

    if (filters.minAmount || filters.maxAmount) {
        query.amount = {};
        if (filters.minAmount) query.amount.$gte = Number(filters.minAmount);
        if (filters.maxAmount) query.amount.$lte = Number(filters.maxAmount);
    }

    return query;
}

function applyCursorFilter(base: Record<string, any>, cursor?: string | null) {
    if (!cursor) return base;
    const cloned = { ...base };
    try {
        cloned._id = { $lt: new Types.ObjectId(cursor) };
    } catch {
        // ignore malformed cursor
    }
    return cloned;
}

function mapPaymentRow(document: any) {
    return {
        id: document._id.toString(),
        orderId: document.merchantOrderId,
        paymentId: document.paymentId || "-",
        gatewayTxnId: document.gatewayTxnId || "-",
        utr: document.utr || "-",
        gateway: document.gateway,
        paymentMode: document.paymentMode || "-",
        amount: document.amount,
        state: document.state,
        createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : document.createdAt,
        completedAt: document.completedAt instanceof Date ? document.completedAt.toISOString() : document.completedAt,
    };
}

async function aggregateMetrics(filter: Record<string, any>) {
    const [row] = await Payment.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" },
                totalCount: { $sum: 1 },
                successCount: {
                    $sum: {
                        $cond: [{ $eq: ["$state", PaymentState.SUCCESS] }, 1, 0],
                    },
                },
            },
        },
    ]);

    if (!row) {
        return {
            totalAmount: 0,
            totalCount: 0,
            successRate: 0,
        };
    }

    return {
        totalAmount: row.totalAmount || 0,
        totalCount: row.totalCount || 0,
        successRate: row.totalCount ? (row.successCount / row.totalCount) * 100 : 0,
    };
}

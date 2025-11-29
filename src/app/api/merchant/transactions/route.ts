import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session/session";
import { fetchMerchantTransactions } from "@/lib/services/transactions";
import { transactionFiltersSchema } from "@/validations/merchant";

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const filtersInput = {
            search: searchParams.get("q") || undefined,
            status: searchParams.get("status") || undefined,
            paymentMode: searchParams.get("paymentMode") || undefined,
            dateFrom: searchParams.get("dateFrom") || undefined,
            dateTo: searchParams.get("dateTo") || undefined,
            minAmount: searchParams.get("minAmount") || undefined,
            maxAmount: searchParams.get("maxAmount") || undefined,
            environment: searchParams.get("environment") || session.currentMode,
        };

        const parsed = transactionFiltersSchema.safeParse(filtersInput);
        if (!parsed.success) {
            return NextResponse.json({ success: false, message: "Invalid filters" }, { status: 400 });
        }

        const filters = {
            ...parsed.data,
            cursor: searchParams.get("cursor"),
            limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
        };

        const result = await fetchMerchantTransactions(session.merchantId, filters);

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error("Transactions fetch failed", error);
        return NextResponse.json({ success: false, message: "Failed to fetch transactions" }, { status: 500 });
    }
}

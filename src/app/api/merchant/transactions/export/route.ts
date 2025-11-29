import { NextRequest, NextResponse } from "next/server";
import { getMerchantSession } from "@/lib/session/merchant";
import { exportTransactions } from "@/lib/services/transactions";

export async function POST(req: NextRequest) {
    const session = await getMerchantSession();
    if (!session) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const rows = await exportTransactions(session.merchantId, {
            search: body?.search,
            status: body?.status,
            paymentMode: body?.paymentMode,
            dateFrom: body?.dateFrom,
            dateTo: body?.dateTo,
            minAmount: body?.minAmount,
            maxAmount: body?.maxAmount,
            environment: body?.environment || session.currentMode,
        });

        const header = ["Order ID", "Payment ID", "Gateway Txn ID", "UTR", "Gateway", "Payment Mode", "Amount", "State", "Created At", "Completed At"];
        const csvLines = [header.join(",")];
        rows.forEach((row) => {
            csvLines.push([
                row.orderId,
                row.paymentId,
                row.gatewayTxnId,
                row.utr,
                row.gateway,
                row.paymentMode,
                row.amount,
                row.state,
                row.createdAt,
                row.completedAt || "",
            ].map(escapeCsv).join(","));
        });

        const csv = csvLines.join("\n");
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=transactions-${Date.now()}.csv`,
            },
        });
    } catch (error) {
        console.error("Transaction export failed", error);
        return NextResponse.json({ success: false, message: "Failed to export transactions" }, { status: 500 });
    }
}

function escapeCsv(value: unknown) {
    if (value === null || value === undefined) return "";
    const str = String(value).replace(/"/g, '""');
    if (str.includes(",") || str.includes("\n")) {
        return `"${str}"`;
    }
    return str;
}

import { NextRequest, NextResponse } from "next/server";
import { getMerchantSession } from "@/lib/session/merchant";
import { createReportRequest, listReports } from "@/lib/services/settlements";
import { ReportType } from "@/models/Report";
import { reportRequestSchema } from "@/validations/merchant";

export async function GET() {
    const session = await getMerchantSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    try {
        const data = await listReports(session.merchantId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Reports fetch failed", error);
        return NextResponse.json({ success: false, message: "Failed to fetch reports" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getMerchantSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = reportRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, message: "Invalid range" }, { status: 400 });
        }
        const report = await createReportRequest(session.merchantId, {
            type: (parsed.data.type as ReportType) || ReportType.TRANSACTIONS,
            rangeStart: parsed.data.rangeStart,
            rangeEnd: parsed.data.rangeEnd,
        });
        return NextResponse.json({ success: true, report });
    } catch (error) {
        console.error("Report generation failed", error);
        return NextResponse.json({ success: false, message: "Failed to create report" }, { status: 500 });
    }
}

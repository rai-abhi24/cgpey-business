import { randomUUID } from "crypto";
import { connectDB } from "@/lib/mongo";
import { Report, Settlement } from "@/models";
import { SettlementStatus } from "@/models/Settlement";
import { ReportStatus, ReportType } from "@/models/Report";

export async function listSettlements(merchantId: string, status?: SettlementStatus) {
    await connectDB();
    const filter: Record<string, any> = { merchantId };
    if (status && status !== SettlementStatus.PENDING) {
        filter.status = status;
    }
    return Settlement.find(filter).sort({ cycleEnd: -1 }).limit(25).lean();
}

export async function triggerManualSettlement(merchantId: string, payload: { cycleStart: string; cycleEnd: string; amount: number; fees?: number; settlementMode?: string; notes?: string; }) {
    await connectDB();
    const cycleStart = new Date(payload.cycleStart);
    const cycleEnd = new Date(payload.cycleEnd);
    const fees = payload.fees || 0;
    const netAmount = payload.amount - fees;

    return Settlement.create({
        merchantId,
        cycleStart,
        cycleEnd,
        settlementDate: new Date(),
        amount: payload.amount,
        fees,
        netAmount,
        settlementMode: payload.settlementMode || "IMPS",
        status: SettlementStatus.MANUAL_PENDING,
        manualTrigger: true,
        notes: payload.notes,
        referenceId: randomUUID(),
    });
}

export async function listReports(merchantId: string) {
    await connectDB();
    return Report.find({ merchantId }).sort({ createdAt: -1 }).limit(10).lean();
}

export async function createReportRequest(merchantId: string, payload: { type: ReportType; rangeStart: string; rangeEnd: string }) {
    await connectDB();
    const reportId = randomUUID();
    const doc = await Report.create({
        merchantId,
        reportId,
        type: payload.type,
        rangeStart: new Date(payload.rangeStart),
        rangeEnd: new Date(payload.rangeEnd),
        status: ReportStatus.QUEUED,
    });
    return doc.toObject();
}

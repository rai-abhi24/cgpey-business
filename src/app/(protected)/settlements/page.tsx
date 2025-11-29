"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import HeaderSetter from "@/components/common/header-setter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SettlementRecord {
    _id: string;
    cycleStart: string;
    cycleEnd: string;
    settlementDate?: string;
    amount: number;
    fees: number;
    netAmount: number;
    settlementMode: string;
    status: string;
    referenceId?: string;
    notes?: string;
}

interface ReportRecord {
    _id: string;
    reportId: string;
    type: string;
    rangeStart: string;
    rangeEnd: string;
    status: string;
    downloadUrl?: string;
}

export default function SettlementsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [manualForm, setManualForm] = useState({
        cycleStart: "",
        cycleEnd: "",
        amount: "",
        fees: "",
        settlementMode: "IMPS",
        notes: "",
    });
    const [reportForm, setReportForm] = useState({
        rangeStart: "",
        rangeEnd: "",
        type: "TRANSACTIONS",
    });

    const settlementsQuery = useQuery<{ success: boolean; data: SettlementRecord[] }>({
        queryKey: ["settlements", statusFilter],
        queryFn: async () => {
            const url = new URL("/api/merchant/settlements", window.location.origin);
            if (statusFilter !== "all") {
                url.searchParams.set("status", statusFilter);
            }
            const res = await fetch(url.toString(), { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load settlements");
            return res.json();
        },
    });

    const reportsQuery = useQuery<{ success: boolean; data: ReportRecord[] }>({
        queryKey: ["reports"],
        queryFn: async () => {
            const res = await fetch("/api/merchant/reports", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load reports");
            return res.json();
        },
    });

    const manualMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/merchant/settlements/manual-trigger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...manualForm,
                    amount: Number(manualForm.amount),
                    fees: manualForm.fees ? Number(manualForm.fees) : 0,
                }),
            });
            if (!res.ok) throw new Error("Failed to trigger settlement");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settlements"] });
            setManualForm({ cycleStart: "", cycleEnd: "", amount: "", fees: "", settlementMode: "IMPS", notes: "" });
        },
    });

    const reportMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/merchant/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reportForm),
            });
            if (!res.ok) throw new Error("Failed to create report");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reports"] });
            setReportForm({ rangeStart: "", rangeEnd: "", type: "TRANSACTIONS" });
        },
    });

    const settlements = settlementsQuery.data?.data || [];
    const reports = reportsQuery.data?.data || [];

    return (
        <div className="space-y-6">
            <HeaderSetter title="Settlements" desc="Track settlement cycles & reports" />

            <section className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex items-center justify-between">
                        <div>
                            <CardTitle>Upcoming cycles</CardTitle>
                            <CardDescription>Latest settlement snapshots</CardDescription>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PROCESSING">Processing</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {settlementsQuery.isLoading ? (
                                <p className="text-sm text-muted-foreground">Loading settlements...</p>
                            ) : settlements.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No settlements available.</p>
                            ) : (
                                settlements.map((settlement) => (
                                    <div key={settlement._id} className="rounded-xl border p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm text-muted-foreground">{formatDateRange(settlement.cycleStart, settlement.cycleEnd)}</p>
                                                <p className="text-lg font-semibold">{formatAmount(settlement.netAmount)}</p>
                                            </div>
                                            <Badge variant={badgeVariant(settlement.status)}>{settlement.status}</Badge>
                                        </div>
                                        <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                                            <span>Fees: {formatAmount(settlement.fees)}</span>
                                            <span>Mode: {settlement.settlementMode}</span>
                                            <span>Reference: {settlement.referenceId || "-"}</span>
                                        </div>
                                        {settlement.notes && <p className="mt-2 text-sm text-muted-foreground">Notes: {settlement.notes}</p>}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Manual Settlement</CardTitle>
                        <CardDescription>Trigger payout for an off-cycle period</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input type="date" value={manualForm.cycleStart} onChange={(e) => setManualForm({ ...manualForm, cycleStart: e.target.value })} placeholder="Cycle start" />
                        <Input type="date" value={manualForm.cycleEnd} onChange={(e) => setManualForm({ ...manualForm, cycleEnd: e.target.value })} placeholder="Cycle end" />
                        <Input type="number" value={manualForm.amount} onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })} placeholder="Amount" />
                        <Input type="number" value={manualForm.fees} onChange={(e) => setManualForm({ ...manualForm, fees: e.target.value })} placeholder="Fees" />
                        <Select value={manualForm.settlementMode} onValueChange={(value) => setManualForm({ ...manualForm, settlementMode: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IMPS">IMPS</SelectItem>
                                <SelectItem value="NEFT">NEFT</SelectItem>
                                <SelectItem value="RTGS">RTGS</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea rows={3} value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} placeholder="Notes (optional)" />
                        <Button onClick={() => manualMutation.mutate()} disabled={manualMutation.isPending} className="w-full">
                            {manualMutation.isPending ? "Submitting..." : "Trigger Settlement"}
                        </Button>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Reports</CardTitle>
                        <CardDescription>Downloadable transaction/settlement reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {reportsQuery.isLoading ? (
                                <p className="text-sm text-muted-foreground">Loading reports...</p>
                            ) : reports.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No reports generated.</p>
                            ) : (
                                reports.map((report) => (
                                    <div key={report._id} className="flex flex-wrap items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">{report.type}</p>
                                            <p className="text-xs text-muted-foreground">{formatDateRange(report.rangeStart, report.rangeEnd)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={badgeVariant(report.status)}>{report.status}</Badge>
                                            {report.downloadUrl && (
                                                <a href={report.downloadUrl} className="text-sm text-primary" target="_blank" rel="noreferrer">
                                                    Download
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Request Report</CardTitle>
                        <CardDescription>Queue detailed CSV with desired range</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Select value={reportForm.type} onValueChange={(value) => setReportForm({ ...reportForm, type: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Report type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TRANSACTIONS">Transactions</SelectItem>
                                <SelectItem value="SETTLEMENTS">Settlements</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="date" value={reportForm.rangeStart} onChange={(e) => setReportForm({ ...reportForm, rangeStart: e.target.value })} />
                        <Input type="date" value={reportForm.rangeEnd} onChange={(e) => setReportForm({ ...reportForm, rangeEnd: e.target.value })} />
                        <Button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending} className="w-full">
                            {reportMutation.isPending ? "Queuing..." : "Generate Report"}
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

function formatDateRange(start: string, end: string) {
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`;
    } catch {
        return "-";
    }
}

function badgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "PAID":
            return "default";
        case "FAILED":
            return "destructive";
        case "PROCESSING":
            return "secondary";
        default:
            return "outline";
    }
}

function formatAmount(value: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
}

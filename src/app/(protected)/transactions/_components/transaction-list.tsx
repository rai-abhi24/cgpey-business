"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useServerTable } from "@/components/merchant/transactions/use-server-table";
import { TransactionFilters, TransactionFilterState } from "@/components/merchant/transactions/transaction-filters";
import { useSession } from "@/context/session-context";
import { RefreshCw } from "lucide-react";
import { ISession } from "@/types/session";

interface TransactionRow {
    id: string;
    orderId: string;
    paymentId: string;
    gatewayTxnId: string;
    utr: string;
    gateway: string;
    paymentMode: string;
    amount: number;
    state: string;
    createdAt: string;
    completedAt?: string;
}

export default function TransactionsList() {
    const { session }: { session: ISession | null } = useSession();
    const [exporting, setExporting] = useState(false);
    const [filters, setFilters] = useState<TransactionFilterState>({
        search: "",
        status: "all",
        paymentMode: "all",
        dateFrom: "",
        dateTo: "",
        minAmount: "",
        maxAmount: "",
        environment: session?.currentMode ?? "live",
    });

    useEffect(() => {
        setFilters((prev) => ({ ...prev, environment: session?.currentMode ?? "live" }));
    }, [session?.currentMode]);

    const { rows, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useServerTable<TransactionRow, TransactionFilterState>({
        endpoint: "/api/merchant/transactions",
        params: filters,
    });

    const handleFilterChange = (partial: Partial<TransactionFilterState>) => {
        setFilters((prev) => ({ ...prev, ...partial }));
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch("/api/merchant/transactions/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(filters),
            });
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `transactions-${Date.now()}.csv`;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <TransactionFilters
                filters={filters}
                onChange={handleFilterChange}
                onExport={handleExport}
                exporting={exporting}
                environments={session?.allowedModes || []}
            />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transactions</CardTitle>
                        <p className="text-sm text-muted-foreground">Showing {rows.length} records</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className={`mr-1 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Payment ID</TableHead>
                                    <TableHead>Gateway Txn</TableHead>
                                    <TableHead>UTR</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Completed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                                            Loading transactions...
                                        </TableCell>
                                    </TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                                            No transactions for selected filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((row) => (
                                        <TableRow key={row.id} className="text-sm">
                                            <TableCell className="font-medium">{row.orderId}</TableCell>
                                            <TableCell>{row.paymentId}</TableCell>
                                            <TableCell>{row.gatewayTxnId}</TableCell>
                                            <TableCell>{row.utr}</TableCell>
                                            <TableCell>{row.paymentMode}</TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(row.amount)}</TableCell>
                                            <TableCell>
                                                <Badge variant={stateVariant(row.state)}>{row.state}</Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(row.createdAt)}</TableCell>
                                            <TableCell>{row.completedAt ? formatDate(row.completedAt) : "-"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {hasNextPage && (
                        <div className="mt-4 flex justify-center">
                            <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                                {isFetchingNextPage ? "Loading..." : "Load more"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// function SummaryCard({ title, value }: { title: string; value: string }) {
//     return (
//         <Card>
//             <CardHeader className="pb-0">
//                 <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
//             </CardHeader>
//             <CardContent>
//                 <p className="text-2xl font-semibold">{value}</p>
//             </CardContent>
//         </Card>
//     );
// }

function stateVariant(state: string): "default" | "secondary" | "destructive" | "outline" {
    switch (state) {
        case "COMPLETED":
            return "default";
        case "FAILED":
            return "destructive";
        case "PENDING":
            return "secondary";
        default:
            return "outline";
    }
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount || 0);
}

function formatDate(value: string) {
    try {
        const date = new Date(value);
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "-";
    }
}

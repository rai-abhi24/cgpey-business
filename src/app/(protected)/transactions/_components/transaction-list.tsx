"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

type Transaction = {
    _id: string;
    paymentId?: string;
    merchantOrderId: string;
    gatewayTxnId?: string;
    utr?: string;
    gateway: string;
    paymentMode?: string;
    vpa?: string;
    amount: number;
    state: string;
    createdAt: string;
    paymentInitiatedAt?: string;
    completedAt?: string;
};

async function fetchTransactions({
    page,
    search,
    status,
    dateRange,
}: {
    page: number;
    search: string;
    status: string;
    dateRange: string;
}) {
    const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
        status,
        dateRange,
    });
    const res = await fetch(`/api/transactions?${params}`);
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return res.json();
}

export default function TransactionsTable() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateRangeFilter, setDateRangeFilter] = useState("");

    const query = useQuery({
        queryKey: ["transactions", page, searchTerm, statusFilter, dateRangeFilter],
        queryFn: () =>
            fetchTransactions({
                page,
                search: searchTerm,
                status: statusFilter,
                dateRange: dateRangeFilter,
            }),
    });

    const transactions: Transaction[] = query.data?.data || [];
    const total = query.data?.total || 0;
    const limit = query.data?.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search by Order ID, Txn ID or UTR..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 py-6 max-w-[350px]"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] py-6">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="SUCCESS">Success</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] py-6">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Transactions ({total})</CardTitle>
                </CardHeader>
                <CardContent>
                    {query.isLoading ? (
                        <p className="text-center text-sm text-muted-foreground">
                            Loading...
                        </p>
                    ) : (
                        <div className="overflow-x-scroll">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-primary hover:bg-primary">
                                        <TableHead className="text-white text-nowrap">#</TableHead>
                                        <TableHead className="text-white text-nowrap">Order ID</TableHead>
                                        <TableHead className="text-white text-nowrap">Payment ID</TableHead>
                                        <TableHead className="text-white text-nowrap">Provider Txn ID</TableHead>
                                        <TableHead className="text-white text-nowrap">UTR</TableHead>
                                        <TableHead className="text-white text-nowrap">Gateway</TableHead>
                                        <TableHead className="text-white text-nowrap text-right">Amount</TableHead>
                                        <TableHead className="text-white text-nowrap">Status</TableHead>
                                        <TableHead className="text-white text-nowrap">Date</TableHead>
                                        <TableHead className="text-white text-nowrap">Initiated At</TableHead>
                                        <TableHead className="text-white text-nowrap">Completed At</TableHead>
                                        <TableHead className="text-white text-nowrap">Duration</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={12}
                                                className="text-center text-sm text-muted-foreground"
                                            >
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((t, i) => {
                                            const start = new Date(t.createdAt);
                                            const end = t.completedAt
                                                ? new Date(t.completedAt)
                                                : undefined;
                                            const duration =
                                                end && start
                                                    ? `${Math.round(
                                                        (end.getTime() - start.getTime()) / 1000
                                                    )}s`
                                                    : "-";

                                            return (
                                                <TableRow key={t._id}>
                                                    <TableCell className="py-4">{(page - 1) * limit + i + 1}</TableCell>
                                                    <TableCell className="text-nowrap">{t.merchantOrderId}</TableCell>
                                                    <TableCell>{t.paymentId || "-"}</TableCell>
                                                    <TableCell>{t.gatewayTxnId || "-"}</TableCell>
                                                    <TableCell>{t.utr || "-"}</TableCell>
                                                    <TableCell className="capitalize">{t.gateway}</TableCell>
                                                    <TableCell className="text-right">
                                                        ₹{(t.amount).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs font-medium ${t.state === "COMPLETED"
                                                                ? "bg-green-100 text-green-800"
                                                                : t.state === "FAILED"
                                                                    ? "bg-red-100 text-red-800"
                                                                    : t.state === "PENDING"
                                                                        ? "bg-yellow-100 text-yellow-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                                }`}
                                                        >
                                                            {t.state}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {t.paymentInitiatedAt
                                                            ? new Date(t.paymentInitiatedAt).toLocaleDateString()
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {t.paymentInitiatedAt
                                                            ? new Date(t.paymentInitiatedAt).toLocaleTimeString()
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {t.completedAt
                                                            ? new Date(t.completedAt).toLocaleTimeString()
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell>{duration}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4">
                        <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
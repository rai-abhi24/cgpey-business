"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Download, RotateCw } from "lucide-react";

export interface TransactionFilterState {
    search: string;
    status: string;
    paymentMode: string;
    dateFrom: string;
    dateTo: string;
    minAmount: string;
    maxAmount: string;
    environment: string;
}

interface TransactionFiltersProps {
    filters: TransactionFilterState;
    onChange: (partial: Partial<TransactionFilterState>) => void;
    onExport: () => Promise<void> | void;
    exporting: boolean;
    environments: string[];
}

const statusOptions = [
    { label: "All statuses", value: "all" },
    { label: "Success", value: "SUCCESS" },
    { label: "Pending", value: "PENDING" },
    { label: "Failed", value: "FAILED" },
    // { label: "Expired", value: "EXPIRED" },
];

const paymentModes = [
    { label: "All modes", value: "all" },
    { label: "UPI Intent", value: "UPI_INTENT" },
    { label: "UPI Collect", value: "UPI_COLLECT" },
    { label: "UPI QR", value: "UPI_QR" },
    { label: "Cards", value: "CARD" },
    { label: "NetBanking", value: "NET_BANKING" },
];

export function TransactionFilters({ filters, onChange, onExport, exporting, environments }: TransactionFiltersProps) {
    const handleReset = () => {
        onChange({
            search: "",
            status: "all",
            paymentMode: "all",
            dateFrom: "",
            dateTo: "",
            minAmount: "",
            maxAmount: "",
            environment: environments[0] || "UAT",
        });
    };

    return (
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <Input
                    placeholder="Search order, payment, UTR"
                    value={filters.search}
                    onChange={(e) => onChange({ search: e.target.value })}
                />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onExport} disabled={true || exporting} className={`cursor-not-allowed`}>
                        <Download className="mr-2 h-4 w-4" />
                        {exporting ? "Preparing..." : "Export CSV"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <Select value={filters.status} onValueChange={(value) => onChange({ status: value })}>
                    <SelectTrigger className="h-11">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.paymentMode} onValueChange={(value) => onChange({ paymentMode: value })}>
                    <SelectTrigger className="h-11">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                        {paymentModes.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.environment} onValueChange={(value) => onChange({ environment: value })}>
                    <SelectTrigger className="h-11">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                        {environments.map((env) => (
                            <SelectItem key={env} value={env}>
                                {env}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => onChange({ dateFrom: e.target.value })}
                    placeholder="From date"
                />
                <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onChange({ dateTo: e.target.value })}
                    placeholder="To date"
                />
                <Input
                    type="number"
                    min="0"
                    value={filters.minAmount}
                    onChange={(e) => onChange({ minAmount: e.target.value })}
                    placeholder="Min amount"
                />
                <Input
                    type="number"
                    min="0"
                    value={filters.maxAmount}
                    onChange={(e) => onChange({ maxAmount: e.target.value })}
                    placeholder="Max amount"
                />
            </div>
        </div>
    );
}

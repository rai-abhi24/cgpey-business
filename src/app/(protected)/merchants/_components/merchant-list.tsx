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
import { Filter, Plus, Search } from "lucide-react";
import AddMerchantDialog from "./dialogs/add-merchant";

type Merchant = {
    _id: string | number;
    business: { legalName: string };
    personal: { name: string; email: string };
    businessEntityType: string;
    status: string;
    createdAt: string;
};

async function fetchMerchants({
    page,
    search,
    status,
}: {
    page: number;
    search: string;
    status: string;
}) {
    const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
        status
    });
    const res = await fetch(`/api/merchants?${params}`);
    if (!res.ok) throw new Error("Failed to fetch merchants");
    return res.json();
}

export default function MerchantsTable() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showAddMerchantDialog, setShowAddMerchantDialog] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["merchants", page, searchTerm, statusFilter],
        queryFn: () => fetchMerchants({ page, search: searchTerm, status: statusFilter }),
    });

    const merchants: Merchant[] = data?.data || [];
    const total = data?.total || 0;
    const limit = data?.limit || 10;
    const totalPages = Math.ceil(total / limit);

    const toggleAddMerchantDialog = () => {
        setShowAddMerchantDialog(!showAddMerchantDialog);
    };

    return (
        <>
            <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search merchants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 py-6 max-w-[250px]"
                            data-testid="input-search-merchants"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] py-6" data-testid="select-status-filter">
                            <Filter className="h-4 w-4" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem className="py-3" value="all">All Status</SelectItem>
                            <SelectItem className="py-3" value="pending">Pending</SelectItem>
                            <SelectItem className="py-3" value="approved">Approved</SelectItem>
                            <SelectItem className="py-3" value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={toggleAddMerchantDialog}
                        data-testid="button-create-merchant"
                        className="py-6 cursor-pointer text-[15px]"
                    >
                        Add Merchant
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Merchants ({total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-center text-sm text-muted-foreground">Loading...</p>
                        ) : (
                            <div className="overflow-x-auto lg:max-h-[calc(100vh-355px)]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-primary hover:bg-primary">
                                            <TableHead className="text-white">S No</TableHead>
                                            <TableHead className="text-white">Business Name</TableHead>
                                            <TableHead className="text-white">Owner</TableHead>
                                            <TableHead className="text-white">Email</TableHead>
                                            <TableHead className="text-white">Type</TableHead>
                                            <TableHead className="text-white">Status</TableHead>
                                            <TableHead className="text-white">Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {merchants.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                                                    No merchants found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            merchants.map((m, i) => (
                                                <TableRow key={m._id}>
                                                    <TableCell className="py-4">{(page - 1) * limit + i + 1}</TableCell>
                                                    <TableCell>{m.business.legalName}</TableCell>
                                                    <TableCell>{m.personal.name}</TableCell>
                                                    <TableCell>{m.personal.email}</TableCell>
                                                    <TableCell className="capitalize">
                                                        {m.businessEntityType.split("_").join(" ")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`capitalize px-2 py-1 rounded text-xs font-medium 
                                                            ${m.status === "approved" ? "bg-green-100 text-green-800"
                                                                    : m.status === "rejected" ? "bg-red-100 text-red-800"
                                                                        : "bg-yellow-100 text-yellow-800"
                                                                }`}
                                                        >
                                                            {m.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(m.createdAt).toLocaleDateString("en-IN", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "2-digit",
                                                        })}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-6 relative">
                            <Button
                                className="py-5"
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
                                className="py-5"
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
            {/* Add Merchant */}
            <AddMerchantDialog open={showAddMerchantDialog} setOpen={setShowAddMerchantDialog} />
        </>
    );
}
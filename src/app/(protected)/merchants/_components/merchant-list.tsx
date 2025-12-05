"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import MerchantDialog from "./dialogs/MerchantDialog";
import { Filter, Plus, Search, LogIn, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type MerchantRow = {
    _id: string;
    merchantId: string;
    merchantName: string;
    businessName: string;
    email: string;
    phone: string;
    businessEntityType: string;
    status: "pending" | "approved" | "rejected";
    activeMode: "UAT" | "PROD";
    canSwitchMode: boolean;
    createdAt: string;
};

async function fetchMerchants(params: {
    page: number;
    search: string;
    status: string;
}) {
    const qs = new URLSearchParams({
        page: String(params.page),
        limit: "10",
        search: params.search,
        status: params.status,
    });

    const res = await fetch(`/api/merchants?${qs.toString()}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch merchants");
    return res.json();
}

export default function MerchantList() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddMerchantDialog, setShowAddMerchantDialog] = useState(false);
    const [editingMerchant, setEditingMerchant] = useState<MerchantRow | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["merchants", page, searchTerm, statusFilter],
        queryFn: () => fetchMerchants({ page, search: searchTerm, status: statusFilter }),
    });

    const merchants: MerchantRow[] = data?.data || [];
    const total = data?.total || 0;
    const limit = data?.limit || 10;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const toggleAddMerchantDialog = () => setShowAddMerchantDialog((v) => !v);

    // ---- Admin -> Login as Merchant ----
    const impersonateMutation = useMutation({
        mutationFn: async (merchantId: string) => {
            const res = await fetch("/api/merchants/impersonate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ merchantId }),
            });
            if (!res.ok) throw new Error("Failed to impersonate");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Logged in as merchant");
            window.location.href = "/";
        },
        onError: (err: any) => {
            toast.error(err.message || "Impersonation failed");
        },
    });

    const updateMerchantMutation = useMutation({
        mutationFn: async (payload: Partial<MerchantRow> & { merchantId: string }) => {
            const res = await fetch("/api/merchants", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Update failed");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Merchant updated");
            queryClient.invalidateQueries({ queryKey: ["merchants"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Update failed");
        },
    });

    const handleToggleCanSwitch = (row: MerchantRow) => {
        updateMerchantMutation.mutate({
            merchantId: row.merchantId,
            canSwitchMode: !row.canSwitchMode,
        });
    };

    const handleStatusChange = (row: MerchantRow, nextStatus: string) => {
        updateMerchantMutation.mutate({
            merchantId: row.merchantId,
            status: nextStatus as any,
        });
    };

    return (
        <>
            <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search merchants..."
                            value={searchTerm}
                            onChange={(e) => {
                                setPage(1);
                                setSearchTerm(e.target.value);
                            }}
                            className="pl-10 py-6"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select
                            value={statusFilter}
                            onValueChange={(val) => {
                                setPage(1);
                                setStatusFilter(val);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[180px] py-6">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={toggleAddMerchantDialog}
                            className="py-6 cursor-pointer text-[15px]"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Merchant
                        </Button>
                    </div>
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
                                            <TableHead className="text-white text-nowrap">S No</TableHead>
                                            <TableHead className="text-white text-nowrap">Merchant ID</TableHead>
                                            <TableHead className="text-white text-nowrap">Business Name</TableHead>
                                            <TableHead className="text-white text-nowrap">Owner Email</TableHead>
                                            <TableHead className="text-white text-nowrap">Mode</TableHead>
                                            <TableHead className="text-white text-nowrap">Can Switch</TableHead>
                                            <TableHead className="text-white text-nowrap">Status</TableHead>
                                            <TableHead className="text-white text-nowrap">Created</TableHead>
                                            <TableHead className="text-white text-nowrap">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {merchants.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                                                    No merchants found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            merchants.map((m, i) => (
                                                <TableRow key={m._id}>
                                                    <TableCell className="py-3">
                                                        {(page - 1) * limit + i + 1}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs font-bold">
                                                        {m.merchantId}
                                                    </TableCell>
                                                    <TableCell className="text-nowrap">{m.businessName || m.merchantName}</TableCell>
                                                    <TableCell className="text-nowrap">{m.email}</TableCell>

                                                    <TableCell>
                                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100">
                                                            {m.activeMode}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="flex mt-1.5 mr-1 justify-center">
                                                        <Switch
                                                            checked={m.canSwitchMode}
                                                            onCheckedChange={() => handleToggleCanSwitch(m)}
                                                        />
                                                    </TableCell>

                                                    <TableCell>
                                                        <Select
                                                            value={m.status}
                                                            onValueChange={(val) => handleStatusChange(m, val)}
                                                        >
                                                            <SelectTrigger className="h-8 w-[120px] text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Pending</SelectItem>
                                                                <SelectItem value="approved">Approved</SelectItem>
                                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>

                                                    <TableCell className="text-nowrap">
                                                        {new Date(m.createdAt).toLocaleDateString("en-IN", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "2-digit",
                                                        })}
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="py-2 pr-2"
                                                                onClick={() => {
                                                                    setEditingMerchant(m);
                                                                    setShowEditDialog(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4 mr-1" /> Edit
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => impersonateMutation.mutate(m.merchantId)}
                                                            >
                                                                <LogIn className="h-4 w-4 mr-1" />
                                                                Login
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-6">
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
            <MerchantDialog mode="add" open={showAddMerchantDialog} setOpen={setShowAddMerchantDialog} />
            <MerchantDialog mode="edit" open={showEditDialog} setOpen={setShowEditDialog} initialData={editingMerchant} />

            {/* <EditMerchantDialog
                open={showEditDialog}
                setOpen={setShowEditDialog}
                initialData={editingMerchant}
            /> */}
        </>
    );
}
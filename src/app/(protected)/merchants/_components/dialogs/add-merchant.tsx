"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import InputField from "@/components/common/input-field";

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export default function AddMerchantDialog({ open, setOpen }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        merchantName: "",
        businessName: "",
        email: "",
        phone: "",
        businessEntityType: "",
        website: "",
        perTransactionLimit: "",
        callbackUrlUat: "",
        callbackUrlProd: "",
        canSwitchMode: "yes", // "yes" | "no"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = {
                merchantName: form.merchantName,
                businessName: form.businessName,
                email: form.email,
                phone: form.phone,
                businessEntityType: form.businessEntityType,
                website: form.website,
                perTransactionLimit: Number(form.perTransactionLimit || 0),
                callbackUrlUat: form.callbackUrlUat || undefined,
                callbackUrlProd: form.callbackUrlProd || undefined,
                canSwitchMode: form.canSwitchMode === "yes",
            };

            const res = await fetch("/api/merchants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error((await res.json()).message || "Failed");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Merchant created successfully 🎉");
            setOpen(false);
            setForm({
                merchantName: "",
                businessName: "",
                email: "",
                phone: "",
                businessEntityType: "",
                website: "",
                perTransactionLimit: "",
                callbackUrlUat: "",
                callbackUrlProd: "",
                canSwitchMode: "yes",
            });
            queryClient.invalidateQueries({ queryKey: ["merchants"] });
            router.refresh();
        },
        onError: (err: any) => {
            toast.error(err.message || "Something went wrong");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Add Merchant</DialogTitle>
                    <DialogDescription>Onboard a new merchant for pay-ins.</DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4"
                >
                    {/* Basic */}
                    <InputField
                        label="Merchant Display Name"
                        name="merchantName"
                        value={form.merchantName}
                        handleChange={handleChange}
                        htmlFor="merchantName"
                        placeholder="Eg. My Shop"
                        required
                    />
                    <InputField
                        label="Business Legal Name"
                        name="businessName"
                        value={form.businessName}
                        handleChange={handleChange}
                        htmlFor="businessName"
                        placeholder="Eg. My Shop Pvt Ltd"
                        required
                    />

                    {/* Contact */}
                    <InputField
                        label="Owner Email"
                        name="email"
                        type="email"
                        value={form.email}
                        handleChange={handleChange}
                        htmlFor="email"
                        placeholder="owner@example.com"
                        required
                    />
                    <InputField
                        label="Owner Mobile"
                        name="phone"
                        maxLength={10}
                        value={form.phone}
                        handleChange={handleChange}
                        htmlFor="phone"
                        placeholder="10-digit mobile"
                        required
                    />

                    {/* Entity Type */}
                    <div>
                        <Label>
                            Business Entity Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={form.businessEntityType}
                            onValueChange={(value) =>
                                setForm((prev) => ({ ...prev, businessEntityType: value }))
                            }
                        >
                            <SelectTrigger className="mt-1 py-5.5">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SOLE_PROPRIETOR">Sole Proprietor</SelectItem>
                                <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                                <SelectItem value="PVT_LTD">Private Limited</SelectItem>
                                <SelectItem value="LLP">LLP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Pay-in / API basics */}
                    <InputField
                        label="Website / App Domain"
                        name="website"
                        value={form.website}
                        handleChange={handleChange}
                        htmlFor="website"
                        placeholder="https://example.com"
                        required
                    />

                    <InputField
                        label="Per Transaction Limit (₹)"
                        type="number"
                        name="perTransactionLimit"
                        value={form.perTransactionLimit}
                        handleChange={handleChange}
                        htmlFor="perTransactionLimit"
                        placeholder="Eg. 50000"
                        required
                    />

                    <InputField
                        label="Callback URL (UAT)"
                        name="callbackUrlUat"
                        value={form.callbackUrlUat}
                        handleChange={handleChange}
                        htmlFor="callbackUrlUat"
                        placeholder="https://uat.example.com/payments/callback"
                    />
                    <InputField
                        label="Callback URL (PROD)"
                        name="callbackUrlProd"
                        value={form.callbackUrlProd}
                        handleChange={handleChange}
                        htmlFor="callbackUrlProd"
                        placeholder="https://example.com/payments/callback"
                    />

                    {/* Mode Switch Permission */}
                    <div>
                        <Label>
                            Allow merchant to switch modes?
                            <span className="text-red-500">&nbsp;*</span>
                        </Label>
                        <Select
                            value={form.canSwitchMode}
                            onValueChange={(value) =>
                                setForm((prev) => ({ ...prev, canSwitchMode: value }))
                            }
                        >
                            <SelectTrigger className="mt-1 py-5.5">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="yes">Yes (UAT & PROD toggle)</SelectItem>
                                <SelectItem value="no">
                                    No (Admin controls mode only)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="px-6">
                            {mutation.isPending ? "Creating..." : "Create Merchant"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
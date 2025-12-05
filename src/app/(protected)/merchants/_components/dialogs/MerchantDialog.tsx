"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import InputField from "@/components/common/input-field";

type MerchantDialogProps = {
    open: boolean;
    setOpen: (v: boolean) => void;
    mode: "add" | "edit";
    initialData?: any;
};

export default function MerchantDialog({ open, setOpen, mode, initialData }: MerchantDialogProps) {
    const queryClient = useQueryClient();

    /** ---------- FORM STATE ---------- **/
    const [form, setForm] = useState({
        merchantName: "",
        businessName: "",
        email: "",
        phone: "",
        phoneMerchantId: "",
        businessEntityType: "",
        website: "",
        perTransactionLimit: "",
        dailyTransactionLimit: "",
        monthlyTransactionLimit: "",
        businessRegistrationNumber: "",
        businessAddress: "",
        webhookUrl: "",
        allowedIPs: "",
        canSwitchMode: "yes",
    });

    /** Prefill when editing */
    useEffect(() => {
        if (mode === "edit" && initialData) {
            setForm({
                merchantName: initialData.merchantName || "",
                businessName: initialData.businessName || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                phoneMerchantId: initialData.phoneMerchantId || "",
                businessEntityType: initialData.businessEntityType || "",
                website: initialData.website || "",
                perTransactionLimit: String(initialData.perTransactionLimit || ""),
                dailyTransactionLimit: String(initialData.dailyTransactionLimit || ""),
                monthlyTransactionLimit: String(initialData.monthlyTransactionLimit || ""),
                businessRegistrationNumber: initialData.businessRegistrationNumber || "",
                businessAddress: initialData.businessAddress || "",
                webhookUrl: initialData.webhookConfig?.url || "",
                allowedIPs: (initialData.allowedIPs || []).join(", "),
                canSwitchMode: initialData.canSwitchMode ? "yes" : "no",
            });
        }
    }, [initialData, mode]);

    const handleChange = (e: any) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    /** ---------- CREATE / UPDATE MUTATION ---------- **/
    const mutation = useMutation({
        mutationFn: async () => {
            const allowedIPsArray = form.allowedIPs
                ? form.allowedIPs.split(",").map((i) => i.trim()).filter(Boolean)
                : undefined;

            const payload: any = {
                merchantName: form.merchantName.trim(),
                businessName: form.businessName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                phoneMerchantId: form.phoneMerchantId.trim(),
                businessEntityType: form.businessEntityType,
                website: form.website.trim(),
                perTransactionLimit: Number(form.perTransactionLimit),
                dailyTransactionLimit: form.dailyTransactionLimit ? Number(form.dailyTransactionLimit) : undefined,
                monthlyTransactionLimit: form.monthlyTransactionLimit ? Number(form.monthlyTransactionLimit) : undefined,
                businessRegistrationNumber: form.businessRegistrationNumber || undefined,
                businessAddress: form.businessAddress || undefined,
                webhookUrl: form.webhookUrl || undefined,
                allowedIPs: allowedIPsArray,
                canSwitchMode: form.canSwitchMode === "yes",
            };

            if (mode === "edit") {
                payload.merchantId = initialData.merchantId;

                const res = await fetch(`/api/merchants`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                });

                if (!res.ok) throw new Error("Failed to update merchant");
                return res.json();
            }

            const res = await fetch(`/api/merchants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to create merchant");
            }

            return res.json();
        },

        onSuccess: () => {
            toast.success(mode === "edit" ? "Merchant updated!" : "Merchant created!");
            queryClient.invalidateQueries({ queryKey: ["merchants"] });
            handleClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Something went wrong");
        },
    });

    /** ---------- VALIDATION ---------- **/
    const validate = () => {
        if (!form.merchantName.trim()) return toast.error("Merchant name is required");
        if (!form.businessName.trim()) return toast.error("Business name is required");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error("Valid email required");
        if (!/^\d{10}$/.test(form.phone)) return toast.error("Valid 10-digit phone required");
        if (!form.phoneMerchantId.trim()) return toast.error("Phone Merchant ID is required");
        if (!form.businessEntityType) return toast.error("Business entity type required");
        if (!form.website.trim()) return toast.error("Website is required");
        if (!form.perTransactionLimit || Number(form.perTransactionLimit) <= 0)
            return toast.error("Per transaction limit must be > 0");
        return true;
    };

    /** ---------- SUBMIT ---------- **/
    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (validate()) mutation.mutate();
    };

    /** ---------- RESET & CLOSE ---------- **/
    const handleClose = () => {
        setOpen(false);

        setForm({
            merchantName: "",
            businessName: "",
            email: "",
            phone: "",
            phoneMerchantId: "",
            businessEntityType: "",
            website: "",
            perTransactionLimit: "",
            dailyTransactionLimit: "",
            monthlyTransactionLimit: "",
            businessRegistrationNumber: "",
            businessAddress: "",
            webhookUrl: "",
            allowedIPs: "",
            canSwitchMode: "yes",
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "edit" ? "Edit Merchant" : "Add Merchant"}</DialogTitle>
                    <DialogDescription>
                        {mode === "edit"
                            ? "Modify merchant details."
                            : "Create a new merchant onboarding entry."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* BASIC INFO */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <InputField htmlFor="merchantName" label="Merchant Display Name" name="merchantName" placeholder="Merchant Name" value={form.merchantName} handleChange={handleChange} required />
                            <InputField htmlFor="businessName" label="Business Legal Name" name="businessName" placeholder="Business Name" value={form.businessName} handleChange={handleChange} required />
                            <InputField htmlFor="email" label="Owner Email" name="email" type="email" placeholder="Email" value={form.email} handleChange={handleChange} required />
                            <InputField htmlFor="phone" label="Owner Mobile" name="phone" type="tel" placeholder="Mobile" maxLength={10} value={form.phone} handleChange={handleChange} required />
                            <InputField htmlFor="website" label="Website" name="website" placeholder="Website" value={form.website} handleChange={handleChange} required />

                            <div>
                                <Label>Business Entity Type *</Label>
                                <Select
                                    value={form.businessEntityType}
                                    onValueChange={(v) => setForm((p) => ({ ...p, businessEntityType: v }))}
                                >
                                    <SelectTrigger className="py-6">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SOLE_PROPRIETOR">Sole Proprietor</SelectItem>
                                        <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                                        <SelectItem value="PVT_LTD">Private Limited</SelectItem>
                                        <SelectItem value="LLP">LLP</SelectItem>
                                        <SelectItem value="PUBLIC_LTD">Public Limited</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <InputField htmlFor="phoneMerchantId" label="Phone Merchant ID (Optional)" name="phoneMerchantId" placeholder="PhonePe Merchant ID" value={form.phoneMerchantId} handleChange={handleChange} />
                        </div>
                    </div>

                    {/* LIMITS */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Transaction Limits</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <InputField htmlFor="perTransactionLimit" label="Per Transaction Limit (₹)" type="number" name="perTransactionLimit" value={form.perTransactionLimit} handleChange={handleChange} required />
                            <InputField htmlFor="dailyTransactionLimit" label="Daily Limit (₹)" name="dailyTransactionLimit" type="number" value={form.dailyTransactionLimit} handleChange={handleChange} />
                            <InputField htmlFor="monthlyTransactionLimit" label="Monthly Limit (₹)" name="monthlyTransactionLimit" type="number" value={form.monthlyTransactionLimit} handleChange={handleChange} />
                        </div>
                    </div>

                    {/* WEBHOOK */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Webhook Configuration</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <InputField htmlFor="webhookUrl" label="Webhook URL" name="webhookUrl" value={form.webhookUrl} handleChange={handleChange} />
                        </div>
                    </div>

                    {/* SECURITY */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Security Settings</h3>
                        <div>
                            <Label>Allowed IPs (comma separated)</Label>
                            <textarea
                                className="w-full border rounded px-3 py-2 mt-1 min-h-[80px]"
                                name="allowedIPs"
                                value={form.allowedIPs}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <Label>Allow merchant to switch modes? *</Label>
                            <Select
                                value={form.canSwitchMode}
                                onValueChange={(v) => setForm((p) => ({ ...p, canSwitchMode: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-5 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Saving..." : mode === "edit" ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
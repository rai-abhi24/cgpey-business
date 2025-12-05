"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
    initialData?: any;
};

interface ApiKeys {
    uat: { publicKey: string; secretKey: string };
    prod: { publicKey: string; secretKey: string };
}

export default function EditMerchantDialog({ open, setOpen, initialData }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        merchantName: "",
        businessName: "",
        phonepeMerchantId: "",
        email: "",
        phone: "",
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

    const [createdKeys, setCreatedKeys] = useState<ApiKeys | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const mutation = useMutation({
        mutationFn: async () => {
            // Parse allowedIPs (comma-separated)
            const allowedIPsArray = form.allowedIPs
                ? form.allowedIPs.split(",").map((ip) => ip.trim()).filter(Boolean)
                : undefined;

            const payload = {
                merchantName: form.merchantName.trim(),
                businessName: form.businessName.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                businessEntityType: form.businessEntityType,
                phonepeMerchantId: form.phonepeMerchantId.trim() || undefined,
                website: form.website.trim(),
                perTransactionLimit: Number(form.perTransactionLimit),
                dailyTransactionLimit: form.dailyTransactionLimit
                    ? Number(form.dailyTransactionLimit)
                    : undefined,
                monthlyTransactionLimit: form.monthlyTransactionLimit
                    ? Number(form.monthlyTransactionLimit)
                    : undefined,
                businessRegistrationNumber: form.businessRegistrationNumber.trim() || undefined,
                businessAddress: form.businessAddress.trim() || undefined,
                webhookUrl: form.webhookUrl.trim() || undefined,
                allowedIPs: allowedIPsArray,
                canSwitchMode: form.canSwitchMode === "yes",
            };

            const res = await fetch("/api/merchants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create merchant");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Merchant created successfully! 🎉");
            queryClient.invalidateQueries({ queryKey: ["merchants"] });
            router.refresh();
            setOpen(false);
        },
        onError: (err: any) => {
            console.log(err.error);

            toast.error(err.message || "Something went wrong");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!form.merchantName.trim()) {
            toast.error("Merchant name is required");
            return;
        }
        if (!form.businessName.trim()) {
            toast.error("Business name is required");
            return;
        }
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            toast.error("Valid email is required");
            return;
        }
        if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) {
            toast.error("Valid 10-digit phone is required");
            return;
        }
        if (!form.businessEntityType) {
            toast.error("Business entity type is required");
            return;
        }
        if (!form.website.trim()) {
            toast.error("Website is required");
            return;
        }
        if (!form.perTransactionLimit || Number(form.perTransactionLimit) <= 0) {
            toast.error("Per transaction limit must be greater than 0");
            return;
        }

        mutation.mutate();
    };

    const handleClose = () => {
        if (createdKeys) {
            const confirm = window.confirm(
                "Make sure you've saved the API keys and webhook secret. They won't be shown again!"
            );
            if (!confirm) return;
        }

        setOpen(false);
        setForm({
            merchantName: "",
            businessName: "",
            phonepeMerchantId: "",
            email: "",
            phone: "",
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
        setCreatedKeys(null);
    };

    useEffect(() => {
        console.log(initialData);
        if (initialData) {
            const data = {
                merchantName: initialData.merchantName,
                businessName: initialData.businessName,
                phonepeMerchantId: initialData.phonepeMerchantId,
                email: initialData.email,
                phone: initialData.phone,
                businessEntityType: initialData.businessEntityType,
                website: initialData.website,
                perTransactionLimit: initialData.perTransactionLimit,
                dailyTransactionLimit: initialData.dailyTransactionLimit,
                monthlyTransactionLimit: initialData.monthlyTransactionLimit,
                businessRegistrationNumber: initialData.businessRegistrationNumber,
                businessAddress: initialData.businessAddress,
                webhookUrl: initialData.webhookConfig?.url || "",
                allowedIPs: initialData.allowedIPs,
                canSwitchMode: initialData.canSwitchMode ? "yes" : "no",
            };

            setForm({
                ...form,
                ...data,
            });
        }
    }, [initialData]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Merchant</DialogTitle>
                    <DialogDescription>
                        Onboard a new merchant for pay-ins. Merchant will be in pending status until approved.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                                        <SelectItem value="PUBLIC_LTD">Public Limited</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <InputField
                                label="Website / App Domain"
                                name="website"
                                value={form.website}
                                handleChange={handleChange}
                                htmlFor="website"
                                placeholder="https://example.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Business Details (Optional) */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Business Details (Optional)</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <InputField
                                label="Business Registration Number"
                                name="businessRegistrationNumber"
                                value={form.businessRegistrationNumber}
                                handleChange={handleChange}
                                htmlFor="businessRegistrationNumber"
                                placeholder="Eg. U12345AB2020PTC123456"
                            />
                            <InputField
                                label="PhonePe Merchant ID (Optional)"
                                name="phonepeMerchantId"
                                value={form.phonepeMerchantId}
                                handleChange={handleChange}
                                htmlFor="phonepeMerchantId"
                                placeholder="PhonePe Merchant ID"
                            />
                            <div className="lg:col-span-2">
                                <Label htmlFor="businessAddress">Business Address</Label>
                                <textarea
                                    id="businessAddress"
                                    name="businessAddress"
                                    value={form.businessAddress}
                                    onChange={handleChange}
                                    placeholder="Full business address"
                                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Transaction Limits */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Transaction Limits</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                                label="Daily Transaction Limit (₹)"
                                type="number"
                                name="dailyTransactionLimit"
                                value={form.dailyTransactionLimit}
                                handleChange={handleChange}
                                htmlFor="dailyTransactionLimit"
                                placeholder="Eg. 500000"
                            />
                            <InputField
                                label="Monthly Transaction Limit (₹)"
                                type="number"
                                name="monthlyTransactionLimit"
                                value={form.monthlyTransactionLimit}
                                handleChange={handleChange}
                                htmlFor="monthlyTransactionLimit"
                                placeholder="Eg. 10000000"
                            />
                        </div>
                    </div>

                    {/* Webhook Configuration */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Webhook Configuration</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <InputField
                                label="Webhook URL"
                                name="webhookUrl"
                                value={form.webhookUrl}
                                handleChange={handleChange}
                                htmlFor="webhookUrl"
                                placeholder="https://example.com/webhooks/payments"
                                required
                            />
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Security Settings</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="allowedIPs">
                                    Allowed IPs (comma-separated, optional)
                                </Label>
                                <textarea
                                    id="allowedIPs"
                                    name="allowedIPs"
                                    value={form.allowedIPs}
                                    onChange={handleChange}
                                    placeholder="Eg. 192.168.1.1, 10.0.0.1"
                                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[80px]"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to allow all IPs
                                </p>
                            </div>
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
                                        <SelectItem value="yes">Yes (Merchant can toggle UAT/PROD)</SelectItem>
                                        <SelectItem value="no">No (Admin controls mode only)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
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
"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import InputField from "@/components/common/input-field";

export default function AddMerchantDialog({
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
}) {
    const router = useRouter();
    const [form, setForm] = useState({
        ownerName: "",
        email: "",
        mobileNumber: "",
        password: "",
        appName: "",
        appType: "",
        vpa: "",
        merchantDomain: "",
        ipAddress: "",
        perTransactionLimit: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/merchants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Failed to create merchant");
            return res.json();
        },
        onSuccess: (data) => {
            toast.success("Merchant created successfully 🎉");
            console.log("Merchant:", data.merchant);
            setOpen(false);
            setForm({
                ownerName: "",
                email: "",
                mobileNumber: "",
                password: "",
                appName: "",
                appType: "",
                vpa: "",
                merchantDomain: "",
                ipAddress: "",
                perTransactionLimit: "",
            });
            router.push("/merchants");
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Merchant</DialogTitle>
                    <DialogDescription>
                        Onboard a new merchant account.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    {/* Owner Name */}
                    <InputField
                        label="Owner Name"
                        name="ownerName"
                        value={form.ownerName}
                        handleChange={handleChange}
                        htmlFor="ownerName"
                        placeholder="Enter owner's name"
                        required
                    />
                    {/* Email */}
                    <InputField
                        label="Email"
                        name="email"
                        value={form.email}
                        handleChange={handleChange}
                        htmlFor="email"
                        placeholder="Enter owner's email"
                        required
                    />

                    {/* Mobile */}
                    <InputField
                        label="Mobile Number"
                        name="mobileNumber"
                        maxLength={10}
                        value={form.mobileNumber}
                        handleChange={handleChange}
                        htmlFor="mobileNumber"
                        placeholder="Enter mobile number"
                        required
                    />

                    {/* Password */}
                    <InputField
                        label="Password"
                        name="password"
                        type="password"
                        value={form.password}
                        handleChange={handleChange}
                        htmlFor="password"
                        placeholder="Enter password (Min Length: 6)"
                        required
                    />

                    {/* App Name */}
                    <InputField
                        label="App Name"
                        name="appName"
                        value={form.appName}
                        handleChange={handleChange}
                        htmlFor="appName"
                        placeholder="Enter app name"
                        required
                    />

                    {/* App Type */}
                    <div>
                        <Label>App Type <span className="text-red-500">&nbsp;*</span></Label>
                        <Select
                            value={form.appType}
                            onValueChange={(value) => setForm({ ...form, appType: value })}
                        >
                            <SelectTrigger className="mt-1 py-5.5">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem className="py-2" value="web">Web</SelectItem>
                                <SelectItem className="py-2" value="mobile">Mobile</SelectItem>
                                <SelectItem className="py-2" value="both">Both</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* VPA */}
                    <InputField
                        label="UPI VPA"
                        name="vpa"
                        value={form.vpa}
                        handleChange={handleChange}
                        htmlFor="vpa"
                        placeholder="Enter VPA"
                        required
                    />

                    {/* Domain */}
                    <InputField
                        label="Merchant Domain"
                        name="merchantDomain"
                        value={form.merchantDomain}
                        handleChange={handleChange}
                        htmlFor="merchantDomain"
                        placeholder="Enter merchant domain"
                        required
                    />

                    {/* IP Address */}
                    <InputField
                        label="IP Address"
                        name="ipAddress"
                        value={form.ipAddress}
                        handleChange={handleChange}
                        htmlFor="ipAddress"
                        placeholder="Enter IP address"
                        required
                    />

                    {/* Transaction Limit */}
                    <InputField
                        label="Per Transaction Limit"
                        type="number"
                        name="perTransactionLimit"
                        value={form.perTransactionLimit}
                        handleChange={handleChange}
                        htmlFor="perTransactionLimit"
                        placeholder="Enter transaction limit"
                        required
                    />

                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="p-6">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="py-6">
                            {mutation.isPending ? "Creating..." : "Create Merchant"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
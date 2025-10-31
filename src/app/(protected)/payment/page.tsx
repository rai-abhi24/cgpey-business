"use client"
import HeaderSetter from "@/components/common/header-setter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PayPage() {
    const [amount, setAmount] = React.useState<string>("");
    const [orderId, setOrderId] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);
    const router = useRouter();

    function generateOrderId() {
        const now = new Date();
        const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `ORD${stamp}${suffix}`;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsed = Number(amount);

        if (!parsed || parsed <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        setLoading(true);
        const params = new URLSearchParams({
            orderId,
            amount: parsed.toFixed(2),
            fee: "10.00",
            items: "2",
        });
        router.push(`/checkout?${params.toString()}`);
    }

    useEffect(() => {
        setOrderId(generateOrderId());
    }, []);

    return (
        <div>
            <HeaderSetter title="Pay" desc="Send a quick demo payment" />
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>New Payment</CardTitle>
                    <CardDescription>Fill the details and click Pay</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid gap-2">
                            <Label htmlFor="orderId">Order ID</Label>
                            <Input
                                id="orderId"
                                placeholder="e.g. ORD-20251030-ZYHGSK"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (INR)</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                className="h-11 appearance-none"
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Processing..." : "Pay"}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setAmount("");
                                    setOrderId(generateOrderId());
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )

}
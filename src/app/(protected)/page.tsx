"use client";

import { useEffect, useState } from "react";
import HeaderSetter from "@/components/common/header-setter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const [orderId, setOrderId] = useState<string>("");
    const [amount, setAmount] = useState<string>("0");
    // const [loading, setLoading] = useState<boolean>(false);
    // const router = useRouter();

    // function handleSubmit(e: React.FormEvent) {
    //     e.preventDefault();
    //     const parsed = Number(amount);

    //     if (!parsed || parsed <= 0) {
    //         toast.error("Please enter a valid amount");
    //         return;
    //     }
    //     setLoading(true);
    //     const params = new URLSearchParams({
    //         orderId,
    //         amount: parsed.toFixed(2),
    //         fee: "10.00",
    //         items: "2",
    //     });
    //     router.push(`/checkout?${params.toString()}`);
    // }

    function generateOrderId() {
        const now = new Date();
        const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const suffix = Math.random().toString(36).slice(2, 4).toUpperCase();
        return `ORD${stamp}${suffix}`;
    }
    useEffect(() => {
        setOrderId(generateOrderId());
        setAmount("10");
    }, []);

    return (
        <div className="">
            <HeaderSetter
                title="Dashboard"
                desc="Welcome to your payment dashboard"
            />

            <div className="container mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Column - Test Payment Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Test Payment Card */}
                        <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-blue-900">
                                    <Zap className="h-5 w-5" />
                                    Test Payment
                                </CardTitle>
                                <CardDescription className="text-blue-700">
                                    Try out with a test transaction
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border border-blue-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">Demo Payment</h3>
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                            Test Mode
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Order ID:</span>
                                            <span className="font-medium">{orderId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Amount:</span>
                                            <span className="font-medium">₹{amount}.00</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Currency:</span>
                                            <span className="font-medium">INR</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Description:</span>
                                            <span className="font-medium">Test Transaction</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="text-xs text-yellow-800 text-center">
                                            💡 This is a sandbox environment. No real money will be charged.
                                        </p>
                                    </div>
                                </div>

                                <Link href={`/checkout?orderId=${orderId}&amount=${amount}&fee=10&items=2`} className="w-full">
                                    <Button className="w-full bg-primary text-white py-3 h-12">
                                        Try Payment Now
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                    {/* <div className="lg:col-span-2 space-y-6">
                        <Card className="max-w-xl">
                            <CardHeader>
                                <CardTitle>Test Payment with custom amount</CardTitle>
                                <CardDescription></CardDescription>
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
                                    <div className="grid gap-2">
                                        <Label htmlFor="desc">Description</Label>
                                        <Input
                                            id="desc"
                                            type="text"
                                            disabled
                                            value={"Test Transaction"}
                                            className="h-11 appearance-none"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button type="submit" disabled={loading} className="w-full h-11">
                                            {loading ? "Processing..." : "Pay"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="w-full h-11"
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
                    </div> */}
                </div>
            </div>
        </div>
    );
}
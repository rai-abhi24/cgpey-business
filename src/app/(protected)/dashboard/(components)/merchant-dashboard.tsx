"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import HeaderSetter from "@/components/common/header-setter";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, IndianRupee, Gauge } from "lucide-react";
import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("./charts/bar-chart"), { ssr: false });
const PieChart = dynamic(() => import("./charts/pie-chart"), { ssr: false });
const Heatmap = dynamic(() => import("./charts/heatmap"), { ssr: false });

export default function MerchantAnalytics() {
    const { data, isLoading } = useQuery({
        queryKey: ["merchant-analytics"],
        queryFn: async () => {
            const res = await fetch("/api/merchant/analytics", { credentials: "include" });
            const json = await res.json();
            return json.data;
        },
        refetchInterval: 60_000,
    });

    return (
        <div className="space-y-6">
            <HeaderSetter title="Advanced Analytics" desc="Deep insights into your payments" />

            {/* KPI ROW */}
            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    title="Today's Transactions"
                    value={sumCounts(data?.todayStats)}
                    icon={<Activity className="text-blue-600" />}
                    loading={isLoading}
                />
                <MetricCard
                    title="Today's Volume"
                    value={"₹" + sumAmounts(data?.todayStats).toLocaleString("en-IN")}
                    icon={<IndianRupee className="text-green-600" />}
                    loading={isLoading}
                />
                <MetricCard
                    title="Success Rate"
                    value={successRate(data?.todayStats) + "%"}
                    icon={<Gauge className="text-purple-600" />}
                    loading={isLoading}
                />
            </section>

            {/* TREND CHART */}
            <Card>
                <CardHeader>
                    <CardTitle>Last 7 Days Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        <BarChart data={formatTrend(data?.trend)} />
                    )}
                </CardContent>
            </Card>

            {/* UPI SPLIT */}
            <Card>
                <CardHeader>
                    <CardTitle>UPI App Split</CardTitle>
                    <CardDescription>GPay / PhonePe / Paytm usage</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        <PieChart data={formatUpi(data?.upiSplit)} />
                    )}
                </CardContent>
            </Card>

            {/* HOURLY HEATMAP */}
            <Card>
                <CardHeader>
                    <CardTitle>Hourly Payments</CardTitle>
                    <CardDescription>Peak times for transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        <Heatmap data={formatHourly(data?.hourly)} />
                    )}
                </CardContent>
            </Card>

            {/* FAILURES */}
            <Card>
                <CardHeader>
                    <CardTitle>Failure Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        data?.failures?.map((f: any) => (
                            <div key={f._id} className="flex justify-between border p-3 rounded-md">
                                <span className="font-medium">{f._id}</span>
                                <span className="font-semibold">{f.count}</span>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* REFUNDS */}
            <Card>
                <CardHeader>
                    <CardTitle>Refund Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        data?.refunds?.map((r: any) => (
                            <div key={r._id} className="flex justify-between border p-3 rounded-md">
                                <span className="font-medium">{r._id}</span>
                                <span className="font-semibold">
                                    {r.count} refunds — ₹{r.amount.toLocaleString("en-IN")}
                                </span>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({ title, value, icon, loading }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-2/3" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
            </CardContent>
        </Card>
    );
}

function sumCounts(arr = []) {
    return arr.reduce((a: number, r: any) => a + (r.count || 0), 0);
}

function sumAmounts(arr = []) {
    return arr.reduce((a: number, r: any) => a + (r.amount || 0), 0);
}

function successRate(arr = []) {
    const total = sumCounts(arr);
    const s = (arr as any[]).find((r: any) => r._id === "COMPLETED")?.count || 0;
    return total ? ((s / total) * 100).toFixed(2) : 0;
}

function formatTrend(arr = []) {
    return arr.map((x: any) => ({
        date: x._id,
        volume: x.amount,
        count: x.count,
    }));
}

function formatUpi(arr = []) {
    return arr.map((x: any) => ({
        label: x._id,
        value: x.count,
    }));
}

function formatHourly(arr = []) {
    return arr.map((x: any) => ({
        hour: x._id,
        count: x.count,
    }));
}
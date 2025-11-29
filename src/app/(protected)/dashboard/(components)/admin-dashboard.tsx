"use client";

import { useQuery } from "@tanstack/react-query";
import HeaderSetter from "@/components/common/header-setter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, PieChart } from "lucide-react";

export default function AdminDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ["admin-insights"],
        queryFn: async () => {
            const res = await fetch("/api/admin/insights", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load");
            return (await res.json()).data;
        },
        refetchInterval: 60000,
    });

    return (
        <div className="space-y-6">
            <HeaderSetter title="Admin Analytics" desc="System-wide business metrics" />

            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    title="Total Merchants"
                    value={data?.totalMerchants}
                    icon={<Users className="h-5 w-5 text-blue-600" />}
                    loading={isLoading}
                />

                <MetricCard
                    title="Total Payments Today"
                    value={(data?.todayStats || []).reduce((a: number, r: any) => a + r.count, 0)}
                    icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                    loading={isLoading}
                />

                <MetricCard
                    title="Today's Volume"
                    value={
                        "₹" +
                        (data?.todayStats || []).reduce((a: number, r: any) => a + r.amount, 0).toLocaleString("en-IN")
                    }
                    icon={<PieChart className="h-5 w-5 text-purple-600" />}
                    loading={isLoading}
                />
            </section>

            {/* GRAPH: LAST 7 DAYS */}
            <Card>
                <CardHeader>
                    <CardTitle>Last 7 Days Volume</CardTitle>
                    <CardDescription>Combined volume across all merchants</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        <AdminTrendChart data={data?.trend || []} />
                    )}
                </CardContent>
            </Card>

            {/* TOP MERCHANTS */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Merchants</CardTitle>
                    <CardDescription>By transaction volume</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {isLoading ? (
                        <Skeleton className="h-32 w-full" />
                    ) : (
                        data?.topMerchants?.map((m: any) => (
                            <div
                                key={m._id}
                                className="flex justify-between items-center border-b py-2 text-sm"
                            >
                                <span className="font-medium">{m._id}</span>
                                <span className="text-muted-foreground">
                                    ₹{m.totalVolume.toLocaleString("en-IN")} ({m.totalCount} txns)
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
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

function AdminTrendChart({ data }: any) {
    if (!data.length) {
        return <p className="text-sm text-muted-foreground">No trend data yet.</p>;
    }

    const max = Math.max(...data.map((d: any) => d.amount), 1);

    return (
        <div className="flex h-48 gap-2 items-end">
            {data.map((d: any) => (
                <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full bg-muted/50 rounded-md flex items-end justify-center">
                        <div
                            className="w-3 rounded-t-md bg-primary"
                            style={{ height: `${(d.amount / max) * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
                </div>
            ))}
        </div>
    );
}
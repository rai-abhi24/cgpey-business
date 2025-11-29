"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import HeaderSetter from "@/components/common/header-setter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

interface WebhookLog {
    _id: string;
    gateway: string;
    event: string;
    state?: string;
    processed: boolean;
    createdAt: string;
    retries: number;
    lastError?: string;
}

export default function WebhooksPage() {
    const queryClient = useQueryClient();
    const query = useQuery<{ success: boolean; data: WebhookLog[] }>({
        queryKey: ["webhooks"],
        queryFn: async () => {
            const res = await fetch("/api/merchant/webhooks", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load webhooks");
            return res.json();
        },
    });

    const replayMutation = useMutation({
        mutationFn: async (webhookId: string) => {
            const res = await fetch("/api/merchant/webhooks/replay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ webhookId }),
            });
            if (!res.ok) throw new Error("Replay failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["webhooks"] });
        },
    });

    const logs = query.data?.data || [];

    return (
        <div className="space-y-6">
            <HeaderSetter title="Webhook Logs" desc="Observe inbound callbacks and replay as needed" />

            <Card>
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Recent deliveries</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["webhooks"] })}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Gateway</TableHead>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Retries</TableHead>
                                    <TableHead>Last error</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {query.isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                                            Loading webhooks...
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                                            No webhooks captured.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log._id}>
                                            <TableCell className="font-medium">{log.gateway}</TableCell>
                                            <TableCell>{log.event}</TableCell>
                                            <TableCell>
                                                <Badge variant={log.processed ? "default" : "destructive"}>
                                                    {log.processed ? "Processed" : "Pending"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{log.retries}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                {log.lastError || "-"}
                                            </TableCell>
                                            <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => replayMutation.mutate(log._id)}
                                                    disabled={replayMutation.isPending}
                                                >
                                                    Replay
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

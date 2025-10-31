"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    XCircle,
    RefreshCcw,
    RotateCcw,
    AlertCircle,
    Navigation,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    initiateRefund,
    checkRefundStatus,
    verifyPaymentStatus,
} from "@/lib/services/payment";
import { toast } from "sonner";
import Lottie from "lottie-react";
import successAnimation from "../../../../../../public/lotties/success.json";
import failedAnimation from "../../../../../../public/lotties/failed.json";
import PaymentDetails from "./PaymentDetails";
import RefundSection from "./RefundSection";

const SUCCESS_STATES = ["COMPLETED", "SUCCESS"];
const TERMINAL_REFUND_STATES = ["COMPLETED", "FAILED", "SUCCESS", "FAILED"];

const isSuccessful = (state?: string) =>
    state && SUCCESS_STATES.includes(state.toUpperCase());

export interface RefundData {
    refundId: string;
    amount: number;
    status: string;
    state: string;
    initiatedAt: string;
    completedAt: string | null;
}

export interface PaymentData {
    paymentId: string;
    merchantOrderId: string;
    merchantId: string;
    gateway: string;
    gatewayTxnId: string;
    amount: number;
    currency: string;
    state: string;
    checkoutType: string;
    paymentInitiatedAt: string;
    completedAt: string | null;
    utr: string | null;
    refund: RefundData | null;
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse {
    data: {
        success: boolean;
        data: {
            payment: PaymentData;
            state: string;
        };
    };
}

export default function PaymentResultClient() {
    const params = useSearchParams();
    const orderId = params.get("orderId") ?? "ORD-DEMO";
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const {
        data: paymentData,
        isLoading,
        refetch: refetchPayment,
        isFetching,
        error: paymentError,
    } = useQuery<PaymentData>({
        queryKey: ["payment", orderId],
        queryFn: async (): Promise<PaymentData> => {
            const res: ApiResponse = await verifyPaymentStatus({
                orderId,
                gateway: "phonepe",
            });
            return res.data.data.payment;
        },
        enabled: !!orderId,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data?.refund && !TERMINAL_REFUND_STATES.includes(data.refund.state)) {
                return 3000; // Poll every 3s for active refunds
            }
            return false;
        },
    });

    const payment = paymentData;

    // 🔁 Refund initiation
    const refundMutation = useMutation({
        mutationFn: async () => {
            if (!payment) throw new Error("Payment not found");

            const refundId = `refund_${orderId}_${Date.now()}`;
            const res = await initiateRefund({
                orderId,
                gateway: payment.gateway,
                amount: payment.amount,
                refundId,
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Refund initiated successfully");
            refetchPayment();
        },
        onError: (err: any) => {
            const message =
                err?.response?.data?.message || err?.message || "Refund failed";
            toast.error(message);
        },
    });

    // 🔁 Manual refund status check
    const manualRefundCheck = useMutation({
        mutationFn: async () => {
            if (!payment?.refund?.refundId) throw new Error("No refund ID found");
            const res = await checkRefundStatus({
                refundId: payment.refund.refundId,
                gateway: payment.gateway,
            });
            return res.data;
        },
        onSuccess: (data) => {
            toast.success("Refund status updated");
            console.log("Refund Status:", data);
            refetchPayment();
        },
        onError: (err: any) => {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to check refund status";
            toast.error(message);
        },
    });

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success("Copied!");
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    const handleInitiateRefund = () => {
        if (!payment) return;

        if (!isSuccessful(payment.state)) {
            toast.error("Only completed payments can be refunded");
            return;
        }

        if (payment.refund) {
            toast.error("Refund already exists for this payment");
            return;
        }

        const confirmed = confirm(
            `Refund ${formatCurrency(
                payment.amount,
                payment.currency
            )}? This cannot be undone.`
        );

        if (confirmed) refundMutation.mutate();
    };

    const handleManualRefundCheck = () => {
        if (!payment?.refund) {
            toast.error("No refund found to check");
            return;
        }
        manualRefundCheck.mutate();
    };

    const formatDate = (dateString: string | null) =>
        dateString
            ? new Date(dateString).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            })
            : "N/A";

    const formatCurrency = (amount: number, currency = "INR") =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
        }).format(amount);

    const getBadgeVariant = (state: string) => {
        switch (state?.toUpperCase()) {
            case "COMPLETED":
            case "SUCCESS":
                return "success";
            case "FAILED":
                return "destructive";
            case "PENDING":
            case "PROCESSING":
                return "secondary";
            case "CANCELLED":
            case "EXPIRED":
                return "outline";
            default:
                return "secondary";
        }
    };

    const getStatusIcon = (state: string) => {
        switch (state?.toUpperCase()) {
            case "COMPLETED":
            case "SUCCESS":
                return (
                    <div className="w-20 mb-4">
                        <Lottie animationData={successAnimation} loop={false} />
                    </div>
                );
            case "FAILED":
                return (
                    <div className="w-80 mb-4">
                        <Lottie animationData={failedAnimation} loop={false} />
                    </div>
                );
            case "PENDING":
            case "PROCESSING":
                return <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />;
            default:
                return <AlertCircle className="h-8 w-8 text-gray-500" />;
        }
    };

    const getRefundMessage = (refundState: string) => {
        const messages: Record<string, string> = {
            PENDING: "Refund is being processed",
            PROCESSING: "Refund is in progress",
            COMPLETED: "Refund completed successfully ✅",
            SUCCESS: "Refund completed successfully ✅",
            FAILED: "Refund failed ❌",
        };
        return messages[refundState] || `Refund ${refundState}`;
    };

    /* -----------------------------------------------------------------------
       Rendering
    ------------------------------------------------------------------------ */
    if (!orderId) {
        return (
            <div className="flex justify-center items-center min-h-[70vh] px-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <CardTitle className="text-xl mb-4">No Order ID Found</CardTitle>
                    <p className="text-gray-600 mb-6">
                        Please check your order reference and try again.
                    </p>
                    <Button onClick={() => (window.location.href = "/")}>Go to Home</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
            <div className="container mx-auto space-y-6">
                <Card className="shadow-lg border-0">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-bold text-center text-gray-800">
                            Payment Details
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6 overflow-x-scroll">
                        {/* Status Section */}
                        <div className="text-center space-y-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center space-y-3 py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    <p className="text-gray-600">Loading payment details...</p>
                                </div>
                            ) : paymentError ? (
                                <div className="flex flex-col items-center space-y-3 py-8 text-red-500">
                                    <XCircle className="h-8 w-8" />
                                    <p className="font-medium">Failed to load payment details</p>
                                    <Button variant="outline" onClick={() => refetchPayment()}>
                                        Try Again
                                    </Button>
                                </div>
                            ) : payment ? (
                                <>
                                    <div className="flex flex-col items-center space-y-3">
                                        {getStatusIcon(payment.state)}
                                        <Badge
                                            variant={getBadgeVariant(payment.state) as any}
                                            className="text-sm font-semibold px-3 py-1"
                                        >
                                            {payment.state}
                                        </Badge>
                                        <div className="text-3xl font-bold text-gray-900">
                                            {formatCurrency(payment.amount, payment.currency)}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Order ID: {payment.merchantOrderId}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-center gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => refetchPayment()}
                                            disabled={isFetching}
                                            className="flex items-center gap-2"
                                        >
                                            <RefreshCcw className="h-4 w-4" />
                                            {isFetching ? "Refreshing..." : "Refresh"}
                                        </Button>

                                        {isSuccessful(payment.state) && !payment.refund && (
                                            <Button
                                                variant="destructive"
                                                disabled={refundMutation.isPending}
                                                onClick={handleInitiateRefund}
                                                className="flex items-center gap-2 text-white"
                                            >
                                                {refundMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RotateCcw className="h-4 w-4" />
                                                        Refund
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Payment Details Section */}
                        {payment && (
                            <PaymentDetails
                                payment={payment}
                                copiedField={copiedField}
                                onCopy={copyToClipboard}
                                formatDate={formatDate}
                            />
                        )}

                        {/* Refund Section */}
                        {payment?.refund && (
                            <RefundSection
                                refund={payment.refund}
                                refundMessage={getRefundMessage(payment.refund.state)}
                                currency={payment.currency}
                                copiedField={copiedField}
                                onCopy={copyToClipboard}
                                onCheckStatus={handleManualRefundCheck}
                                isChecking={manualRefundCheck.isPending}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                                getBadgeVariant={getBadgeVariant}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

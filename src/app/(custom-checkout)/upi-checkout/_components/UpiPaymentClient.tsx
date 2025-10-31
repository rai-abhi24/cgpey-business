"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPaymentStatus } from "@/lib/services/payment";
import successAnimation from "../../../../../public/lotties/success.json";
import failedAnimation from "../../../../../public/lotties/failed.json";
import { toast } from "sonner";
import Lottie from "lottie-react";

const POLL_INTERVAL = 3000;
const REDIRECT_DELAY = 1500;

const UpiPaymentClient = () => {
    const params = useSearchParams();
    const router = useRouter();

    const orderId = params.get("orderId") || "ORD-DEMO-1234";
    const amount = params.get("amount") || "0.00";
    const merchantName = params.get("merchantName") || "CGPEY";
    const expiresIn = parseInt(params.get("expiresIn") || "120", 10);

    const displayAmount = `₹${amount}`;
    const [timeLeft, setTimeLeft] = useState(expiresIn);
    const [paymentStatus, setPaymentStatus] = useState<
        "pending" | "success" | "failed" | "expired"
    >("pending");

    const verifyPaymentMutation = useMutation({
        mutationFn: (body: { orderId: string; gateway: string }) =>
            verifyPaymentStatus(body),
        onSuccess: (res: any) => {
            const state = res?.data?.data?.state;
            if (state === "COMPLETED") {
                setPaymentStatus("success");
            } else if (state === "FAILED") {
                setPaymentStatus("failed");
            }
            // If state is neither COMPLETED nor FAILED, continue polling
        },
        onError: (error: any) => {
            console.error("Payment verification error:", error);
            // Don't set payment status to failed on API errors, just log and continue polling
            toast.error(error?.message || "Failed to verify payment");
        },
    });

    // Timer effect
    useEffect(() => {
        if (paymentStatus !== "pending") return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setPaymentStatus("expired");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [paymentStatus]);

    // Polling effect
    useEffect(() => {
        if (paymentStatus !== "pending" || !orderId) return;

        // const pollInterval: NodeJS.Timeout;
        let isMounted = true;

        const pollForPaymentStatus = async () => {
            if (!isMounted) return;

            try {
                await verifyPaymentMutation.mutateAsync({
                    orderId,
                    gateway: "phonepe",
                });
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        // Poll immediately first time
        pollForPaymentStatus();

        // Then set up interval
        const pollInterval = setInterval(pollForPaymentStatus, POLL_INTERVAL);

        return () => {
            isMounted = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [paymentStatus, orderId]);

    // Redirect effect
    useEffect(() => {
        if (!["success", "failed", "expired"].includes(paymentStatus)) return;

        const timeout = setTimeout(() => {
            router.replace(
                `/payment/result?orderId=${encodeURIComponent(orderId)}`
            );
        }, REDIRECT_DELAY);

        return () => clearTimeout(timeout);
    }, [paymentStatus, router, orderId, amount]);

    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    }, []);

    const getProgressPercentage = useCallback(() => {
        return Math.min(((expiresIn - timeLeft) / expiresIn) * 100, 100);
    }, [expiresIn, timeLeft]);

    if (paymentStatus === "success") {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-10 text-center">
                <div className="w-40 mb-4">
                    <Lottie animationData={successAnimation} loop={false} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Payment Successful!
                </h2>
                <p className="text-gray-600 mb-6">
                    Your payment of {displayAmount} has been received.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6 w-full max-w-sm">
                    <div className="text-sm text-gray-600 mb-1">Order ID</div>
                    <div className="font-semibold text-gray-900">{orderId}</div>
                </div>
            </div>
        );
    }

    if (paymentStatus === "failed" || paymentStatus === "expired") {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-10 text-center">
                <div className="w-80 mb-4">
                    <Lottie animationData={failedAnimation} loop={false} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Payment {paymentStatus === "failed" ? "Failed" : "Expired"}
                </h2>
                <p className="text-gray-600 mb-6">
                    {paymentStatus === "expired"
                        ? "The payment time limit has passed."
                        : "Your payment could not be completed."}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-10 text-center">
            <h2 className="text-3xl font-bold mb-6">Pay {displayAmount}</h2>

            {/* Progress bar */}
            <div className="w-full max-w-sm mb-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-linear"
                        style={{ width: `${getProgressPercentage()}%` }}
                    />
                </div>
            </div>

            <p className="text-gray-600 text-sm mb-1">This page will expire in</p>
            <p className="text-green-600 font-semibold text-lg mb-8">
                {formatTime(timeLeft)}
            </p>

            <div className="space-y-3 text-left max-w-sm mx-auto">
                <Step number={1} text="Go to your UPI App." />
                <Step
                    number={2}
                    text={`Select the payment request from ${merchantName}.`}
                />
                <Step
                    number={3}
                    text="Enter your UPI PIN and complete the payment."
                />
            </div>
        </div>
    );
};

const Step = ({ number, text }: { number: number; text: string }) => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-700">
            {number}
        </div>
        <div className="pt-0.5">
            <p className="text-gray-900 text-sm font-medium">{text}</p>
        </div>
    </div>
);

export default UpiPaymentClient;
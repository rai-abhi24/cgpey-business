"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { ChevronRight, IndianRupee, LockKeyhole, ShieldCheck, Tag, Loader2, AlertCircle, Clock } from "lucide-react";
import { TiBusinessCard } from "react-icons/ti";
import { CiCreditCard1 } from "react-icons/ci";
import { BsBank2 } from "react-icons/bs";
import UpiForm from "./_components/UpiForm";
import CardForm from "./_components/CardForm";
import NetBankingForm from "./_components/NetBankingForm";
import { useMutation } from '@tanstack/react-query';
import { initiatePayment, verifyPaymentStatus, fetchPaymentDetails } from '@/lib/services/payment';
import { toast } from 'sonner';
import { AxiosResponse } from "axios";
import useDeviceDetector from "@/hooks/use-device-detector";

export const paymentMethods = [
    {
        id: 0,
        name: "UPI",
        icon: <TiBusinessCard className="text-xl" />,
        desc: "Pay by any UPI app",
        badge: "Fastest",
        badgeColor: "bg-green-100 text-green-700",
    },
    {
        id: 1,
        name: "Credit / Debit Card",
        icon: <CiCreditCard1 className="text-xl" />,
        desc: "Add and secure cards as per RBI guidelines",
    },
    {
        id: 2,
        name: "Net Banking",
        icon: <BsBank2 className="text-xl" />,
        desc: "Pay via your bank account",
    },
];

interface PaymentData {
    paymentId: string;
    merchantOrderId: string;
    amount: number;
    currency: string;
    state: string;
    expiredAt: string;
    merchantDetails: {
        name: string;
        logo?: string;
        website?: string;
    };
    customer?: {
        name?: string;
        email?: string;
        phone?: string;
    };
}

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();

    const paymentId = params?.paymentId as string;

    // Payment data from backend
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    console.log(paymentData);

    // UI states
    const [paymentMode, setPaymentMode] = useState("");
    const [selectedMethod, setSelectedMethod] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // UPI Intent specific states
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [paymentInitiated, setPaymentInitiated] = useState(false);

    const { isMobile, deviceOS } = useDeviceDetector();

    // Fetch payment details on mount
    useEffect(() => {
        const loadPaymentDetails = async () => {
            if (!paymentId) {
                toast.error("Invalid payment link");
                router.push("/");
                return;
            }

            try {
                setIsLoading(true);
                const response = await fetchPaymentDetails(paymentId);
                const data = response.data?.data;

                if (!data) {
                    throw new Error("Payment not found");
                }

                // Check if payment is already completed
                if (["SUCCESS", "FAILED", "CANCELLED"].includes(data.state)) {
                    toast.info("This payment has already been processed");
                    router.push(`/payment/result?paymentId=${paymentId}&status=${data.state}`);
                    return;
                }

                // Check if payment is expired
                const expiryTime = new Date(data.expiredAt).getTime();
                const now = Date.now();

                if (now >= expiryTime) {
                    setIsExpired(true);
                    toast.error("Payment link has expired");
                } else {
                    setTimeLeft(Math.floor((expiryTime - now) / 1000));
                }

                setPaymentData(data);
            } catch (error: any) {
                console.error("Error fetching payment details:", error);
                toast.error(error?.response?.data?.message || "Failed to load payment details");

                // Redirect to error page after 2 seconds
                setTimeout(() => {
                    router.push("/");
                }, 2000);
            } finally {
                setIsLoading(false);
            }
        };

        loadPaymentDetails();
    }, [paymentId, router]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsExpired(true);
                    toast.error("Payment link has expired");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Format time left
    const formatTimeLeft = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Check for pending UPI intent payments on component mount
    useEffect(() => {
        const checkPendingPayment = async () => {
            const storedPaymentId = localStorage.getItem("pendingPaymentId");
            const storedPaymentMode = localStorage.getItem("paymentMode");

            if (storedPaymentId === paymentId && storedPaymentMode === "UPI_INTENT") {
                setPaymentInitiated(true);
                setIsCheckingStatus(true);

                // Start polling for payment status
                await pollPaymentStatus();
            }
        };

        if (paymentData && !isExpired) {
            checkPendingPayment();
        }
    }, [paymentData, isExpired]);

    // Poll payment status for UPI intent
    const pollPaymentStatus = async (maxAttempts: number = 6) => {
        let attempts = 0;
        const pollInterval = 3000; // 3 seconds

        const poll = async () => {
            try {
                attempts++;
                const response = await verifyPaymentStatus({
                    paymentId: paymentId,
                    gateway: "phonepe"
                });

                const state = response.data?.state || response.data?.data?.state || "PENDING";

                // Terminal states
                if (["SUCCESS", "FAILED", "CANCELLED", "EXPIRED"].includes(state)) {
                    // Clear pending payment
                    localStorage.removeItem("pendingPaymentId");
                    localStorage.removeItem("paymentMode");

                    setIsCheckingStatus(false);
                    setPaymentInitiated(false);

                    // Redirect to result page
                    const status = state === "SUCCESS" ? "success" : "failed";
                    router.push(`/payment/result?paymentId=${paymentId}&status=${status}`);
                    return;
                }

                // Continue polling if not terminal state and attempts remaining
                if (attempts < maxAttempts) {
                    setTimeout(poll, pollInterval);
                } else {
                    // Max attempts reached
                    setIsCheckingStatus(false);
                    toast.warning("Payment status is still pending. Please check status manually.");
                }
            } catch (error) {
                console.error("Error polling payment status:", error);
                if (attempts < maxAttempts) {
                    setTimeout(poll, pollInterval);
                } else {
                    setIsCheckingStatus(false);
                    toast.error("Unable to verify payment status. Please check manually.");
                }
            }
        };

        await poll();
    };

    const initiatePaymentMutation = useMutation({
        mutationFn: (body: any) => initiatePayment(body),
        onSuccess: (res: AxiosResponse) => {
            const data = res.data;
            setIsProcessing(false);

            if (selectedMethod === 0 && paymentMode === "UPI_COLLECT") {
                router.push(`/upi-checkout?paymentId=${paymentId}&merchantName=${paymentData?.merchantDetails.name}&expiresIn=${timeLeft}`);
            } else if (selectedMethod === 0 && paymentMode === "UPI_INTENT") {
                const intentUrl = data?.data?.intentUrl;

                if (intentUrl && isMobile) {
                    // Store pending payment info
                    localStorage.setItem("pendingPaymentId", paymentId);
                    localStorage.setItem("paymentMode", "UPI_INTENT");

                    setIsProcessing(false);
                    setPaymentInitiated(true);

                    // Open UPI app
                    window.location.href = intentUrl;

                    // Start checking status after a delay
                    setTimeout(() => {
                        if (localStorage.getItem("pendingPaymentId") === paymentId) {
                            setIsCheckingStatus(true);
                            pollPaymentStatus();
                        }
                    }, 5000);
                } else {
                    toast.error("Failed to get UPI intent URL");
                }
            } else {
                // For card/netbanking, redirect to PG
                router.push(data?.data?.redirectUrl);
            }
        },
        onError: (err: any) => {
            setIsProcessing(false);
            setPaymentInitiated(false);
            toast.error(err?.response?.data?.message || 'Payment failed');
        },
    });

    const handlePayment = (paymentDetails: any) => {
        if (isExpired) {
            toast.error("Payment link has expired");
            return;
        }

        setIsProcessing(true);
        setPaymentMode(paymentDetails.paymentMode);

        const body = {
            ...paymentDetails,
            gateway: "phonepe",
            paymentId: paymentId,
        };

        // For non-UPI methods, add redirect URL
        if (!["UPI_INTENT", "UPI_COLLECT"].includes(paymentDetails.paymentMode)) {
            body.redirectUrl = `${window.location.origin}/payment/result?paymentId=${paymentId}`;
        }

        initiatePaymentMutation.mutate(body);
    };

    const handleCheckStatus = async () => {
        if (paymentId) {
            setIsCheckingStatus(true);
            await pollPaymentStatus(3);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading payment details...</p>
                </div>
            </div>
        );
    }

    // Payment not found or error
    if (!paymentData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
                    <p className="text-gray-600">This payment link is invalid or has been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header with Merchant & CGPEY Branding */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left: Merchant Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                                <span className="text-2xl font-bold">
                                    {paymentData.merchantDetails.name.charAt(0)}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">{paymentData.merchantDetails.name}</h1>
                                <p className="text-xs text-blue-100">Secure Checkout</p>
                            </div>
                        </div>

                        {/* Right: CGPEY Branding */}
                        <div className="hidden sm:flex flex-col text-right">
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-xs text-blue-100">Powered by</span>
                                <span className="text-xl font-bold tracking-tight">CGPEY</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-blue-100 justify-end mt-0.5">
                                <ShieldCheck className="h-3 w-3" />
                                <span>Secure Payment Gateway</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expiry Timer */}
                {!isExpired && timeLeft > 0 && (
                    <div className="bg-blue-800/30 border-t border-blue-500/20">
                        <div className="max-w-7xl mx-auto px-4 py-2">
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>This payment link expires in: <strong>{formatTimeLeft(timeLeft)}</strong></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 flex-1">
                {/* Expired Overlay */}
                {isExpired && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Link Expired</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                This payment link has expired. Please request a new payment link from the merchant.
                            </p>
                            <button
                                onClick={() => router.push("/")}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                )}

                {/* Payment Status Overlay */}
                {(isCheckingStatus || paymentInitiated) && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {paymentInitiated && !isCheckingStatus
                                    ? "Complete Payment in UPI App"
                                    : "Checking Payment Status"}
                            </h3>
                            <p className="text-gray-600 text-sm mb-6">
                                {paymentInitiated && !isCheckingStatus
                                    ? "Please complete the payment in your UPI app and return here."
                                    : "Please wait while we verify your payment..."}
                            </p>

                            {paymentInitiated && !isCheckingStatus && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Tip:</strong> After completing payment, this page will automatically check the status.
                                    </p>
                                </div>
                            )}

                            {isCheckingStatus && (
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                    </div>
                                    <span>Verifying with payment gateway</span>
                                </div>
                            )}

                            {paymentInitiated && (
                                <button
                                    onClick={() => {
                                        setPaymentInitiated(false);
                                        setIsCheckingStatus(true);
                                        handleCheckStatus();
                                    }}
                                    className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                                >
                                    I&apos;ve Completed Payment
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Payment Methods Section */}
                    <div className="lg:col-span-8">
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col lg:flex-row">
                                    {/* Mobile: Accordion Style */}
                                    <div className="lg:hidden">
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                            <h2 className="text-sm font-semibold text-gray-900">Select Payment Method</h2>
                                        </div>

                                        {paymentMethods.map((method) => (
                                            <div key={method.id} className="border-b border-gray-100 last:border-b-0">
                                                <button
                                                    className={`w-full p-4 flex items-center justify-between ${selectedMethod === method.id ? "bg-blue-50" : "bg-white"
                                                        }`}
                                                    onClick={() => setSelectedMethod(selectedMethod === method.id ? -1 : method.id)}
                                                    disabled={isExpired}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedMethod === method.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                                                            }`}>
                                                            {method.icon}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-sm">{method.name}</p>
                                                                {method.badge && (
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${method.badgeColor}`}>
                                                                        {method.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500">{method.desc}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`h-5 w-5 transition-transform ${selectedMethod === method.id ? "rotate-90" : ""
                                                        }`} />
                                                </button>

                                                {selectedMethod === method.id && (
                                                    <div className="p-4 bg-gray-50 border-t">
                                                        {selectedMethod === 0 && (
                                                            <UpiForm
                                                                amount={paymentData.amount}
                                                                onSubmit={handlePayment}
                                                                isProcessing={isProcessing}
                                                                isMobile={isMobile}
                                                                deviceOS={deviceOS}
                                                            />
                                                        )}
                                                        {selectedMethod === 1 && (
                                                            <CardForm
                                                                amount={paymentData.amount}
                                                                onSubmit={handlePayment}
                                                                isProcessing={isProcessing}
                                                            />
                                                        )}
                                                        {selectedMethod === 2 && (
                                                            <NetBankingForm
                                                                amount={paymentData.amount}
                                                                onSubmit={handlePayment}
                                                                isProcessing={isProcessing}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop: Side-by-side */}
                                    <div className="hidden lg:flex w-full">
                                        <div className="w-2/5 bg-gray-50 border-r">
                                            <div className="p-4 border-b bg-white">
                                                <h2 className="text-sm font-semibold">Payment Methods</h2>
                                            </div>
                                            {paymentMethods.map((method) => (
                                                <button
                                                    key={method.id}
                                                    className={`w-full p-4 border-b flex items-start gap-3 ${selectedMethod === method.id
                                                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                                                        : "bg-white hover:bg-gray-50 border-l-4 border-l-transparent"
                                                        }`}
                                                    onClick={() => setSelectedMethod(method.id)}
                                                    disabled={isExpired}
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedMethod === method.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                                                        }`}>
                                                        {method.icon}
                                                    </div>
                                                    <div className="text-left flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-sm">{method.name}</p>
                                                            {method.badge && (
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${method.badgeColor}`}>
                                                                    {method.badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">{method.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="w-3/5 p-6 bg-white">
                                            {selectedMethod === 0 && (
                                                <UpiForm
                                                    amount={paymentData.amount}
                                                    onSubmit={handlePayment}
                                                    isProcessing={isProcessing}
                                                    isMobile={isMobile}
                                                    deviceOS={deviceOS}
                                                />
                                            )}
                                            {selectedMethod === 1 && (
                                                <CardForm
                                                    amount={paymentData.amount}
                                                    onSubmit={handlePayment}
                                                    isProcessing={isProcessing}
                                                />
                                            )}
                                            {selectedMethod === 2 && (
                                                <NetBankingForm
                                                    amount={paymentData.amount}
                                                    onSubmit={handlePayment}
                                                    isProcessing={isProcessing}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-4 space-y-4">
                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Tag className="h-4 w-4" /> Order Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Order ID</span>
                                    <span className="font-mono font-semibold uppercase">{paymentData.merchantOrderId}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Payment ID</span>
                                    <span className="font-mono text-xs uppercase">{paymentData.paymentId}</span>
                                </div>
                                <hr />
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total Amount</span>
                                    <span className="flex items-center gap-1 text-blue-600">
                                        <IndianRupee className="h-5 w-5" />
                                        {paymentData.amount}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Info (if available) */}
                        {paymentData.customer && (paymentData.customer.name || paymentData.customer.email) && (
                            <Card>
                                <CardHeader className="py-4">
                                    <CardTitle className="text-base">Customer Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {paymentData.customer.name && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Name</span>
                                            <span className="font-medium">{paymentData.customer.name}</span>
                                        </div>
                                    )}
                                    {paymentData.customer.email && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Email</span>
                                            <span className="font-medium text-xs">{paymentData.customer.email}</span>
                                        </div>
                                    )}
                                    {paymentData.customer.phone && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phone</span>
                                            <span className="font-medium">{paymentData.customer.phone}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Security Badge */}
                        {/* <Card>
                            <CardContent className="py-4 text-sm space-y-3">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <ShieldCheck className="h-5 w-5 text-green-600" />
                                    <span className="text-xs sm:text-sm font-semibold">PCI DSS Compliant</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <LockKeyhole className="h-5 w-5 text-green-600" />
                                    <span className="text-xs sm:text-sm font-semibold">256-bit SSL Encryption</span>
                                </div>
                                <div className="text-xs text-gray-500 pt-2 border-t">
                                    Your payment information is encrypted and secure. We never store your card details.
                                </div>
                            </CardContent>
                        </Card> */}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 border-t mt-12">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="text-center text-sm text-gray-600">
                        <p>© {new Date().getFullYear()} CGPEY. All rights reserved.</p>
                        <p className="mt-1 text-xs">Powered by <strong>CGPEY International Private Limited</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
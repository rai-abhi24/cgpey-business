"use client"

import HeaderSetter from "@/components/common/header-setter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { ChevronRight, IndianRupee, LockKeyhole, ShieldCheck, Tag, Loader2 } from "lucide-react";

import { TiBusinessCard } from "react-icons/ti";
import { CiCreditCard1 } from "react-icons/ci";
import { BsBank2 } from "react-icons/bs";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";
import UpiForm from "./_components/UpiForm";
import CardForm from "./_components/CardForm";
import CODInfo from "./_components/CODInfo";
import NetBankingForm from "./_components/NetBankingForm";
import { useMutation } from '@tanstack/react-query';
import { initiatePayment, verifyPaymentStatus } from '@/lib/services/payment';
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
    {
        id: 3,
        name: "Cash on Delivery",
        icon: <RiMoneyRupeeCircleFill className="text-xl" />,
        desc: "Pay when you receive",
        badge: "₹50 extra",
        badgeColor: "bg-orange-100 text-orange-700",
    },
];

export default function CheckoutPage() {
    const params = useSearchParams();
    const router = useRouter();

    const [paymentMode, setPaymentMode] = useState("");
    const [selectedMethod, setSelectedMethod] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // UPI Intent specific states
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [paymentInitiated, setPaymentInitiated] = useState(false);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

    const orderId = params.get("orderId") ?? "ORD-DEMO";
    const amount = Number(params.get("amount") ?? 0);
    const fee = Number(params.get("fee") ?? 0);
    const total = amount + fee;
    const items = Number(params.get("items") ?? 1);
    const { isMobile, deviceOS } = useDeviceDetector();

    // Check for pending UPI intent payments on component mount
    useEffect(() => {
        const checkPendingPayment = async () => {
            const storedOrderId = localStorage.getItem("pendingOrderId");
            const storedPaymentMode = localStorage.getItem("paymentMode");

            if (storedOrderId && storedPaymentMode === "UPI_INTENT") {
                setPendingOrderId(storedOrderId);
                setPaymentInitiated(true);
                setIsCheckingStatus(true);

                // Start polling for payment status
                await pollPaymentStatus(storedOrderId);
            }
        };

        checkPendingPayment();
    }, []);

    // Poll payment status for UPI intent
    const pollPaymentStatus = async (orderId: string, maxAttempts: number = 6) => {
        let attempts = 0;
        const pollInterval = 3000; // 3 seconds

        const poll = async () => {
            try {
                attempts++;
                const response = await verifyPaymentStatus({ orderId, gateway: "phonepe" });
                const state = response.data?.state || response.data?.data?.state || "PENDING";

                // Terminal states
                if (["SUCCESS", "COMPLETED", "FAILED", "CANCELLED", "EXPIRED"].includes(state)) {
                    // Clear pending payment
                    localStorage.removeItem("pendingOrderId");
                    localStorage.removeItem("paymentMode");

                    setIsCheckingStatus(false);
                    setPaymentInitiated(false);
                    setPendingOrderId(null);

                    // Redirect to result page
                    router.push(`/payment/result?orderId=${orderId}&amount=${amount}&status=${state === "SUCCESS" || state === "COMPLETED" ? "success" : "failed"
                        }`);
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
                router.push(`/upi-checkout?orderId=${orderId}&amount=${amount}&merchantName=${"CGPEY"}&expiresIn=${120}`);
            } else if (selectedMethod === 0 && paymentMode === "UPI_INTENT") {
                const intentUrl = data?.data?.intentUrl;

                if (intentUrl && isMobile) {
                    // Store pending payment info
                    localStorage.setItem("pendingOrderId", orderId);
                    localStorage.setItem("paymentMode", "UPI_INTENT");

                    setIsProcessing(false);
                    setPaymentInitiated(true);
                    setPendingOrderId(orderId);

                    // Open UPI app
                    window.location.href = intentUrl;

                    // Start checking status after a delay
                    setTimeout(() => {
                        if (localStorage.getItem("pendingOrderId") === orderId) {
                            setIsCheckingStatus(true);
                            pollPaymentStatus(orderId);
                        }
                    }, 5000);
                } else {
                    toast.error("Failed to get UPI intent URL");
                }
            } else {
                router.push(data?.data?.redirectUrl);
            }
        },
        onError: (err: any) => {
            setIsProcessing(false);
            setPaymentInitiated(false);
            setPendingOrderId(null);
            toast.error(err?.message || 'Payment failed');
        },
    });

    const handlePayment = (paymentDetails: any) => {
        setIsProcessing(true);
        setPaymentMode(paymentDetails.paymentMode);

        const body = {
            ...paymentDetails,
            gateway: "phonepe",
            orderId: orderId,
            amount: total,
        };

        if (paymentDetails.paymentMode === "COD") {
            setTimeout(() => {
                setIsProcessing(false);
                router.push(`/payment/result?orderId=${orderId}&amount=${amount}&status=${"success"}`);
            }, 500);
            return;
        }

        if (!["UPI_INTENT", "UPI_COLLECT"].includes(paymentDetails.paymentMode)) {
            body.redirectUrl = `${window.location.origin}/payment/result?orderId=${orderId}`;
        }

        initiatePaymentMutation.mutate(body);
    };

    const handleCheckStatus = async () => {
        const currentOrderId = pendingOrderId || orderId;
        if (currentOrderId) {
            setIsCheckingStatus(true);
            await pollPaymentStatus(currentOrderId, 3);
        }
    };

    return (
        <div className="space-y-6">
            <HeaderSetter title="Complete Your Purchase" desc={`Order #${orderId}`} />

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
                                    <div
                                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                        style={{ animationDelay: "0ms" }}
                                    ></div>
                                    <div
                                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                        style={{ animationDelay: "150ms" }}
                                    ></div>
                                    <div
                                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                        style={{ animationDelay: "300ms" }}
                                    ></div>
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

            <Card className="hidden sm:block">
                <CardContent className="flex flex-row items-center justify-between px-6 py-4">
                    <div className="space-y-1">
                        <CardTitle>Choose payment method</CardTitle>
                        <CardDescription>Select how you want to pay</CardDescription>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 sm:px-4 py-2 rounded-full border border-green-100">
                        <div className="flex items-center gap-2 text-green-700">
                            <LockKeyhole className="h-3.5 w-3.5" strokeWidth="2.5" />
                            <span className="text-xs font-semibold">
                                100% Secure Payment
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-4">
                    <Card>
                        <CardContent className="grid grid-cols-1 gap-4 p-0 m-0">
                            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-10 sm:mb-0">
                                {/* Payment Methods Section */}
                                <div className="flex-1">
                                    <div className="bg-white rounded-xl overflow-hidden">
                                        {/* Mobile: Accordion Style */}
                                        <div className="lg:hidden">
                                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                                <h2 className="text-sm font-semibold text-gray-900">
                                                    Select Payment Method
                                                </h2>
                                            </div>

                                            {paymentMethods.map((method) => (
                                                <div
                                                    key={method.id}
                                                    className="border-b border-gray-100 last:border-b-0"
                                                >
                                                    <button
                                                        className={`w-full p-4 flex items-center justify-between transition-colors ${selectedMethod === method.id
                                                            ? "bg-blue-50"
                                                            : "bg-white active:bg-gray-50"
                                                            }`}
                                                        onClick={() =>
                                                            setSelectedMethod(
                                                                selectedMethod === method.id ? -1 : method.id
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedMethod === method.id
                                                                    ? "bg-blue-100 text-blue-600"
                                                                    : "bg-gray-100 text-gray-600"
                                                                    }`}
                                                            >
                                                                {method.icon}
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-semibold text-sm text-gray-900">
                                                                        {method.name}
                                                                    </p>
                                                                    {method.badge && (
                                                                        <span
                                                                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${method.badgeColor}`}
                                                                        >
                                                                            {method.badge}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    {method.desc}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight
                                                            className={`h-5 w-5 text-gray-400 transition-transform ${selectedMethod === method.id ? "rotate-90" : ""
                                                                }`}
                                                        />
                                                    </button>

                                                    {selectedMethod === method.id && (
                                                        <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
                                                            {selectedMethod === 0 && (
                                                                <UpiForm
                                                                    amount={total}
                                                                    onSubmit={handlePayment}
                                                                    isProcessing={isProcessing}
                                                                    isMobile={isMobile}
                                                                    deviceOS={deviceOS}
                                                                />
                                                            )}
                                                            {selectedMethod === 1 && (
                                                                <CardForm
                                                                    amount={total}
                                                                    onSubmit={handlePayment}
                                                                    isProcessing={isProcessing}
                                                                />
                                                            )}
                                                            {selectedMethod === 2 && (
                                                                <NetBankingForm
                                                                    amount={total}
                                                                    onSubmit={handlePayment}
                                                                    isProcessing={isProcessing}
                                                                />
                                                            )}
                                                            {selectedMethod === 3 && (
                                                                <CODInfo
                                                                    amount={total}
                                                                    onSubmit={handlePayment}
                                                                    isProcessing={isProcessing}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop: Side-by-side Layout */}
                                        <div className="hidden lg:flex">
                                            {/* Payment Method Tabs */}
                                            <div className="w-2/5 bg-gradient-to-br from-gray-50 to-white border-r border-gray-200">
                                                <div className="p-4 border-b border-gray-200 bg-white">
                                                    <h2 className="text-sm font-semibold text-gray-900">
                                                        Payment Methods
                                                    </h2>
                                                </div>
                                                {paymentMethods.map((method) => (
                                                    <button
                                                        key={method.id}
                                                        className={`w-full p-4 border-b border-gray-100 last:border-b-0 flex items-start gap-3 transition-all ${selectedMethod === method.id
                                                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                                                            : "bg-white hover:bg-gray-50 border-l-4 border-l-transparent"
                                                            }`}
                                                        onClick={() => setSelectedMethod(method.id)}
                                                    >
                                                        <div
                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedMethod === method.id
                                                                ? "bg-blue-100 text-blue-600"
                                                                : "bg-gray-100 text-gray-600"
                                                                }`}
                                                        >
                                                            {method.icon}
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-semibold text-sm text-gray-900">
                                                                    {method.name}
                                                                </p>
                                                                {method.badge && (
                                                                    <span
                                                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${method.badgeColor}`}
                                                                    >
                                                                        {method.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {method.desc}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Payment Form Area */}
                                            <div className="w-3/5 p-6 bg-white">
                                                {selectedMethod === null ? (
                                                    <div className="h-full flex items-center justify-center text-center px-4">
                                                        <div>
                                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <CiCreditCard1 className="text-3xl text-gray-400" />
                                                            </div>
                                                            <p className="text-gray-500 text-sm">
                                                                Select a payment method to continue
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {selectedMethod === 0 && (
                                                            <UpiForm
                                                                amount={total}
                                                                onSubmit={handlePayment}
                                                                isProcessing={isProcessing}
                                                                isMobile={isMobile}
                                                                deviceOS={deviceOS}
                                                            />
                                                        )}
                                                        {selectedMethod === 1 && (
                                                            <CardForm
                                                                amount={total}
                                                                onSubmit={handlePayment}
                                                                isProcessing={isProcessing}
                                                            />
                                                        )}
                                                        {selectedMethod === 2 && (
                                                            <NetBankingForm
                                                                amount={total}
                                                                onSubmit={handlePayment}
                                                                isProcessing={isProcessing}
                                                            />
                                                        )}
                                                        {selectedMethod === 3 && (
                                                            <CODInfo
                                                                amount={total}
                                                                onSubmit={handlePayment}
                                                                isProcessing={isProcessing}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-4">
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5 text-primary mt-1" /> Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span>Price ({items} {items > 1 ? "items" : "item"})</span>
                                <span>₹{amount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>Platform Fee</span>
                                <span>₹{fee.toFixed(2)}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex items-center justify-between font-semibold">
                                <span className="text-primary">Total Amount</span>
                                <span className="flex items-center gap-1 text-primary font-bold"><IndianRupee className="h-4 w-4" />{total.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="py-4 text-sm text-gray-600 space-y-3">
                            <div className="flex items-center gap-2"><ShieldCheck className="h-[18px] w-[18px] text-green-600" /> Secure SSL encrypted payment</div>
                            <div className="flex items-center gap-2"><LockKeyhole className="h-[18px] w-[18px] text-green-600" /> Your data is protected</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
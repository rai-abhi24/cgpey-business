"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { KeyRound, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    // Send OTP Mutation
    const sendOtpMutation = useMutation({
        mutationFn: async () => {
            // const res = await fetch("/api/send-otp", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ phone }),
            // });

            // if (!res.ok) {
            //     const errorData = await res.json();
            //     throw new Error(errorData.message || "Failed to send OTP");
            // }

            // return res.json();
        },
        onSuccess: () => {
            toast.success("OTP sent successfully!");
            setStep("otp");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to send OTP");
        },
    });

    // Verify OTP Mutation
    const verifyOtpMutation = useMutation({
        mutationFn: async () => { },
        onSuccess: () => {
            toast.success("Login successful!");
            localStorage.setItem("token", "123");
            router.push("/");
        },
        onError: (error: any) => {
            toast.error(error.message || "Invalid OTP");
        },
    });

    const handlePhoneSubmit = () => {
        if (phoneNumber.length === 10) {
            sendOtpMutation.mutate();
        } else {
            toast.error("Please enter a valid 10-digit mobile number");
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleOtpSubmit = () => {
        const otpString = otp.join("");
        if (otpString.length === 6) {
            verifyOtpMutation.mutate();
        } else {
            toast.error("Please enter complete OTP");
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-between px-4 py-8">
                <motion.div className="w-full max-w-md space-y-8 flex-grow flex flex-col items-center justify-center"
                    initial={{ opacity: 0, y: -25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Login Card */}
                    <Card className="shadow w-full backdrop-blur-lg bg-white/90 border-0 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>

                        <CardHeader className="space-y-3 pt-8">
                            <div
                                className="mx-auto"
                            >
                                <Image
                                    src="/logo-with-name.svg"
                                    alt="CGPEY"
                                    width={160}
                                    height={160}
                                    priority
                                    className="drop-shadow-lg"
                                />
                            </div>
                            <CardTitle className="text-3xl text-center font-bold bg-primary bg-clip-text text-transparent">
                                {step === "phone" ? "Welcome Back" : "Verify OTP"}
                            </CardTitle>
                            <p className="text-sm text-gray-600 text-center">
                                {step === "phone"
                                    ? "Enter your mobile number to continue"
                                    : `We've sent a code to ${phoneNumber}`}
                            </p>
                        </CardHeader>

                        <CardContent className="pb-8">
                            <AnimatePresence mode="wait">
                                {step === "phone" ? (
                                    <motion.div
                                        key="mobile-form"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.4 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-3">
                                            <Label htmlFor="phone" className="text-gray-700 font-medium">
                                                Mobile Number
                                            </Label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                                    +91
                                                </div>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="Enter your mobile number"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                    disabled={sendOtpMutation.isPending}
                                                    className="pl-12 py-6 mt-1 text-md text-gray-600 shadow-none"
                                                    onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handlePhoneSubmit}
                                            className="w-full h-12 text-lg font-semibold bg-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                                            disabled={sendOtpMutation.isPending || phoneNumber.length !== 10}
                                        >
                                            {sendOtpMutation.isPending ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Sending OTP...
                                                </div>
                                            ) : (
                                                <>
                                                    Get OTP
                                                    <ArrowRight className="h-5 w-5 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="otp-form"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.4 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-4">
                                            <Label className="text-gray-700 font-medium text-center block">
                                                Enter 6-Digit OTP
                                            </Label>
                                            <div className="flex gap-2 justify-center">
                                                {otp.map((digit, index) => (
                                                    <Input
                                                        key={index}
                                                        id={`otp-${index}`}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            handleOtpKeyDown(index, e);
                                                            if (e.key === "Enter") handleOtpSubmit();
                                                        }}
                                                        disabled={verifyOtpMutation.isPending}
                                                        className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 focus:border-primary transition-all"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => sendOtpMutation.mutate()}
                                                disabled={sendOtpMutation.isPending}
                                                className="text-sm text-primary font-medium hover:underline transition-colors"
                                            >
                                                Resend OTP
                                            </button>
                                        </div>

                                        <Button
                                            onClick={handleOtpSubmit}
                                            className="w-full h-12 text-lg font-semibold bg-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                                            disabled={verifyOtpMutation.isPending || otp.some(d => !d)}
                                        >
                                            {verifyOtpMutation.isPending ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Verifying...
                                                </div>
                                            ) : (
                                                <>
                                                    <KeyRound className="h-5 w-5 mr-2" />
                                                    Verify & Login
                                                </>
                                            )}
                                        </Button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep("phone");
                                                setOtp(["", "", "", "", "", ""]);
                                            }}
                                            className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                        >
                                            ← Change mobile number
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="text-sm text-gray-600">
                    © {new Date().getFullYear()} CGPEY. All rights reserved.
                </div>
            </div>
        </div>
    );
}
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPassword, validateResetLink } from "@/lib/services/auth";

function validatePassword(pw: string) {
    const min = pw.length >= 8;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNum = /\d/.test(pw);
    const hasSym = /[^A-Za-z0-9]/.test(pw);
    return min && hasUpper && hasLower && hasNum && hasSym;
}

function ResetPasswordPage() {
    const params = useSearchParams();
    const router = useRouter();

    const emailParam = params.get("email");
    const tokenParam = params.get("token");

    const [validated, setValidated] = useState<null | boolean>(null);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        let mounted = true;
        async function validate() {
            if (!emailParam || !tokenParam) {
                setValidated(false);
                return;
            }

            try {
                const data = await validateResetLink(emailParam, tokenParam);
                console.log(data);
                if (!mounted) return;
                setValidated(Boolean(data?.valid));
            } catch {
                if (!mounted) return;
                setValidated(false);
            }
        }
        validate();
        return () => {
            mounted = false;
        };
    }, [emailParam, tokenParam]);

    useEffect(() => {
        if (success) {
            const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [success]);

    useEffect(() => {
        if (success && countdown <= 0) {
            router.push("/");
        }
    }, [success, countdown, router]);

    const passwordValid = useMemo(() => validatePassword(password), [password]);
    const confirmValid = confirm === password && password.length > 0;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!passwordValid) {
            setError("Password must be 6+ chars with upper, lower, number, and symbol.");
            return;
        }
        if (!confirmValid) {
            setError("Passwords do not match.");
            return;
        }
        setSubmitting(true);
        try {
            await resetPassword({
                email: emailParam!,
                token: tokenParam!,
                password,
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

    if (validated === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Reset Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-red-600">Link expired or invalid. Please request a new reset link.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-between bg-background px-4 py-8">
            <div className="w-full max-w-md space-y-8 flex-grow flex flex-col items-center justify-center">
                <div className="text-center mb-6">
                    <Image src="/logo-with-name.svg" alt="CGPEY" width={250} height={250} priority />
                </div>

                <Card className="shadow-lg w-full">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <div className="text-center space-y-5">
                                <p className="text-green-600">✅ Your password has been reset successfully.</p>
                                <p className="text-sm text-muted-foreground">Redirecting you to login page in {countdown}...</p>
                            </div>
                        ) : (
                            <form onSubmit={onSubmit} className="space-y-6 my-4">
                                <div className="space-y-3">
                                    <Label>Email</Label>
                                    <Input value={emailParam || ""} readOnly className="py-6 opacity-90" />
                                </div>
                                <div className="space-y-3">
                                    <Label>New Password</Label>
                                    <Input type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} required className="py-6" />
                                    {!passwordValid && password.length > 0 && (
                                        <p className="text-xs text-red-600">Use 6+ chars with upper, lower, number, and symbol.</p>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <Label>Confirm Password</Label>
                                    <Input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="py-6" />
                                    {confirm.length > 0 && !confirmValid && (
                                        <p className="text-xs text-red-600">Passwords do not match.</p>
                                    )}
                                </div>
                                {error && <p className="text-red-600 text-center text-sm">{error}</p>}
                                <Button type="submit" className="w-full h-12 mt-2" disabled={submitting || validated !== true}>
                                    {submitting ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="text-center text-sm text-muted-foreground w-full py-4">
                © {new Date().getFullYear()} CGPEY. All rights reserved.
            </div>
        </div>
    );
}

function ResetPasswordSkeleton() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6 animate-pulse">
                <div className="h-24 bg-muted rounded-lg"></div>
                <div className="h-96 bg-muted rounded-lg"></div>
                <div className="mt-20 h-10 bg-muted rounded-lg"></div>
            </div>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<ResetPasswordSkeleton />}>
            <ResetPasswordPage />
        </Suspense>
    );
}
"use client";

import { useState } from "react";
import Image from "next/image";
import { SendHorizonalIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendResetPasswordLink } from "@/lib/services/auth";
import Link from "next/link";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await sendResetPasswordLink({ email });
            console.log(res);
            
            setSent(true);
        } catch (error: any) {
            setError(error.message || "Something went wrong. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-between bg-background px-4 py-8">
            <div className="w-full max-w-md space-y-8 flex-grow flex flex-col items-center justify-center">
                <div className="text-center mb-6">
                    <Image src="/logo-with-name.svg" alt="CGPEY" width={250} height={250} priority />
                </div>

                <Card className="shadow-lg w-full" data-testid="card-login">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center" data-testid="heading-login">
                            Forgot Password
                        </CardTitle>
                        <p className="text-sm text-muted-foreground text-center">
                            Lost your password? Let’s get you a new one.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6 my-4">
                            {/* Email */}
                            <div className="space-y-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="py-6"
                                />
                            </div>

                            {/* Error */}
                            {error && <p className="text-red-600 text-center text-sm">{error}</p>}

                            {/* Submit */}
                            <Button type="submit" className="w-full h-12 mt-2" disabled={isLoading}>
                                {isLoading ? "Generating link..." : <>Send Reset Link <SendHorizonalIcon className="h-5 w-5 mr-2" /></>}
                            </Button>
                            {sent && (
                                <p className="text-green-600 text-center text-sm">If an account exists for {email}, a reset link has been sent.</p>
                            )}
                            <div className="flex justify-center items-center text-sm">
                                <p>Want to login? </p>&nbsp;<Link className="text-blue-800 hover:underline cursor-pointer mr-1" href="/">Login</Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground w-full py-4">
                © {new Date().getFullYear()} CGPEY. All rights reserved.
            </div>
        </div>
    );
}

export default ForgotPassword;

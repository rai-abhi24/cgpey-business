import { Suspense } from "react";
import UpiPaymentClient from "./_components/UpiPaymentClient";

export default function UpiCheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">.</div>}>
            <UpiPaymentClient />
        </Suspense>
    );
}

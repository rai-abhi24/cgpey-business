import { Suspense } from "react";
import PaymentResultClient from "./_components/PaymentResultClient";

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentResultClient />
    </Suspense>
  );
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import { Payment } from "@/models";

/**
 * GET /api/payments/[orderId]
 * Returns clean payment details for a given order.
 */
export async function GET(
    req: Request,
    { params }: { params: any }
) {
    try {
        await connectDB();
        const { orderId } = params;

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: "Missing orderId parameter" },
                { status: 400 }
            );
        }

        // Fetch the most recent payment for this order
        const payment: any = await Payment.findOne({ merchantOrderId: orderId })
            .sort({ createdAt: -1 })
            .lean();

        if (!payment) {
            return NextResponse.json(
                { success: false, error: "Payment not found" },
                { status: 404 }
            );
        }

        // Shape the response for frontend safety — no raw gateway data leakage
        const safeData = {
            paymentId: payment.paymentId,
            merchantOrderId: payment.merchantOrderId,
            merchantId: payment.merchantId,
            gateway: payment.gateway,
            gatewayTxnId: payment.gatewayTxnId,
            amount: payment.amount,
            currency: payment.currency,
            state: payment.state,
            checkoutType: payment.checkoutType,
            paymentInitiatedAt: payment.paymentInitiatedAt,
            completedAt: payment.completedAt,
            utr: payment.utr,
            refund: payment.refund
                ? {
                    refundId: payment.refund.refundId,
                    amount: payment.refund.amount,
                    status: payment.refund.status,
                    initiatedAt: payment.refund.initiatedAt,
                    completedAt: payment.refund.completedAt,
                }
                : null,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
        };

        return NextResponse.json({ success: true, data: safeData });
    } catch (err: any) {
        console.error("❌ Payment fetch error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
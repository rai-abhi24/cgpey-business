import { PaymentData } from "../page";
import { Calendar, CreditCard, Clock } from "lucide-react";
import DetailItem from "./DetailItem";

export default function PaymentDetails({
    payment,
    copiedField,
    onCopy,
    formatDate,
}: {
    payment: PaymentData;
    copiedField: string | null;
    onCopy: (text: string, field: string) => void;
    formatDate: (date: string | null) => string;
}) {
    return (
        <div className="flex flex-col gap-6 pt-6 border-t">
            {/* Mobile: Single column, Desktop: Two columns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Payment Information */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm lg:text-base">
                        <CreditCard className="h-4 w-4 flex-shrink-0" />
                        Payment Information
                    </h3>
                    <div className="space-y-3 bg-white rounded-lg border border-gray-200 p-4">
                        <DetailItem
                            label="Payment ID"
                            value={payment.paymentId}
                            onCopy={() => onCopy(payment.paymentId, "paymentId")}
                            copied={copiedField === "paymentId"}
                            mobile
                        />
                        <DetailItem
                            label="Gateway Txn ID"
                            value={payment.gatewayTxnId}
                            onCopy={() => onCopy(payment.gatewayTxnId, "gatewayTxnId")}
                            copied={copiedField === "gatewayTxnId"}
                            mobile
                        />
                        <DetailItem
                            label="Gateway"
                            value={payment.gateway}
                            className="uppercase"
                            mobile
                        />
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm lg:text-base">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        Timeline
                    </h3>
                    <div className="space-y-3 bg-white rounded-lg border border-gray-200 p-4">
                        <DetailItem
                            label="Initiated"
                            value={formatDate(payment.paymentInitiatedAt)}
                            icon={<Calendar className="h-3 w-3" />}
                            mobile
                        />
                        <DetailItem
                            label="Completed"
                            value={formatDate(payment.completedAt)}
                            icon={<Calendar className="h-3 w-3" />}
                            mobile
                        />
                        {payment.utr && (
                            <DetailItem
                                label="UTR Number"
                                value={payment.utr}
                                onCopy={() => onCopy(payment.utr!, "utr")}
                                copied={copiedField === "utr"}
                                mobile
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
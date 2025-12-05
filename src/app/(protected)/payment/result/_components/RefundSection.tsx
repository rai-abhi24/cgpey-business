import { Button } from "@/components/ui/button";
import DetailItem from "./DetailItem";
import { Clock, CreditCard, Loader2, RefreshCcw } from "lucide-react";
import { RefundData } from "./PaymentResultClient";
import { Badge } from "@/components/ui/badge";

const TERMINAL_REFUND_STATES = ["FAILED", "SUCCESS", "FAILED"];

export default function RefundSection({
    refund,
    currency,
    copiedField,
    onCopy,
    onCheckStatus,
    isChecking,
    formatCurrency,
    formatDate,
    getBadgeVariant,
}: {
    refund: RefundData;
    refundMessage: string;
    currency: string;
    copiedField: string | null;
    onCopy: (text: string, field: string) => void;
    onCheckStatus: () => void;
    isChecking: boolean;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string | null) => string;
    getBadgeVariant: (state: string) => any;
}) {
    const isTerminalState = TERMINAL_REFUND_STATES.includes(refund.state);

    return (
        <div className="border-t pt-4 sm:pt-6 space-y-4">
            {/* Header */}
            <div className="text-center space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm sm:text-base">
                    Refund Status
                </h3>

                <div className="flex flex-col items-center gap-2">
                    <Badge
                        variant={getBadgeVariant(refund.state) as any}
                        className="text-xs sm:text-sm font-semibold px-3 py-1"
                    >
                        {refund.state}
                    </Badge>
                    {/* <p className="text-xs sm:text-sm text-gray-600 px-2 text-center">
                        {refundMessage}
                    </p> */}
                </div>
            </div>

            {/* Refund Details - Single column on mobile, two columns on desktop */}
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 lg:gap-6">
                {/* Refund Information Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <h4 className="font-semibold text-gray-700 text-sm">Refund Information</h4>
                    </div>
                    <div className="space-y-3">
                        <DetailItem
                            label="Refund ID"
                            value={refund.refundId}
                            onCopy={() => onCopy(refund.refundId, "refundId")}
                            copied={copiedField === "refundId"}
                            mobile
                            compact
                        />
                        <DetailItem
                            label="Amount"
                            value={formatCurrency(refund.amount, currency)}
                            mobile
                            compact
                        />
                    </div>
                </div>

                {/* Timeline Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <h4 className="font-semibold text-gray-700 text-sm">Timeline</h4>
                    </div>
                    <div className="space-y-3">
                        <DetailItem
                            label="Initiated"
                            value={formatDate(refund.initiatedAt)}
                            mobile
                            compact
                        />
                        {refund.completedAt && (
                            <DetailItem
                                label="Completed"
                                value={formatDate(refund.completedAt)}
                                mobile
                                compact
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Action Button */}
            {!isTerminalState && (
                <div className="pt-2 sm:pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isChecking}
                        onClick={onCheckStatus}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 bg-green-600 text-white"
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="sm:hidden">Checking</span>
                                <span className="hidden sm:inline">Checking Status...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCcw className="h-4 w-4" />
                                <span className="sm:hidden">Check Status</span>
                                <span className="hidden sm:inline">Check Refund Status</span>
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
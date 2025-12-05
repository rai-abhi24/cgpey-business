import { LockKeyhole, Tag } from "lucide-react";

interface OrderSummaryCardProps {
    checkoutData: any;
    totalAmount: number;
    isCOD: boolean;
}

export default function OrderSummaryCard({
    checkoutData,
    totalAmount,
    isCOD,
}: OrderSummaryCardProps) {
    return (
        <>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-600" />
                    Order Summary
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Price ({checkoutData.items.length} items)
                        </p>
                        <p className="text-sm text-gray-900 font-medium">
                            ₹{checkoutData.subtotal.toLocaleString()}
                        </p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Platform Fee</p>
                        <p className="text-sm text-gray-900 font-medium">
                            ₹{checkoutData.platformFee}
                        </p>
                    </div>
                    {isCOD && (
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600">COD Charges</p>
                            <p className="text-sm text-orange-600 font-medium">₹50</p>
                        </div>
                    )}
                </div>
                <div className="border-t border-dashed border-blue-200 my-4"></div>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-blue-700 font-semibold">Total Amount</p>
                    <p className="text-xl text-blue-700 font-bold">
                        ₹{totalAmount.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <LockKeyhole className="h-3.5 w-3.5 text-green-600" />
                        <span>Secure SSL encrypted payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <LockKeyhole className="h-3.5 w-3.5 text-green-600" />
                        <span>Your data is protected</span>
                    </div>
                </div>
            </div>
        </>
    );
}

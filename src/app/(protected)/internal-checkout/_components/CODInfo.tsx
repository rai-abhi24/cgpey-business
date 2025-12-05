import { ArrowRight, Loader2 } from "lucide-react";

interface CODInfoProps {
  amount: number;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
}

export default function CODInfo({ amount, onSubmit, isProcessing }: CODInfoProps) {
  const handleSubmit = () => {
    onSubmit({ paymentMode: "COD" });
  };

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-5 border-2 border-orange-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 text-2xl">
            💵
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Cash on Delivery
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Pay with cash when your order is delivered to your doorstep
            </p>
          </div>
        </div>
      </div>

      {/* COD Charges */}
      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-900 mb-1">
              Additional COD Charges
            </p>
            <p className="text-sm text-orange-800">
              A convenience fee of <span className="font-bold">₹50</span> will
              be added to your order total for Cash on Delivery option.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r mt-10 from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white rounded-xl py-3.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-[0.98]"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Placing Order...
          </>
        ) : (
          <>
            Place Order (Pay ₹{amount} at Delivery)
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}
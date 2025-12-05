import { ArrowRight, Building2, ExternalLink, Loader2 } from 'lucide-react'

interface NetBankingFormProps {
  amount: number
  onSubmit: (data: any) => void
  isProcessing: boolean
}

export default function NetBankingForm({ amount, onSubmit, isProcessing }: NetBankingFormProps) {
  const handleSubmit = () => {
    onSubmit({ paymentMode: 'NET_BANKING' })
  }

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Net Banking Payment
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              You&apos;ll be redirected to select your bank and complete the payment
              securely
            </p>
          </div>
        </div>
      </div>

      {/* Payment Steps */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-900 mb-3">
          Payment Steps:
        </p>
        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Select your bank from the list
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Login with your net banking credentials
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Authorize payment and complete transaction
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl py-3.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirecting to Bank Selection...
          </>
        ) : (
          <>
            Continue to Pay ₹{amount}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-gray-600 animate-pulse">
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm">Opening bank selection page...</span>
        </div>
      )}
    </div>
  )
}

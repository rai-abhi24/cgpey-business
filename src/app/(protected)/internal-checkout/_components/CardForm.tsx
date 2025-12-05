import React from 'react'
import {
  ArrowRight,
  CreditCard,
  ExternalLink,
  Loader2,
} from 'lucide-react'

const CardForm = ({ amount, onSubmit, isProcessing }: any) => {
  const handleSubmit = () => {
    onSubmit({ paymentMode: 'CARD' })
  }

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <CreditCard className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Secure Card Payment
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              You&apos;ll be redirected to secure payment gateway to enter your card
              details
            </p>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Note:</span> Your card details are
          never stored on our servers. All transactions are processed through
          our secure payment partner.
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl py-3.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 active:scale-[0.98]"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirecting to Payment Gateway...
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
          <span className="text-sm">Opening secure payment page...</span>
        </div>
      )}
    </div>
  )
}

export default React.memo(CardForm)

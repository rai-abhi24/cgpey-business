import React from 'react'
import {
  ArrowRight,
  // CheckCircle,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
} from 'lucide-react'

const CardForm = ({ amount, onSubmit, isProcessing }: any) => {
  const handleSubmit = () => {
    onSubmit({ paymentMode: 'CARD' })
  }

  const cardFeatures = [
    // { icon: <Shield className="h-4 w-4" />, text: "PCI DSS Compliant" },
    { icon: <Lock className="h-4 w-4" />, text: '256-bit SSL Encryption' },
    // {
    //   icon: <CheckCircle className="h-4 w-4" />,
    //   text: '3D Secure Authentication',
    // },
  ]

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

      {/* Security Features */}
      <div className="bg-white rounded-xl p-4 border-2 border-gray-100">
        <p className="text-xs font-semibold text-gray-900 mb-3">
          Security Features
        </p>
        <div className="space-y-2.5">
          {cardFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2.5 text-gray-700"
            >
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                {feature.icon}
              </div>
              <span className="text-sm">{feature.text}</span>
            </div>
          ))}
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

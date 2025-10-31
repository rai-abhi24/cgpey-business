import React, { useState } from "react";
import {
  Loader2,
  QrCode,
  Smartphone,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { SiPhonepe, SiGooglepay, SiPaytm } from "react-icons/si";
import { validateUPI } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { verifyVPA } from "@/lib/services/payment";
import { AxiosResponse } from "axios";
import { toast } from "sonner";

interface UpiFormProps {
  amount: number;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
  isMobile: boolean;
  deviceOS: string;
}

type UpiApp = {
  id: string;
  name: string;
  abbr: string;
  icon: React.ReactNode;
  package: string;
};

const UpiForm = ({ amount, onSubmit, isProcessing, isMobile, deviceOS }: UpiFormProps) => {
  const [selectedMode, setSelectedMode] = useState(isMobile ? "upi_apps" : null);
  const [upiId, setUpiId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<any>({});

  const upiApps: UpiApp[] = [
    {
      id: "phonepe",
      name: "PhonePe",
      abbr: "PHONEPE",
      icon: <SiPhonepe className="text-purple-600" />,
      package: "com.phonepe.app",
    },
    {
      id: "gpay",
      name: "Google Pay",
      abbr: "GPAY",
      icon: <SiGooglepay className="text-blue-600" />,
      package: "com.google.android.apps.nbu.paisa.user",
    },
    {
      id: "paytm",
      name: "Paytm",
      abbr: "PAYTM",
      icon: <SiPaytm className="text-sky-600" />,
      package: "net.one97.paytm",
    },
  ];

  const paymentModes = [
    {
      id: "qr",
      title: "Pay via QR Code",
      description: "Scan QR with any UPI app",
      icon: <QrCode className="h-5 w-5" />,
      available: !isMobile,
    },
    {
      id: "upi_id",
      title: "Pay using UPI ID",
      description: "Enter your UPI ID",
      icon: <CreditCard className="h-5 w-5" />,
      available: !isMobile,
    },
    {
      id: "upi_apps",
      title: "Pay with UPI App",
      description: "Open app directly",
      icon: <Smartphone className="h-5 w-5" />,
      available: isMobile,
    },
  ];

  const resetForm = () => {
    setUpiId("");
    setIsVerifying(false);
    setVerificationStatus(null);
    setName("");
    setErrors({});
  };

  const verfyVPAMutation = useMutation({
    mutationFn: (body: any) => verifyVPA(body),
    onSuccess: (res: AxiosResponse) => {
      const data = res.data;
      setTimeout(() => {
        if (data.success) {
          setVerificationStatus(data.success);
          setName(data.name);
        } else {
          setVerificationStatus(data.success);
          setErrors({ upi: "Invalid UPI ID" });
        }
        setIsVerifying(false);
      }, 500);
    },
    onError: (err: any) => {
      setIsVerifying(false);
      toast.error(err?.message || 'Payment failed');
    },
  });

  const handleVerify = async () => {
    if (!validateUPI(upiId)) {
      setErrors({ upi: "Please enter a valid UPI ID" });
      return;
    }

    setIsVerifying(true);
    setErrors({});

    verfyVPAMutation.mutate({ upiId, gateway: "phonepe" });
  };

  const handleQRPayment = () => {
    onSubmit({ paymentMode: "UPI_QR" });
  };

  const handleUPIIDPayment = () => {
    if (!verificationStatus) {
      setErrors({ upi: "Please verify your UPI ID first" });
      return;
    }
    onSubmit({ paymentMode: "UPI_COLLECT", upiId });
    resetForm();
  };

  const handleUPIAppPayment = (app: UpiApp) => {
    onSubmit({
      paymentMode: "UPI_INTENT",
      targetApp: deviceOS === "IOS" ? app.abbr : app.package,
      appName: app.name,
      os: deviceOS,
    });
  };

  const handleMoreAppsClick = () => {
    window.open("upi://pay", "_blank");
  };

  if (!selectedMode) {
    return (
      <div className="space-y-3">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Choose payment method
          </h3>
          <p className="text-xs text-gray-500">
            Select how you want to pay with UPI
          </p>
        </div>

        {paymentModes
          .filter((mode) => mode.available)
          .map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              disabled={isProcessing}
              className="w-full bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    {mode.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {mode.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {mode.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </button>
          ))}
      </div>
    );
  }

  // QR Code Payment
  if (selectedMode === "qr") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedMode(null)}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2"
        >
          ← Back
        </button>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center border-2 border-blue-100">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <QrCode className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            UPI QR Code
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            A QR code will be generated for you to scan with any UPI app
          </p>
        </div>

        <button
          onClick={handleQRPayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl py-3.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>Generate QR & Pay ₹{amount}</>
          )}
        </button>
      </div>
    );
  }

  // UPI ID Payment
  if (selectedMode === "upi_id") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setSelectedMode(null);
            resetForm();
          }}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2"
        >
          ← Back
        </button>

        <div>
          <label
            htmlFor="upi"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Enter UPI ID
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                name="upi"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setVerificationStatus(null);
                  setErrors({});
                }}
                disabled={isProcessing}
                className={`text-sm text-gray-900 border-2 ${errors.upi
                  ? "border-red-500 focus:border-red-500"
                  : verificationStatus
                    ? "border-green-500 focus:border-green-500"
                    : "border-gray-300 focus:border-blue-500"
                  } rounded-lg px-4 py-3 w-full placeholder:text-gray-400 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
                placeholder="yourname@ybl"
              />
              {errors.upi && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.upi}
                </p>
              )}
              {verificationStatus && (
                <div className="py-2.5 px-0.5">
                  <p className="text-xs text-green-700 font-semibold flex items-center gap-2">
                    Verified: {name}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleVerify}
              disabled={isVerifying || isProcessing || !upiId}
              className="text-sm bg-primary hover:bg-primary/90 max-h-12 text-white rounded-lg px-5 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Verifying</span>
                </>
              ) : (
                "Verify"
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleUPIIDPayment}
          disabled={isProcessing || !verificationStatus}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl py-3.5 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay ₹{amount}</>
          )}
        </button>
      </div>
    );
  }

  // UPI Apps Payment (Mobile Only)
  if (selectedMode === "upi_apps") {
    return (
      <div className="space-y-4">
        {!isMobile && (
          <button
            onClick={() => setSelectedMode(null)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2"
          >
            ← Back
          </button>
        )}

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Select UPI App
          </h3>
          <p className="text-xs text-gray-500">
            Choose your preferred payment app
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {upiApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleUPIAppPayment(app)}
              disabled={isProcessing}
              className="bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl group-hover:bg-white transition-colors">
                  {app.icon}
                </div>
                <p className="text-xs font-medium text-gray-900">{app.name}</p>
              </div>
            </button>
          ))}
        </div>

        {/* More apps option */}
        <button
          disabled={isProcessing}
          className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <div
            className="flex items-center justify-center gap-2 text-gray-600"
            onClick={handleMoreAppsClick}
          >
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            </div>
            <span className="text-sm font-medium">More Apps</span>
          </div>
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">Tip:</span> The selected app will
            open automatically for payment
          </p>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Opening app...</span>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default React.memo(UpiForm);

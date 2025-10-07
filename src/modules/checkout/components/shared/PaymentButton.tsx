import React from 'react';
import { Loader2, Wallet } from 'lucide-react';

interface PaymentButtonProps {
  isFormValid: boolean;
  isProcessing: boolean;
  onConfirmPayment: () => void;
  amount: number;
  currency: string;
  type?: 'topup' | 'subscription';
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  isFormValid,
  isProcessing,
  onConfirmPayment,
  amount,
  currency,
  type = 'subscription'
}) => (
  <button
    onClick={onConfirmPayment}
    disabled={!isFormValid || isProcessing}
    className={`w-full px-6 py-4 rounded-xl font-semibold transition-all duration-200 text-lg ${
      isFormValid && !isProcessing
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25'
        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
    }`}
  >
    {isProcessing ? (
      <div className="flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        Processing Payment...
      </div>
    ) : type === 'topup' ? (
      <div className="flex items-center justify-center gap-3">
        <Wallet className="w-5 h-5" />
        Top Up Wallet • {amount.toLocaleString()} {currency}
      </div>
    ) : (
      `Confirm Payment • ${amount.toLocaleString()} ${currency}`
    )}
  </button>
);
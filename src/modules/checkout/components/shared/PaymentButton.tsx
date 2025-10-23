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
    className={`group relative w-full px-8 py-5 rounded-2xl font-light transition-all duration-300 text-lg overflow-hidden ${
      isFormValid && !isProcessing
        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-gray-950 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/40 hover:scale-[1.02]'
        : 'bg-gray-900/50 text-gray-600 cursor-not-allowed border border-gray-800/50'
    }`}
  >
    {isFormValid && !isProcessing && (
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
    )}
    
    <div className="relative">
      {isProcessing ? (
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing Payment...</span>
        </div>
      ) : type === 'topup' ? (
        <div className="flex items-center justify-center gap-3">
          <Wallet className="w-5 h-5" />
          <span>Top Up Wallet</span>
          <span className="mx-2 text-gray-950/30">•</span>
          <span className="font-normal">{amount.toLocaleString()} {currency}</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <span>Confirm Payment</span>
          <span className="mx-2 text-gray-950/30">•</span>
          <span className="font-normal">{amount.toLocaleString()} {currency}</span>
        </div>
      )}
    </div>
  </button>
);

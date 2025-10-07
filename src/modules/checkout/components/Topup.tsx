import React from 'react';
import { Wallet, Plus, Check } from 'lucide-react';
import type { TopUpPlan } from '../types';
import { PaymentCard, SecurityBadge, PaymentButton, PricingBadge } from './shared';

interface TopUpComponentProps {
  topUpPlan: TopUpPlan;
  isFormValid: boolean;
  isProcessing?: boolean;
  onConfirmPayment: () => void;
}

const TopUpComponent: React.FC<TopUpComponentProps> = ({
  topUpPlan,
  isFormValid,
  isProcessing = false,
  onConfirmPayment
}) => {
  const totalAmount = topUpPlan.amount + (topUpPlan.bonus || 0);

  const amountDetails = [
    {
      label: 'Base Amount',
      value: topUpPlan.amount,
      color: 'red',
      icon: Check,
      sign: ''
    },
    ...(topUpPlan.bonus ? [{
      label: 'Bonus Amount',
      value: topUpPlan.bonus,
      color: 'green',
      icon: Plus,
      sign: '+'
    }] : []),
    {
      label: 'Total Credit',
      value: totalAmount,
      color: 'blue',
      icon: Wallet,
      sign: ''
    }
  ];

  return (
    <div className="space-y-8">
      {/* TopUp Details */}
      <PaymentCard className="relative overflow-hidden">
        <PricingBadge badge={topUpPlan.badge} />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Wallet className="w-6 h-6 text-red-400" />
            Top Up Wallet
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-white">
              {topUpPlan.amount.toLocaleString()} {topUpPlan.currency}
            </div>
            {topUpPlan.bonus && (
              <div className="px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg text-xs font-medium">
                +{topUpPlan.bonus.toLocaleString()} {topUpPlan.currency} bonus
              </div>
            )}
          </div>
          <div className="text-gray-400 mt-1">Add funds to your wallet</div>
        </div>

        {/* Amount Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-red-400" />
            Amount Details
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {amountDetails.map((detail, index) => {
              const IconComponent = detail.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br from-${detail.color}-600 to-${detail.color}-700 flex items-center justify-center`}>
                      <IconComponent className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white font-medium">{detail.label}</span>
                  </div>
                  <span className={`text-${detail.color}-400 font-semibold`}>
                    {detail.sign}{detail.value.toLocaleString()} {topUpPlan.currency}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <SecurityBadge />
      </PaymentCard>

      {/* Summary */}
      <PaymentCard>
        <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>

        <div className="space-y-3">
          <div className="flex justify-between text-gray-400">
            <span>Amount to Pay</span>
            <span>{topUpPlan.amount.toLocaleString()} {topUpPlan.currency}</span>
          </div>
          {topUpPlan.bonus && (
            <div className="flex justify-between text-green-400">
              <span>Bonus Credit</span>
              <span>+{topUpPlan.bonus.toLocaleString()} {topUpPlan.currency}</span>
            </div>
          )}
          <div className="border-t border-gray-700 pt-3">
            <div className="flex justify-between text-white font-bold text-lg">
              <span>Total Wallet Credit</span>
              <span>{totalAmount.toLocaleString()} {topUpPlan.currency}</span>
            </div>
          </div>
        </div>
      </PaymentCard>

      {/* Payment Button */}
      <PaymentButton
        isFormValid={isFormValid}
        isProcessing={isProcessing}
        onConfirmPayment={onConfirmPayment}
        amount={topUpPlan.amount}
        currency={topUpPlan.currency}
        type="topup"
      />
    </div>
  );
};

export default TopUpComponent;
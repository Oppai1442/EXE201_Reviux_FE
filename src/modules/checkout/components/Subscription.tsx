import React from 'react';
import { Zap } from 'lucide-react';
import type { checkoutDetail } from '../types';
import { useTranslation } from 'react-i18next';
import { PaymentCard, SecurityBadge, PaymentButton, FeatureList } from './shared';

interface SubscriptionSummaryProps {
  checkoutDetail: checkoutDetail;
  isProcessing: boolean;
  isFormValid: boolean;
  onConfirmPayment: () => void;
  currency?: string;
}

const SubscriptionSummary: React.FC<SubscriptionSummaryProps> = ({
  checkoutDetail,
  isProcessing,
  isFormValid,
  onConfirmPayment,
  currency = 'USD',
}) => {
  const { t } = useTranslation();
  const subscription = checkoutDetail.subscription!;

  let discount = 0;
  if (subscription.isAnnual) {
    discount = (subscription.price * 12) - subscription.finalPrice;
    discount = Math.round(discount * 100) / 100;
  }

  const hasDiscount = discount > 0;

  return (
    <div className="space-y-8">
      {/* Plan Details */}
      <PaymentCard>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{subscription.name}</h2>
          {subscription.description && (
            <p className="text-gray-400 mb-3">{subscription.description}</p>
          )}
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-white">
              {subscription.finalPrice.toLocaleString()} {currency}
            </div>
            {hasDiscount && (
              <div className="text-lg text-gray-400 line-through">
                {(subscription.isAnnual
                  ? subscription.price * 12
                  : subscription.price
                ).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </div>
            )}
          </div>
          <div className="text-gray-400 mt-1">per {subscription.isAnnual ? "year" : "month"}</div>
        </div>

        {/* Features */}
        {subscription.features && subscription.features.length > 0 && (
          <FeatureList
            features={subscription.features}
            title="Plan Features"
            titleIcon={<Zap className="w-5 h-5 text-red-400" />}
            getFeatureText={(featureKey) => t(`subscription.features.${featureKey}`)}
          />
        )}

        <SecurityBadge />
      </PaymentCard>

      {/* Summary */}
      <PaymentCard>
        <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>

        <div className="space-y-3">
          {hasDiscount && (
            <>
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>
                  {(subscription.isAnnual
                    ? (subscription.price * 12)
                    : subscription.price
                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>
                  -{discount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
            </>
          )}

          <div className={hasDiscount ? "border-t border-gray-700 pt-3" : ""}>
            <div className="flex justify-between text-white font-bold text-lg">
              <span>Total</span>
              <span>{subscription.finalPrice.toLocaleString()} {currency}</span>
            </div>
          </div>
        </div>
      </PaymentCard>

      {/* Payment Button */}
      <PaymentButton
        isFormValid={isFormValid}
        isProcessing={isProcessing}
        onConfirmPayment={onConfirmPayment}
        amount={subscription.finalPrice}
        currency={currency}
        type="subscription"
      />
    </div>
  );
};

export default SubscriptionSummary;
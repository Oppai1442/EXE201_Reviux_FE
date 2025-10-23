import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, Crown } from 'lucide-react';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  let discount = 0;
  if (subscription.isAnnual) {
    discount = (subscription.price * 12) - subscription.finalPrice;
    discount = Math.round(discount * 100) / 100;
  }

  const hasDiscount = discount > 0;

  return (
    <div ref={containerRef} className="space-y-6 relative">
      {/* Mouse-following gradient */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300 -z-10"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`
        }}
      />

      {/* Plan Details Card */}
      <PaymentCard className="relative overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="mb-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/10 to-cyan-600/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-cyan-400/20">
              <Crown className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-light text-white">{subscription.name}</h2>
          </div>
          
          {subscription.description && (
            <p className="text-gray-400 font-light mb-4 leading-relaxed">{subscription.description}</p>
          )}
          
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl font-light text-white">
              {subscription.finalPrice.toLocaleString()} {currency}
            </div>
            {hasDiscount && (
              <div className="text-lg text-gray-500 line-through font-light">
                {(subscription.isAnnual
                  ? subscription.price * 12
                  : subscription.price
                ).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </div>
            )}
          </div>
          <div className="text-gray-400 font-light">per {subscription.isAnnual ? "year" : "month"}</div>

          {hasDiscount && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-cyan-400/10 to-cyan-600/10 text-cyan-400 border border-cyan-400/30 rounded-xl text-sm font-light backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              Save {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency} with annual billing
            </div>
          )}
        </div>

        {/* Features */}
        {subscription.features && subscription.features.length > 0 && (
          <div className="relative z-10">
            <FeatureList
              features={subscription.features}
              title="Plan Features"
              titleIcon={<Zap className="w-5 h-5 text-cyan-400" />}
              getFeatureText={(featureKey) => t(`subscription.features.${featureKey}`)}
            />
          </div>
        )}

        <SecurityBadge />
      </PaymentCard>

      {/* Summary Card */}
      <PaymentCard>
        <h3 className="text-lg font-light text-white mb-6">Order Summary</h3>

        <div className="space-y-4">
          {hasDiscount && (
            <>
              <div className="flex justify-between text-gray-400 font-light">
                <span>Subtotal</span>
                <span>
                  {(subscription.isAnnual
                    ? (subscription.price * 12)
                    : subscription.price
                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
              <div className="flex justify-between text-cyan-400 font-light">
                <span>Annual Discount</span>
                <span>
                  -{discount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
            </>
          )}

          <div className={hasDiscount ? "border-t border-gray-800/50 pt-4" : ""}>
            <div className="flex justify-between text-white font-light text-xl">
              <span>Total</span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                {subscription.finalPrice.toLocaleString()} {currency}
              </span>
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

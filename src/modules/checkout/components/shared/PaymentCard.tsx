import React from 'react';

interface PaymentCardProps {
  children: React.ReactNode;
  className?: string;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ children, className = "" }) => (
  <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);
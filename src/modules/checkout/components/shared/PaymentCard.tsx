import React from 'react';

interface PaymentCardProps {
  children: React.ReactNode;
  className?: string;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ children, className = "" }) => (
  <div className={`relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8 shadow-2xl hover:border-cyan-500/30 transition-all duration-500 ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      {children}
    </div>
  </div>
);

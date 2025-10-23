import React from 'react';
import { Crown } from 'lucide-react';

interface PricingBadgeProps {
  badge?: string;
  position?: 'top-right' | 'inline';
}

export const PricingBadge: React.FC<PricingBadgeProps> = ({ 
  badge, 
  position = 'top-right' 
}) => {
  if (!badge) return null;

  const badgeElement = (
    <div className="group relative px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 text-cyan-300 border border-cyan-500/30 rounded-xl text-sm font-light flex items-center gap-2 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300">
      <Crown className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
      <span>{badge}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );

  return position === 'top-right' ? (
    <div className="absolute top-6 right-6 z-10">
      {badgeElement}
    </div>
  ) : (
    badgeElement
  );
};

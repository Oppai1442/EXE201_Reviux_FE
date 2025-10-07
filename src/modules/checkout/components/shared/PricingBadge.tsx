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
    <div className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium flex items-center gap-2">
      <Crown className="w-3 h-3" />
      {badge}
    </div>
  );

  return position === 'top-right' ? (
    <div className="absolute top-4 right-4">
      {badgeElement}
    </div>
  ) : (
    badgeElement
  );
};
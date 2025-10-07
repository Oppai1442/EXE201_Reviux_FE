import React from 'react';
import { Shield } from 'lucide-react';

export const SecurityBadge: React.FC = () => (
  <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
    <div className="flex items-center gap-3">
      <Shield className="w-5 h-5 text-green-400" />
      <div>
        <div className="text-green-400 font-medium">Secure Payment</div>
        <div className="text-green-300/70 text-sm">256-bit SSL encryption</div>
      </div>
    </div>
  </div>
);

import React from 'react';
import { Shield } from 'lucide-react';

export const SecurityBadge: React.FC = () => (
  <div className="mt-8 p-5 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-2xl backdrop-blur-sm hover:border-green-500/30 transition-all duration-300 group">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
        <Shield className="w-6 h-6 text-green-400" />
      </div>
      <div>
        <div className="text-green-400 font-light text-lg mb-1">Secure Payment</div>
        <div className="text-green-300/60 text-sm font-light">256-bit SSL encryption & PCI DSS compliant</div>
      </div>
    </div>
  </div>
);

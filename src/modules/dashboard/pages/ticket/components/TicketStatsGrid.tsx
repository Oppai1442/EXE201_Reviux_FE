import React from 'react';
import type { TicketStats } from '../types';

interface TicketStatsGridProps {
  stats: TicketStats;
  isLoading?: boolean;
}

const STAT_VARIANTS: Array<{
  key: keyof TicketStats;
  label: string;
  accent: string;
}> = [
  { key: 'total', label: 'Total Tickets', accent: 'text-cyan-400' },
  { key: 'open', label: 'Open', accent: 'text-cyan-300' },
  { key: 'inProgress', label: 'In Progress', accent: 'text-purple-300' },
  { key: 'closed', label: 'Closed', accent: 'text-emerald-300' },
];

const TicketStatsGrid: React.FC<TicketStatsGridProps> = ({
  stats,
  isLoading = false,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {STAT_VARIANTS.map((variant) => (
        <div
          key={variant.key}
          className="rounded-xl border border-gray-800/50 bg-gray-900/30 p-6 backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02]"
        >
          <div
            className={`text-3xl font-light ${
              isLoading ? 'animate-pulse text-gray-600' : variant.accent
            }`}
          >
            {isLoading ? '--' : stats[variant.key]}
          </div>
          <div className="mt-2 text-sm text-gray-400">{variant.label}</div>
        </div>
      ))}
    </div>
  );
};

export default TicketStatsGrid;



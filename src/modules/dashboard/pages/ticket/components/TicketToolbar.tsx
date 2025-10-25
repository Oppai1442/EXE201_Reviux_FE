import React from 'react';
import { RefreshCw, Search } from 'lucide-react';

interface TicketToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const TicketToolbar: React.FC<TicketToolbarProps> = ({
  query,
  onQueryChange,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search tickets by title, category, or status..."
          className="w-full rounded-xl border border-gray-700/50 bg-gray-800/30 px-12 py-4 text-white placeholder-gray-500 transition-all duration-300 focus:border-cyan-400/50 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-300 transition-all duration-300 hover:scale-[1.02] hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        <span>Refresh</span>
      </button>
    </div>
  );
};

export default TicketToolbar;


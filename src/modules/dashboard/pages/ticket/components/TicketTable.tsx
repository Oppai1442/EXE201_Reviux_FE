import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { TicketPriority, TicketStatus, TicketSummary } from '../types';

interface TicketTableProps {
  tickets: TicketSummary[];
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onSelect: (ticketId: number) => void;
  isLoading?: boolean;
}

const STATUS_STYLES: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  OPEN: {
    label: 'Open',
    className:
      'text-cyan-300 bg-cyan-400/10 border border-cyan-400/30',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className:
      'text-purple-300 bg-purple-400/10 border border-purple-400/30',
  },
  ON_HOLD: {
    label: 'On Hold',
    className:
      'text-amber-300 bg-amber-400/10 border border-amber-400/30',
  },
  RESOLVED: {
    label: 'Resolved',
    className:
      'text-emerald-300 bg-emerald-400/10 border border-emerald-400/30',
  },
  CLOSED: {
    label: 'Closed',
    className:
      'text-slate-300 bg-slate-500/10 border border-slate-400/30',
  },
};

const PRIORITY_STYLES: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  LOW: {
    label: 'Low',
    className: 'text-emerald-300 bg-emerald-400/10 border border-emerald-400/30',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'text-amber-300 bg-amber-400/10 border border-amber-400/30',
  },
  HIGH: {
    label: 'High',
    className: 'text-orange-300 bg-orange-400/10 border border-orange-400/30',
  },
  CRITICAL: {
    label: 'Critical',
    className: 'text-red-300 bg-red-400/10 border border-red-400/30',
  },
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onSelect,
  isLoading = false,
}) => {
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (totalItems === 0) {
      return { rangeStart: 0, rangeEnd: 0 };
    }

    const start = (page - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, totalItems);

    return { rangeStart: start, rangeEnd: end };
  }, [page, itemsPerPage, totalItems]);

  const rowsToRender = isLoading ? new Array(5).fill(null) : tickets;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-800/50 bg-gray-900/20 backdrop-blur-xl">
      <div className="relative overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800/50">
          <thead className="bg-gray-800/40">
            <tr>
              {['ID', 'Title', 'Category', 'Status', 'Priority', 'Updated', '']
                .map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-4 text-left text-sm font-light uppercase tracking-wide text-gray-400"
                  >
                    {heading}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {rowsToRender.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center text-gray-400"
                >
                  No tickets found. Try a different search keyword.
                </td>
              </tr>
            )}

            {rowsToRender.map((ticket, index) => (
              <tr
                key={ticket ? ticket.id : `skeleton-${index}`}
                className="border-b border-gray-800/30 transition-colors duration-200 hover:bg-gray-800/30"
                style={
                  isLoading
                    ? undefined
                    : { animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }
                }
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                  {ticket ? `#${ticket.id}` : <span className="block h-5 w-12 animate-pulse rounded bg-gray-800/50" />}
                </td>
                <td className="max-w-[260px] px-6 py-4 text-sm text-white">
                  {ticket ? (
                    <div className="truncate font-light">{ticket.subject}</div>
                  ) : (
                    <span className="block h-5 w-full animate-pulse rounded bg-gray-800/50" />
                  )}
                  {ticket?.shortDescription && (
                    <div className="mt-1 truncate text-xs text-gray-500">
                      {ticket.shortDescription}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {ticket ? (
                    <span className="rounded-full border border-gray-700/50 bg-gray-800/40 px-3 py-1 text-xs uppercase tracking-wide text-gray-400">
                      {ticket.category}
                    </span>
                  ) : (
                    <span className="block h-5 w-20 animate-pulse rounded bg-gray-800/50" />
                  )}
                </td>
                <td className="px-6 py-4">
                  {ticket ? (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${STATUS_STYLES[ticket.status].className}`}
                    >
                      {STATUS_STYLES[ticket.status].label}
                    </span>
                  ) : (
                    <span className="block h-5 w-24 animate-pulse rounded bg-gray-800/50" />
                  )}
                </td>
                <td className="px-6 py-4">
                  {ticket ? (
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${PRIORITY_STYLES[ticket.priority].className}`}
                    >
                      {PRIORITY_STYLES[ticket.priority].label}
                    </span>
                  ) : (
                    <span className="block h-5 w-24 animate-pulse rounded bg-gray-800/50" />
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                  {ticket ? (
                    formatDate(ticket.updatedAt)
                  ) : (
                    <span className="block h-5 w-24 animate-pulse rounded bg-gray-800/50" />
                  )}
                </td>
                <td className="px-6 py-4">
                  {ticket ? (
                    <button
                      type="button"
                      onClick={() => onSelect(ticket.id)}
                      className="inline-flex items-center rounded-lg border border-cyan-400/50 bg-cyan-500/10 p-2 text-cyan-300 transition-all duration-200 hover:scale-105 hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="block h-9 w-9 animate-pulse rounded bg-gray-800/50" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-800/50 bg-gray-900/30 px-6 py-4 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
        <span>
          Showing {rangeStart} - {rangeEnd} of {totalItems} tickets
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-2 text-gray-400 transition-colors duration-200 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    page === pageNumber
                      ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-200 shadow-cyan-500/20'
                      : 'border-gray-700/50 bg-gray-800/40 text-gray-400 hover:border-cyan-400/40 hover:text-cyan-200'
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-2 text-gray-400 transition-colors duration-200 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketTable;

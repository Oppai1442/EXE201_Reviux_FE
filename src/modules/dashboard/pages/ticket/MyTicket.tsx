import React, { useCallback, useEffect, useMemo, useState } from 'react';
import showToast from '@/utils/toast';
import TicketToolbar from './components/TicketToolbar';
import TicketStatsGrid from './components/TicketStatsGrid';
import TicketTable from './components/TicketTable';
import TicketDetailDrawer from './components/TicketDetailDrawer';
import {
  getMyTicketsAPI,
  getTicketDetailAPI,
  postTicketMessageAPI,
} from './services/ticketService';
import type {
  TicketDetail,
  TicketStats,
  TicketSummary,
} from './types';

const ITEMS_PER_PAGE = 8;
const INITIAL_STATS: TicketStats = {
  total: 0,
  open: 0,
  inProgress: 0,
  closed: 0,
};

const MyTicket: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [stats, setStats] = useState<TicketStats>(INITIAL_STATS);
  const [currentPage, setCurrentPage] = useState(1);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchTickets = useCallback(async () => {
    setIsRefreshing(true);
    setIsLoadingList(true);
    try {
      const data = await getMyTicketsAPI();
      setTickets(data?.tickets ?? []);
      setStats(data?.stats ?? INITIAL_STATS);
    } catch (error) {
      console.error('Failed to load tickets', error);
      showToast('error', 'Unable to load tickets. Please try again.');
    } finally {
      setIsRefreshing(false);
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets().catch(() => undefined);
  }, [fetchTickets]);

  const derivedStats = useMemo(() => {
    if (stats.total === tickets.length) {
      return stats;
    }
    return tickets.reduce<TicketStats>(
      (acc, ticket) => {
        acc.total += 1;
        switch (ticket.status) {
          case 'OPEN':
            acc.open += 1;
            break;
          case 'IN_PROGRESS':
            acc.inProgress += 1;
            break;
          case 'RESOLVED':
          case 'CLOSED':
            acc.closed += 1;
            break;
          default:
            break;
        }
        return acc;
      },
      { total: 0, open: 0, inProgress: 0, closed: 0 },
    );
  }, [stats, tickets]);

  const filteredTickets = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const haystack = [
        ticket.subject,
        ticket.category,
        ticket.status.replace(/_/g, ' '),
        ticket.priority,
        ...(ticket.tags ?? []),
      ]
        .filter(Boolean)
        .map((value) => value.toString().toLowerCase());

      return haystack.some((value) => value.includes(term));
    });
  }, [tickets, searchQuery]);

  const totalItems = filteredTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleRefresh = useCallback(() => {
    fetchTickets().catch(() => undefined);
  }, [fetchTickets]);

  const handleSelectTicket = useCallback(
    async (ticketId: number) => {
      setSelectedTicketId(ticketId);
      setIsDrawerOpen(true);
      setSelectedTicket(null);
      setIsLoadingDetail(true);
      try {
        const detail = await getTicketDetailAPI(ticketId);
        setSelectedTicket(detail);
      } catch (error) {
        console.error('Failed to load ticket detail', error);
        showToast('error', 'Unable to load ticket detail.');
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [],
  );

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedTicketId(null);
    setSelectedTicket(null);
  }, []);

  const handleSendMessage = useCallback(
    async (payload: { content: string; inlineImageBase64?: string }) => {
      if (!selectedTicketId) {
        return;
      }
      setIsSendingMessage(true);
      try {
        const newMessage = await postTicketMessageAPI(selectedTicketId, {
          content: payload.content,
          inlineImageBase64: payload.inlineImageBase64,
        });
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, newMessage],
              }
            : prev,
        );
        showToast('success', 'Message sent successfully.');
      } catch (error) {
        console.error('Failed to send message', error);
        showToast('error', 'Failed to send message. Please try again.');
        throw error;
      } finally {
        setIsSendingMessage(false);
      }
    },
    [selectedTicketId],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <div
        className="pointer-events-none fixed z-0 transition-all duration-300 ease-out"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          width: '600px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="fixed inset-0 z-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <header className="mb-12">
          <h1 className="mb-4 text-6xl font-light">
            My{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
              Tickets
            </span>
          </h1>
          <p className="text-lg text-gray-400">
            Manage and track all of your support requests in one place.
          </p>
        </header>

        <div className="mb-8 rounded-2xl border border-gray-800/50 bg-gray-900/20 p-6 backdrop-blur-xl">
          <TicketToolbar
            query={searchQuery}
            onQueryChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>

        <div className="mb-8">
          <TicketStatsGrid
            stats={derivedStats}
            isLoading={isLoadingList && tickets.length === 0}
          />
        </div>

        <TicketTable
          tickets={paginatedTickets}
          page={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
          onSelect={handleSelectTicket}
          isLoading={isLoadingList}
        />
      </div>

      <TicketDetailDrawer
        ticket={selectedTicket}
        isOpen={isDrawerOpen}
        isLoading={isLoadingDetail}
        isSending={isSendingMessage}
        onClose={handleCloseDrawer}
        onSendMessage={handleSendMessage}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
};

export default MyTicket;




import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  Trash2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

type FilterType =
  | "all"
  | "unread"
  | "read"
  | "info"
  | "warning"
  | "success"
  | "error";

const NotificationPage = () => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markManyAsRead,
    deleteNotification,
    deleteMany,
  } = useNotifications();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>(
    []
  );
  const notificationsPerPage = 5;

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  useEffect(() => {
    setSelectedNotifications((prev) =>
      prev.filter((id) => notifications.some((notif) => notif.id === id))
    );
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return notifications.filter((notif) => {
      const matchesFilter = (() => {
        if (filterType === "all") return true;
        if (filterType === "unread") return !notif.seen;
        if (filterType === "read") return notif.seen;
        return (notif.type ?? "").toLowerCase() === filterType.toLowerCase();
      })();

      if (!matchesFilter) return false;
      if (!query) return true;

      const haystack = `${notif.title ?? ""} ${notif.message ?? ""} ${
        notif.type ?? ""
      } ${notif.event ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [notifications, filterType, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / notificationsPerPage)
  );
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + notificationsPerPage
  );

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "success":
        return "text-emerald-400";
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-red-400";
      case "info":
      default:
        return "text-cyan-400";
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedNotifications.length === currentNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(currentNotifications.map((notif) => notif.id));
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch {
      // Error toast handled in context
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const ids = filteredNotifications.filter((n) => !n.seen).map((n) => n.id);
      if (!ids.length) return;
      await markManyAsRead(ids);
      setSelectedNotifications([]);
    } catch {
      // handled in context
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await deleteNotification(id);
      setSelectedNotifications((prev) => prev.filter((nId) => nId !== id));
    } catch {
      // handled in context
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedNotifications.length) return;
    try {
      await deleteMany(selectedNotifications);
      setSelectedNotifications([]);
    } catch {
      // handled in context
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = 0;
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <div
        className="fixed inset-0 opacity-30 transition-all duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`,
        }}
      />

      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-light mb-2">
                My <span className="text-cyan-400">Notifications</span>
              </h1>
              <p className="text-gray-400 font-light">
                Manage and track all your notifications in one place
              </p>
            </div>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <div className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg backdrop-blur-sm">
                  <span className="text-cyan-400 font-light">
                    {unreadCount} unread
                  </span>
                </div>
              )}
              <button
                onClick={handleMarkAllAsRead}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-light transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark All Read
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 font-light focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={`px-4 py-2 rounded-lg font-light transition-all duration-300 flex items-center gap-2 ${
                  showFilters
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              {["all", "unread", "read"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter as FilterType)}
                  className={`px-4 py-2 rounded-lg font-light transition-all duration-300 capitalize ${
                    filterType === filter
                      ? "bg-cyan-500 text-white"
                      : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-800/50">
              <p className="text-sm text-gray-400 font-light mb-3">
                Filter by type
              </p>
              <div className="flex flex-wrap gap-2">
                {["info", "success", "warning", "error"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type as FilterType)}
                    className={`px-4 py-2 rounded-lg font-light transition-all duration-300 flex items-center gap-2 capitalize ${
                      filterType === type
                        ? "bg-cyan-500 text-white"
                        : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                    }`}
                  >
                    {getTypeIcon(type)}
                    {type}
                  </button>
                ))}
                <button
                  onClick={() => setFilterType("all")}
                  className="px-4 py-2 rounded-lg font-light bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-gray-900/40 border border-gray-800/60 rounded-lg font-light text-gray-300 hover:border-cyan-400/40 hover:text-cyan-300 transition-colors"
            >
              {selectedNotifications.length === currentNotifications.length
                ? "Unselect all"
                : "Select all"}
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedNotifications.length === 0}
              className={`px-4 py-2 rounded-lg font-light flex items-center gap-2 transition-all duration-300 ${
                selectedNotifications.length === 0
                  ? "bg-gray-900/40 text-gray-600 border border-gray-800/60 cursor-not-allowed"
                  : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Delete selected
            </button>
          </div>
          <span className="text-sm text-gray-500 font-light">
            {filteredNotifications.length} notifications found
          </span>
        </div>

        <div
          ref={listRef}
          className="space-y-4 max-h-[520px] overflow-y-auto pr-1"
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-cyan-400" />
              </div>
              <p className="text-gray-400 font-light text-lg">
                No notifications found
              </p>
              <p className="text-sm text-gray-500 font-light mt-2">
                Try adjusting filters or check back later for updates.
              </p>
            </div>
          ) : (
            currentNotifications.map((notif, index) => {
              const isSelected = selectedNotifications.includes(notif.id);
              const typeColor = getTypeColor(notif.type);
              const category = notif.event ?? notif.type ?? "general";
              return (
                <div
                  key={notif.id}
                  className={`bg-gray-900/30 backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 hover:bg-gray-900/50 ${
                    notif.seen ? "border-gray-800/50" : "border-cyan-500/30"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <button onClick={() => toggleSelection(notif.id)} className="mt-1">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-cyan-500 border-cyan-500"
                            : "border-gray-700 hover:border-gray-500"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>

                    <div className={`${typeColor} mt-1`}>
                      {getTypeIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3
                          className={`font-light text-lg ${
                            notif.seen ? "text-gray-300" : "text-white"
                          }`}
                        >
                          {notif.title}
                          {!notif.seen && (
                            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full ml-2" />
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-light whitespace-nowrap">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                      <p className="text-gray-400 font-light mb-3 whitespace-pre-line">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-400 font-light capitalize">
                          {category}
                        </span>
                        {notif.link && (
                          <a
                            href={notif.link}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-light"
                          >
                            View details
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                      {!notif.seen && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-5 h-5 text-cyan-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 border border-red-500/40 bg-red-500/10 text-sm text-red-300 rounded-lg font-light">
            {error}
          </div>
        )}

        {filteredNotifications.length > 0 && (
          <div className="mt-8 flex items-center justify-between bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
            <p className="text-gray-400 font-light">
              Showing {startIndex + 1} to{" "}
              {Math.min(
                startIndex + notificationsPerPage,
                filteredNotifications.length
              )}{" "}
              of {filteredNotifications.length} notifications
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  currentPage === 1
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-gray-300 hover:bg-gray-800/50 hover:text-cyan-400"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-4 py-2 rounded-lg font-light transition-all duration-300 ${
                    currentPage === index + 1
                      ? "bg-cyan-500 text-white"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-cyan-400"
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  currentPage === totalPages
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-gray-300 hover:bg-gray-800/50 hover:text-cyan-400"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
          border-radius: 20px;
        }

        .scrollbar-thin:hover::-webkit-scrollbar-thumb {
          background-color: rgba(6, 182, 212, 0.3);
        }
      `}</style>
    </div>
  );
};

export default NotificationPage;

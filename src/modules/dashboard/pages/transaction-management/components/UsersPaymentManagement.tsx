import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Activity,
    ArrowLeft,
    BarChart3,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ClipboardCopy,
    Eye,
    Filter,
    Loader2,
    Search,
    TrendingDown,
    TrendingUp,
    X,
    XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { AdminTransactionSummary, Transaction, TransactionStaus } from "../types/model";
import {
    getAdminTransactionSummaryAPI,
    getAdminTransactionsAPI
} from "../services/payment";
import { ROUTES } from "@/constant/routes";
import showToast from "@/utils/toast";

const ITEMS_PER_PAGE = 12;
const DEFAULT_SUMMARY: AdminTransactionSummary = {
    totalCount: 0,
    totalVolume: 0,
    creditVolume: 0,
    debitVolume: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0
};

const statusOptions: TransactionStaus[] = ["ALL", "COMPLETED", "ACTIVE", "FAILED", "CANCELED"];
const paymentMethodOptions = ["ALL", "VNPAY", "STRIPE", "PAYOS", "ACCOUNT_BALANCE", "OTHER"];
const typeOptions = ["ALL", "CREDIT", "DEBIT"];

const UsersPaymentManagement: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<AdminTransactionSummary>(DEFAULT_SUMMARY);
    const [selectedStatus, setSelectedStatus] = useState<TransactionStaus>("ALL");
    const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const navigate = useNavigate();

    const filters = useMemo(() => ({
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        paymentMethod: selectedMethod !== "ALL" ? selectedMethod : undefined,
        type: selectedType !== "ALL" ? selectedType : undefined,
        search: searchTerm || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined
    }), [selectedStatus, selectedMethod, selectedType, searchTerm, dateFrom, dateTo]);

    const fetchSummary = useCallback(async () => {
        setIsSummaryLoading(true);
        try {
            const response = await getAdminTransactionSummaryAPI({
                status: filters.status,
                paymentMethod: filters.paymentMethod,
                type: filters.type,
                from: filters.from,
                to: filters.to
            });
            setSummary({
                ...DEFAULT_SUMMARY,
                ...(response ?? {})
            });
        } catch (error) {
            console.error("Failed to load admin transaction summary", error);
            setSummary(DEFAULT_SUMMARY);
        } finally {
            setIsSummaryLoading(false);
        }
    }, [filters.status, filters.paymentMethod, filters.type, filters.from, filters.to]);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getAdminTransactionsAPI({
                page: currentPage - 1,
                size: ITEMS_PER_PAGE,
                ...filters
            });
            setTransactions(response?.content ?? []);
            setTotalResults(response?.totalElements ?? 0);
        } catch (error) {
            console.error("Failed to load transactions", error);
            setTransactions([]);
            setTotalResults(0);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, filters]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const totalPages = Math.max(1, Math.ceil(totalResults / ITEMS_PER_PAGE));
    const rangeStart = totalResults === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const rangeEnd = totalResults === 0
        ? 0
        : Math.min((currentPage - 1) * ITEMS_PER_PAGE + transactions.length, totalResults);

    const formatAmount = (value: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value ?? 0);

    const formatDate = (dateString: string) => {
        if (!dateString) return "--";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusBadge = (status?: string) => {
        const palette: Record<string, string> = {
            COMPLETED: "bg-emerald-400/10 text-emerald-300 border-emerald-400/40",
            ACTIVE: "bg-amber-400/10 text-amber-300 border-amber-400/40",
            FAILED: "bg-rose-400/10 text-rose-300 border-rose-400/40",
            CANCELED: "bg-gray-500/10 text-gray-300 border-gray-500/40",
            EXPIRED: "bg-gray-500/10 text-gray-300 border-gray-500/40"
        };
        const labels: Record<string, string> = {
            COMPLETED: "Success",
            ACTIVE: "Pending",
            FAILED: "Failed",
            CANCELED: "Canceled",
            EXPIRED: "Expired"
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${palette[status ?? ""] ?? "bg-gray-700/20 text-gray-300 border-gray-600/40"}`}>
                {labels[status ?? ""] ?? status ?? "Unknown"}
            </span>
        );
    };

    const successRate = summary.totalCount === 0 ? 0 : (summary.successCount / summary.totalCount) * 100;
    const failureRate = summary.totalCount === 0 ? 0 : (summary.failedCount / summary.totalCount) * 100;
    const avgTicket = summary.totalCount === 0 ? 0 : summary.totalVolume / summary.totalCount;

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value)
            .then(() => showToast("success", "Copied to clipboard"))
            .catch(() => showToast("error", "Failed to copy"));
    };

    const handleResetFilters = () => {
        setSelectedStatus("ALL");
        setSelectedMethod("ALL");
        setSelectedType("ALL");
        setSearchTerm("");
        setDateFrom("");
        setDateTo("");
    };

    const handleOpenCheckout = (checkoutId?: string) => {
        if (!checkoutId) return;
        navigate(ROUTES.CHECKOUT.getPath(checkoutId));
    };

    return (
        <div className="relative min-h-screen bg-gray-950 text-white">
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(circle at top, rgba(6,182,212,0.25), transparent 60%)"
                }}
            />
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-8">
                <header className="flex flex-col gap-3">
                    <p className="text-sm uppercase tracking-[0.3em] text-gray-500 font-light">Administration</p>
                    <h1 className="text-4xl md:text-5xl font-light text-white">
                        Global <span className="text-cyan-400">Payment Intelligence</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl">
                        Monitor every transaction across the platform, understand cashflow health, and drill into each payment with precision.
                    </p>
                </header>

                <section className="bg-gray-900/30 border border-gray-800/60 rounded-2xl p-6 backdrop-blur-lg space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-xl text-gray-300 text-sm">
                            <Filter className="w-4 h-4 text-cyan-400" />
                            Advanced Filters
                        </div>
                        <div className="flex flex-wrap gap-3 flex-1">
                            <input
                                type="text"
                                placeholder="Search transactions, descriptions, methods..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 min-w-[220px] bg-gray-900/60 border border-gray-800/70 rounded-xl px-4 py-2 text-sm focus:border-cyan-500 focus:ring-0"
                            />
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as TransactionStaus)}
                                className="bg-gray-900/60 border border-gray-800/70 rounded-xl px-4 py-2 text-sm focus:border-cyan-500"
                            >
                                {statusOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <select
                                value={selectedMethod}
                                onChange={(e) => setSelectedMethod(e.target.value)}
                                className="bg-gray-900/60 border border-gray-800/70 rounded-xl px-4 py-2 text-sm focus:border-cyan-500"
                            >
                                {paymentMethodOptions.map(option => (
                                    <option key={option} value={option}>{option.replace("_", " ")}</option>
                                ))}
                            </select>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="bg-gray-900/60 border border-gray-800/70 rounded-xl px-4 py-2 text-sm focus:border-cyan-500"
                            >
                                {typeOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/50 border border-gray-800/70 text-sm text-gray-400">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            <span>Date Range</span>
                        </div>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-gray-900/60 border border-gray-800/70 rounded-xl px-4 py-2 text-sm focus:border-cyan-500"
                        />
                        <span className="text-gray-500 text-sm">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-gray-900/60 border border-gray-800/70 rounded-xl px-4 py-2 text-sm focus:border-cyan-500"
                        />
                        <button
                            onClick={handleResetFilters}
                            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/50 border border-gray-700/50 text-sm text-gray-300 hover:text-white hover:border-cyan-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Clear filters
                        </button>
                    </div>
                </section>
                {isSummaryLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        Updating summary…
                    </div>
                )}

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                        { label: "Total Volume", value: formatAmount(summary.totalVolume), icon: BarChart3, accent: "from-cyan-500/20 to-cyan-600/20", text: "text-cyan-300" },
                        { label: "Success Rate", value: `${successRate.toFixed(1)}%`, icon: CheckCircle, accent: "from-emerald-500/20 to-emerald-600/20", text: "text-emerald-300" },
                        { label: "Failure Rate", value: `${failureRate.toFixed(1)}%`, icon: XCircle, accent: "from-rose-500/20 to-rose-600/20", text: "text-rose-300" },
                        { label: "AVG Ticket Size", value: formatAmount(avgTicket), icon: Activity, accent: "from-indigo-500/20 to-indigo-600/20", text: "text-indigo-300" }
                    ].map((card, idx) => (
                        <div key={idx} className="bg-gray-900/40 border border-gray-800/70 rounded-2xl p-5 flex flex-col gap-3">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.accent} flex items-center justify-center`}>
                                <card.icon className={`w-5 h-5 ${card.text}`} />
                            </div>
                            <p className="text-gray-400 text-sm">{card.label}</p>
                            <p className="text-3xl font-light">{card.value}</p>
                        </div>
                    ))}
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[
                        { label: "Successful Payments", value: summary.successCount, sub: "Captured & settled", icon: TrendingUp, tint: "text-emerald-300" },
                        { label: "Pending Payments", value: summary.pendingCount, sub: "Awaiting completion", icon: Activity, tint: "text-amber-300" },
                        { label: "Failed Payments", value: summary.failedCount, sub: "Rejected or expired", icon: TrendingDown, tint: "text-rose-300" }
                    ].map((metric, idx) => (
                        <div key={idx} className="bg-gray-900/30 border border-gray-800/60 rounded-2xl p-5 flex items-center gap-4">
                            <div className="bg-gray-800/50 rounded-2xl p-3">
                                <metric.icon className={`w-5 h-5 ${metric.tint}`} />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">{metric.label}</p>
                                <p className="text-2xl font-light">{metric.value.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{metric.sub}</p>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="bg-gray-900/30 border border-gray-800/60 rounded-2xl overflow-hidden backdrop-blur-lg">
                    <header className="px-6 py-5 border-b border-gray-800/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-light">Unified Transaction Ledger</h2>
                            <p className="text-gray-500 text-sm">Real-time feed of every payment event</p>
                        </div>
                        <span className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-sm">
                            {summary.totalCount.toLocaleString()} transactions observed
                        </span>
                    </header>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-900/40 text-gray-400 uppercase text-xs tracking-wide">
                                <tr>
                                    <th className="px-5 py-3 text-left">Transaction</th>
                                    <th className="px-5 py-3 text-left">Type</th>
                                    <th className="px-5 py-3 text-left">Description</th>
                                    <th className="px-5 py-3 text-left">Amount</th>
                                    <th className="px-5 py-3 text-left">Method</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-left">Created</th>
                                    <th className="px-5 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                                                Loading transactions...
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-16 text-center text-gray-500">
                                            <Search className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                                            No transactions found with current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-900/30 transition-colors">
                                            <td className="px-5 py-4 font-mono text-xs text-gray-300">
                                                <button
                                                    className="flex items-center gap-2 text-cyan-300 hover:text-white"
                                                    onClick={() => handleCopy(transaction.id)}
                                                >
                                                    {transaction.id.slice(0, 12)}...
                                                    <ClipboardCopy className="w-3 h-3" />
                                                </button>
                                            </td>
                                            <td className="px-5 py-4 text-gray-300">{transaction.type}</td>
                                            <td className="px-5 py-4 text-gray-400 max-w-xs">
                                                {transaction.description || "--"}
                                            </td>
                                            <td className={`px-5 py-4 font-medium ${transaction.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                                                {formatAmount(transaction.amount)}
                                            </td>
                                            <td className="px-5 py-4 text-gray-300">
                                                {transaction.paymentMethod || transaction.sourceType || "--"}
                                            </td>
                                            <td className="px-5 py-4">
                                                {getStatusBadge(transaction.status)}
                                            </td>
                                            <td className="px-5 py-4 text-gray-400">
                                                {formatDate(transaction.createdAt)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setSelectedTransaction(transaction)}
                                                        className="p-2 rounded-xl border border-gray-700/60 text-gray-300 hover:text-white hover:border-cyan-400 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {transaction.checkoutId && (
                                                        <button
                                                            onClick={() => handleOpenCheckout(transaction.checkoutId)}
                                                            className="p-2 rounded-xl border border-gray-700/60 text-gray-300 hover:text-white hover:border-cyan-400 transition-colors"
                                                        >
                                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <footer className="px-6 py-4 border-t border-gray-800/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-400">
                        <div>
                            Showing {rangeStart} - {rangeEnd} of {totalResults} results
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-gray-800/60 hover:border-cyan-400 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 rounded-xl border transition-all ${page === currentPage
                                                ? "border-cyan-400 bg-cyan-500/10 text-white"
                                                : "border-gray-800/60 text-gray-400 hover:border-cyan-400"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border border-gray-800/60 hover:border-cyan-400 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </footer>
                </section>

            </div>

            {selectedTransaction && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 flex items-center justify-center px-4">
                    <div className="bg-gray-950 border border-gray-800 max-w-lg w-full rounded-3xl shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Transaction Detail</p>
                                <h3 className="text-2xl font-light text-white">#{selectedTransaction.id.slice(0, 8)}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="p-2 rounded-full hover:bg-gray-800/70 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Amount</span>
                                <span className={`text-lg font-light ${selectedTransaction.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                                    {formatAmount(selectedTransaction.amount)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Status</span>
                                {getStatusBadge(selectedTransaction.status)}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Payment Method</span>
                                <span className="text-gray-300">{selectedTransaction.paymentMethod || "--"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Type</span>
                                <span className="text-gray-300">{selectedTransaction.type}</span>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Description</p>
                                <p className="text-gray-300">{selectedTransaction.description || "No description available."}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Created at</span>
                                <span className="text-gray-300">{formatDate(selectedTransaction.createdAt)}</span>
                            </div>
                            {selectedTransaction.checkoutId && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Checkout Session</span>
                                    <button
                                        className="text-cyan-400 hover:text-white flex items-center gap-2"
                                        onClick={() => {
                                            handleCopy(selectedTransaction.checkoutId);
                                            handleOpenCheckout(selectedTransaction.checkoutId);
                                        }}
                                    >
                                        {selectedTransaction.checkoutId.slice(0, 10)}...
                                        <ClipboardCopy className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="px-5 py-2 rounded-xl bg-gray-800/50 border border-gray-700/70 text-gray-300 hover:text-white hover:border-cyan-400"
                            >
                                Close
                            </button>
                            {selectedTransaction.checkoutId && (
                                <button
                                    onClick={() => handleOpenCheckout(selectedTransaction.checkoutId)}
                                    className="px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400 text-cyan-300 hover:text-white hover:bg-cyan-500/20"
                                >
                                    View Checkout
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPaymentManagement;

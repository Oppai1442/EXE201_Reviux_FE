import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    Bell,
    Shield,
    X,
    DollarSign,
    Wallet,
    Eye,
    RefreshCw,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
    Plus
} from 'lucide-react';

import WalletTopupModal from "../modal/TopupModal";
import { generateCheckoutTopupAPI, getMyTransactionHistroyAPI, getMyTransactionSummaryAPI } from "../services/payment";
import { getWalletBalanceAPI } from "@/modules/checkout/services/checkout";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constant/routes";
import showToast from "@/utils/toast";

const MyPaymentManagement = () => {
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [visibleSections, setVisibleSections] = useState(new Set());
    const [openTopup, setOpenTopup] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [totalResult, setTotalResult] = useState(0);
    const [summary, setSummary] = useState({
        failedCount: 0,
        pendingCount: 0,
        successCount: 0,
        totalAmount: 0
    });
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('success', 'Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showToast('error', 'Failed to copy!');
        });
    };

    const fetchTransactionHistory = useCallback(async () => {
        try {
            const response = await getMyTransactionHistroyAPI(currentPage - 1, itemsPerPage, searchTerm, selectedStatus);
            setTransactions(response?.content ?? []);
            setTotalResult(response?.totalElements ?? 0);
        } catch (error) {
            console.error('Failed to fetch transaction history', error);
        }
    }, [currentPage, itemsPerPage, searchTerm, selectedStatus]);

    useEffect(() => {
        fetchTransactionHistory();
    }, [fetchTransactionHistory]);

    const fetchInitData = useCallback(async () => {
        try {
            const [transactionSummary, balance] = await Promise.all([
                getMyTransactionSummaryAPI(),
                getWalletBalanceAPI(),
            ]);

            setSummary((transactionSummary as { failedCount: number; pendingCount: number; successCount: number; totalAmount: number }) ?? {
                failedCount: 0,
                pendingCount: 0,
                successCount: 0,
                totalAmount: 0
            });
            setWalletBalance(typeof balance === "number" ? balance : null);
        } catch (error) {
            console.error('Failed to fetch initial transaction data', error);
            setWalletBalance(null);
        }
    }, []);

    useEffect(() => {
        fetchInitData();
    }, [fetchInitData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStatus, searchTerm]);

    const Deposit = async (amount) => {
        try {
            const response = await generateCheckoutTopupAPI({ amount });
            navigate(ROUTES.CHECKOUT.getPath(response.sessionId));
        } catch (error) {
            console.error('Create deposit failed', error);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisibleSections(prev => new Set([...prev, entry.target.dataset.section]));
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            const matchesStatus = selectedStatus === 'ALL' || transaction.status === selectedStatus;
            const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [transactions, selectedStatus, searchTerm]);

    const totalPages = Math.ceil(totalResult / itemsPerPage);
    const currentTransactions = filteredTransactions;
    const rangeStart = totalResult === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const rangeEnd = totalResult === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + currentTransactions.length, totalResult);

    const getStatusBadge = (status) => {
        const statusConfig = {
            COMPLETED: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
            ACTIVE: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
            FAILED: 'bg-red-400/10 text-red-400 border-red-400/30',
            EXPIRED: 'bg-gray-500/10 text-gray-300 border-gray-500/30'
        };

        const statusText = {
            COMPLETED: 'Success',
            ACTIVE: 'Pending',
            FAILED: 'Failed',
            EXPIRED: 'Expired'
        };

        const badgeClass = statusConfig[status] ?? 'bg-gray-700/10 text-gray-300 border-gray-700/30';
        const label = statusText[status] ?? status ?? 'Unknown';

        return (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-light border ${badgeClass}`}>
                {label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const handleRefreshTransactions = useCallback(async () => {
        await fetchTransactionHistory();
    }, [fetchTransactionHistory]);

    const handleOpenCheckout = (checkoutId?: string) => {
        if (!checkoutId) return;
        navigate(ROUTES.CHECKOUT.getPath(checkoutId));
    };

    return (
        <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden">
            {/* Dynamic gradient background */}
            <div
                className="fixed inset-0 opacity-20 transition-all duration-700 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, #06b6d4 0%, transparent 50%)`
                }}
            />

            {/* Grid pattern */}
            <div
                className="fixed inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                    transform: `translateY(${mousePosition.y * 0.05}px)`
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div
                    data-section="header"
                    className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-1000 ${visibleSections.has('header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}
                >
                    <div>
                        <h1 className="text-5xl md:text-6xl font-light mb-3">
                            <span className="text-white">Transaction </span>
                            <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Management</span>
                        </h1>
                        <p className="text-gray-400 font-light text-lg">Track and manage your transaction history</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="group px-6 py-3 bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl text-white font-light hover:border-cyan-400/50 hover:text-cyan-400 transition-all duration-300 flex items-center gap-2">
                            <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                            Export Report
                        </button>
                        <button
                            onClick={() => setOpenTopup(true)}
                            disabled
                            title="The project will stop working soon, the feature unavailable"
                            className="group px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl font-light transition-all duration-300 shadow-lg shadow-cyan-500/30 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                            New Transaction
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div
                    data-section="stats"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                >
                    {[
                        { label: 'Account Balance', value: walletBalance !== null ? formatAmount(walletBalance) : '--', icon: Wallet, color: 'cyan' },
                        { label: 'Total Amount', value: formatAmount(summary.totalAmount), icon: DollarSign, color: 'cyan' },
                        { label: 'Successful', value: summary.successCount, icon: Shield, color: 'cyan' },
                        { label: 'Failed', value: summary.failedCount, icon: X, color: 'red' },
                        { label: 'Pending', value: summary.pendingCount, icon: Bell, color: 'yellow' }
                    ].map((stat, index) => (
                        <div
                            key={index}
                            className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-cyan-400/50 hover:scale-105 transition-all duration-300 group ${visibleSections.has('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color === 'cyan' ? 'from-cyan-500/20 to-cyan-600/20 border-cyan-400/30' :
                                        stat.color === 'red' ? 'from-red-500/20 to-red-600/20 border-red-400/30' :
                                            'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30'
                                    } border rounded-xl flex items-center justify-center shadow-lg ${stat.color === 'cyan' ? 'shadow-cyan-500/20' :
                                        stat.color === 'red' ? 'shadow-red-500/20' :
                                            'shadow-yellow-500/20'
                                    } group-hover:shadow-${stat.color}-500/40 transition-all duration-300`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color === 'cyan' ? 'text-cyan-400' :
                                            stat.color === 'red' ? 'text-red-400' :
                                                'text-yellow-400'
                                        }`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm font-light mb-1">{stat.label}</p>
                                <p className="text-3xl font-light text-white">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Transactions Table */}
                <div
                    data-section="table"
                    className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden transition-all duration-1000 ${visibleSections.has('table') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}
                >
                    <div className="px-6 py-5 border-b border-gray-800/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-light text-white">
                                Recent <span className="text-cyan-400">Transactions</span>
                            </h2>
                            <span className="px-3 py-1.5 bg-cyan-400/10 border border-cyan-400/30 rounded-lg text-sm text-cyan-400 font-light">
                                {totalResult} results
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-800/20">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-light text-gray-400 uppercase tracking-wider">Transaction ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-light text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-light text-gray-400 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-left text-xs font-light text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-light text-gray-400 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-4 text-left text-xs font-light text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-light text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-light text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/30">
                                {currentTransactions.length > 0 ? (
                                    currentTransactions.map((transaction, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-800/20 transition-all duration-300 group"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-light">
                                                {transaction.id.length > 13 ? (
                                                    <abbr title={transaction.id} onClick={() => handleCopyToClipboard(transaction.id)} className="cursor-pointer hover:text-cyan-400 transition-colors duration-300">
                                                        {transaction.id.substring(0, 13)}...
                                                    </abbr>
                                                ) : (
                                                    transaction.id
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light">{transaction.type}</td>
                                            <td className="px-6 py-4 text-sm text-gray-300 font-light max-w-xs">
                                                {transaction.description.length > 30 ? (
                                                    <abbr title={transaction.description} onClick={() => handleCopyToClipboard(transaction.description)} className="cursor-pointer hover:text-cyan-400 transition-colors duration-300">
                                                        {transaction.description.substring(0, 30)}...
                                                    </abbr>
                                                ) : (
                                                    transaction.description
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-light ${transaction.amount > 0 ? 'text-cyan-400' : 'text-red-400'
                                                }`}>
                                                {formatAmount(transaction.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light">{transaction.paymentMethod}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(transaction.status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-light">{formatDate(transaction.createdAt)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    {transaction.checkoutId && (
                                                        <button
                                                            onClick={() => handleOpenCheckout(transaction.checkoutId)}
                                                            className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg border border-transparent hover:border-cyan-400/30 transition-all duration-300"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={handleRefreshTransactions}
                                                        className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg border border-transparent hover:border-cyan-400/30 transition-all duration-300"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-cyan-400/10 border border-cyan-400/30 rounded-2xl flex items-center justify-center">
                                                    <Search className="h-8 w-8 text-cyan-400" />
                                                </div>
                                                <p className="text-gray-400 text-lg font-light">No transactions found</p>
                                                <p className="text-gray-500 text-sm font-light">Try changing your filters or search terms</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-400 font-light">
                                Showing {rangeStart} - {rangeEnd} of {totalResult} transactions
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 border border-gray-800/50 hover:border-cyan-400/50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-4 py-2 rounded-lg text-sm font-light transition-all duration-300 ${page === currentPage
                                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                                                    : 'bg-gray-800/30 text-gray-300 hover:bg-gray-800/50 hover:text-white border border-gray-800/50 hover:border-cyan-400/50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 border border-gray-800/50 hover:border-cyan-400/50"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
            
            <WalletTopupModal
                isOpen={openTopup}
                onClose={() => setOpenTopup(false)}
                onConfirm={(amount) => Deposit(amount)}
            />
        </div>
    );
};

export default MyPaymentManagement;

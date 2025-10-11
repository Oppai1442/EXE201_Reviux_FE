import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    Bell,
    Shield,
    X,
    DollarSign,
    Eye,
    RefreshCw,
    Download,
    Search,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import WalletTopupModal from "../modal/TopupModal";
import { generateCheckoutTopupAPI, getMyTransactionHistroyAPI, getMyTransactionSummaryAPI } from "../services/payment";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constant/routes";
import type { Transaction, TransactionStaus } from "../types";

const MyPaymentManagement: React.FC = () => {
    const [selectedStatus, setSelectedStatus] = useState<TransactionStaus>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [openTopup, setOpenTopup] = useState(false);
    const [transactions2, setTransactions] = useState<Transaction[]>([]);
    const [totalResult, setTotalResult] = useState(0)
    const [summary, setSummary] = useState<{
        failedCount: number,
        pendingCount: number,
        successCount: number,
        totalAmount: number
    }>({
        failedCount: 0,
        pendingCount: 0,
        successCount: 0,
        totalAmount: 0
    })
    const navigate = useNavigate()

    // Mock data for demonstration
    useEffect(() => {
        const updateTransactionHistory = async () => {
            const response = await getMyTransactionHistroyAPI(currentPage - 1, itemsPerPage, searchTerm, selectedStatus);
            setTransactions(response.content)
            setTotalResult(response.totalElements)
        }

        updateTransactionHistory()
    }, [currentPage]);

    const fetchInitData = useCallback(async () => {
        try {
            const [r1, transactionSummary] = await Promise.all([
                getMyTransactionHistroyAPI(currentPage - 1, itemsPerPage),
                getMyTransactionSummaryAPI(),
            ]);
            
            setTransactions(r1.content)
            setTotalResult(r1.totalElements)
            
            setSummary(transactionSummary)
        } catch (error) {
        }
    }, [])

    useEffect(() => {
        fetchInitData()
    }, [fetchInitData])

    const Deposit = async (amount: number) => {
        try {
            const response = await generateCheckoutTopupAPI({ amount })
            navigate(ROUTES.CHECKOUT.getPath(response.sessionId))
        } catch (err) {
            console.error("Create deposit failed")
        }
    }

    // Filter and search logic
    const filteredTransactions = useMemo(() => {
        return transactions2.filter(transaction => {
            const matchesStatus = selectedStatus === 'ALL' || transaction.status === selectedStatus;
            const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [transactions2, selectedStatus, searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(totalResult / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = filteredTransactions;

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedStatus, searchTerm]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const getStatusBadge = (status: TransactionStaus) => {
        const statusConfig: Record<string, string> = {
            SUCCESS: 'bg-green-500/20 text-green-300 border border-green-500/30',
            PENDING: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
            FAILED: 'bg-red-500/20 text-red-300 border border-red-500/30'
        };

        const statusText: Record<string, string> = {
            SUCCESS: 'Thành công',
            PENDING: 'Đang xử lý',
            FAILED: 'Thất bại'
        };

        const config = statusConfig[status] ?? 'bg-gray-700/20 text-gray-400 border border-gray-700/30';
        const text = statusText[status] ?? status;

        return (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${config}`}>
                {text}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const renderPaginationButtons = () => {
        const buttons = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${i === currentPage
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white border border-gray-700 hover:border-gray-600'
                        }`}
                >
                    {i}
                </button>
            );
        }

        return buttons;
    };

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2 pb-2">
                            Payment Management
                        </h1>
                        <p className="text-gray-400">Quản lý và theo dõi các giao dịch thanh toán</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-6 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl text-white hover:border-gray-700 hover:bg-gray-800/50 transition-all duration-300 flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Xuất báo cáo
                        </button>
                        <button
                            onClick={() => setOpenTopup(true)}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25">
                            Thêm giao dịch
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                                <DollarSign className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Tổng cộng</p>
                            <p className="text-3xl font-bold text-white">{formatAmount(summary!.totalAmount)}</p>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Giao dịch thành công</p>
                            <p className="text-3xl font-bold text-white">{summary!.successCount}</p>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                                <X className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Giao dịch thất bại</p>
                            <p className="text-3xl font-bold text-white">{summary!.failedCount}</p>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                                <Bell className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Đang chờ xử lý</p>
                            <p className="text-3xl font-bold text-white">{summary!.pendingCount}</p>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold text-white">Giao dịch gần đây</h2>
                            <span className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-300">
                                {totalResult} kết quả
                            </span>
                        </div>
{/* 
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm giao dịch..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-gray-800/50 border border-gray-700 rounded-xl px-10 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                                />
                            </div>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="COMPLETED">Thành công</option>
                                <option value="ACTIVE">Đang xử lý</option>
                                <option value="CANCELED">Đã hủy</option>
                                <option value="FAILED">Thất bại</option>
                            </select>
                        </div> */}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-800/30">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID Giao dịch</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Loại</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Mô tả</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Số tiền</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phương thức</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ngày tạo</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {currentTransactions.length > 0 ? (
                                    currentTransactions.map((transaction, index) => (
                                        <tr key={index} className="hover:bg-gray-800/30 transition-all duration-200 group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                                {transaction.id.length > 13 ? (
                                                    <abbr title={transaction.id} className="cursor-help">
                                                        {transaction.id.substring(0, 13)}...
                                                    </abbr>
                                                ) : (
                                                    transaction.id
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.type}</td>
                                            <td className="px-6 py-4 text-sm text-gray-300 max-w-xs">
                                                {transaction.description.length > 30 ? (
                                                    <abbr title={transaction.description} className="cursor-help">
                                                        {transaction.description.substring(0, 30)}...
                                                    </abbr>
                                                ) : (
                                                    transaction.description
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">{formatAmount(transaction.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.paymentMethod}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(transaction.status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(transaction.createdAt)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    {transaction.checkoutId && (<button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200">
                                                        <Eye className="h-4 w-4" />
                                                    </button>)}
                                                    <button className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-all duration-200">
                                                        <RefreshCw className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Search className="h-12 w-12 text-gray-600" />
                                                <p className="text-gray-400 text-lg">Không tìm thấy giao dịch nào</p>
                                                <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-400">
                            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {(currentPage - 1) * itemsPerPage + filteredTransactions.length} trong tổng số {totalResult} giao dịch
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-700 hover:border-gray-600"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <div className="flex items-center gap-1">
                                {renderPaginationButtons()}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-gray-700 hover:border-gray-600"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                <WalletTopupModal
                    isOpen={openTopup}
                    onClose={() => setOpenTopup(false)}
                    onConfirm={(amount) => Deposit(amount)}
                />
            </div>
        </div>
    );
}

export default MyPaymentManagement;
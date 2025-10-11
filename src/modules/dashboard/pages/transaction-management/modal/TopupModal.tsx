import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

type WalletTopupModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => Promise<void>;
};

const WalletTopupModal: React.FC<WalletTopupModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        const value = parseFloat(amount);
        if (!amount || value <= 0) return;

        setIsLoading(true);
        await onConfirm(value);
        setIsLoading(false);
        setAmount('');
        onClose();
    };

    const formatCurrency = (value: string) => {
        if (!value) return '';
        const numValue = parseFloat(value);
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(numValue);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-red-500/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Top up wallet
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-gray-800/50 hover:bg-gray-700 rounded-xl flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-white mb-3">
                            Enter amount to top up
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount..."
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                                min="0"
                                step="1000"
                            />
                        </div>
                        {amount && (
                            <p className="mt-2 text-sm text-gray-400">
                                Amount: {formatCurrency(amount)}
                            </p>
                        )}
                    </div>

                    {/* Quick select */}
                    <div>
                        <p className="text-sm font-medium text-white mb-3">Or quick select:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[5, 10, 20, 50, 100, 500].map((quickAmount) => (
                                <button
                                    key={quickAmount}
                                    onClick={() => setAmount(quickAmount.toString())}
                                    className="px-3 py-2 bg-gray-800/50 hover:bg-gray-700 border border-gray-700 hover:border-red-500/50 rounded-lg text-sm font-medium text-white"
                                >
                                    {new Intl.NumberFormat('en-US').format(quickAmount)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                        className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${!amount || parseFloat(amount) <= 0 || isLoading
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-red-500/25'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processing...
                            </div>
                        ) : (
                            'Confirm top-up'
                        )}
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-400 text-center">
                        The amount will be added to your wallet immediately after confirmation.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WalletTopupModal;

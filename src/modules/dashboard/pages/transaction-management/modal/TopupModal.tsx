import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Sparkles } from 'lucide-react';

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
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (modalRef.current) {
                const rect = modalRef.current.getBoundingClientRect();
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isOpen]);

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
        <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div 
                ref={modalRef}
                className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8 w-full max-w-lg shadow-2xl overflow-hidden"
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Mouse-following gradient */}
                <div 
                    className="absolute inset-0 opacity-30 pointer-events-none transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`
                    }}
                />

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-3xl font-light text-white">
                                Top up <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent font-normal">wallet</span>
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                        >
                            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-light text-gray-300 mb-3">
                                Enter amount to top up
                            </label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount..."
                                    className="w-full bg-gray-800/30 border border-gray-800/50 rounded-2xl pl-12 pr-4 py-4 text-white font-light placeholder-gray-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all duration-300"
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            {amount && (
                                <p className="mt-3 text-sm font-light text-cyan-400 animate-in fade-in slide-in-from-top-2 duration-300">
                                    Amount: {formatCurrency(amount)}
                                </p>
                            )}
                        </div>

                        {/* Quick select */}
                        <div>
                            <p className="text-sm font-light text-gray-300 mb-3">Quick select amount</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[5, 10, 20, 50, 100, 500].map((quickAmount, index) => (
                                    <button
                                        key={quickAmount}
                                        onClick={() => setAmount(quickAmount.toString())}
                                        className="px-4 py-3 bg-gray-800/30 hover:bg-gradient-to-br hover:from-cyan-400/10 hover:to-cyan-600/10 border border-gray-800/50 hover:border-cyan-400/50 rounded-xl text-sm font-light text-gray-300 hover:text-white transition-all duration-300 hover:scale-105"
                                        style={{
                                            animationDelay: `${index * 50}ms`
                                        }}
                                    >
                                        {new Intl.NumberFormat('en-US').format(quickAmount)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                            className={`w-full px-6 py-4 rounded-2xl font-light transition-all duration-300 shadow-lg group ${
                                !amount || parseFloat(amount) <= 0 || isLoading
                                    ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed border border-gray-800/50'
                                    : 'bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105'
                            }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="font-light">Processing transaction</span>
                                </div>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Confirm top-up
                                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-800/50">
                        <p className="text-xs font-light text-gray-400 text-center">
                            The amount will be added to your wallet immediately after confirmation
                        </p>
                    </div>
                </div>

                {/* Subtle grid pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.02] pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>
        </div>
    );
};

export default WalletTopupModal;

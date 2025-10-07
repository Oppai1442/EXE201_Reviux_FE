import React, { useEffect, useState } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    XCircle,
    Clock,
    CheckCircle,
    Loader,
    DollarSign,
    Crown,
    RefreshCw,
    Copy,
    Shield,
    ChevronRight,
    Zap
} from 'lucide-react';
import type { checkoutDetail } from '../types';

type CheckoutHandlerProps = {
    onGoBack: () => void;
    onRetry?: () => void;
    onContinue?: () => void;
    checkoutDetail: checkoutDetail;
    errorMessage?: string;
};

const CheckoutHandler: React.FC<CheckoutHandlerProps> = ({
    onGoBack,
    onRetry,
    onContinue,
    checkoutDetail,
    errorMessage
}) => {
    const [copied, setCopied] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (checkoutDetail.checkoutStatus === 'ACTIVE') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return 95;
                    return prev + Math.random() * 10;
                });
            }, 500);
            return () => clearInterval(interval);
        }
    }, [checkoutDetail.checkoutStatus]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusConfig = () => {
        const { checkoutStatus, checkoutType } = checkoutDetail;

        switch (checkoutStatus) {
            case 'ACTIVE':
                return {
                    icon: <Zap className="w-6 h-6 text-blue-400" />,
                    title: 'Processing Payment',
                    subtitle: 'Secure transaction in progress',
                    bgGradient: 'bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-blue-600/10',
                    borderGradient: 'bg-gradient-to-r from-blue-500/30 to-cyan-400/30',
                    iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-400/20',
                    actionType: 'loading' as const,
                    accentColor: 'blue'
                };

            case 'COMPLETED':
                return {
                    icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
                    title: 'Payment Successful',
                    subtitle: checkoutType === 'SUBSCRIPTION'
                        ? 'Your subscription is now active'
                        : `$${checkoutDetail.topupAmount} added to your account`,
                    bgGradient: 'bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-emerald-600/10',
                    borderGradient: 'bg-gradient-to-r from-emerald-500/30 to-green-400/30',
                    iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-400/20',
                    actionType: 'success' as const,
                    accentColor: 'emerald'
                };

            case 'CANCELED':
                return {
                    icon: <Clock className="w-6 h-6 text-amber-400" />,
                    title: 'Payment Canceled',
                    subtitle: 'Transaction was canceled by user',
                    bgGradient: 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10',
                    borderGradient: 'bg-gradient-to-r from-amber-500/30 to-orange-400/30',
                    iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-400/20',
                    actionType: 'canceled' as const,
                    accentColor: 'amber'
                };

            case 'FAILED':
                return {
                    icon: <XCircle className="w-6 h-6 text-red-400" />,
                    title: 'Payment Failed',
                    subtitle: 'Transaction could not be completed',
                    bgGradient: 'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-red-600/10',
                    borderGradient: 'bg-gradient-to-r from-red-500/30 to-rose-400/30',
                    iconBg: 'bg-gradient-to-br from-red-500/20 to-rose-400/20',
                    actionType: 'error' as const,
                    accentColor: 'red'
                };

            default:
                return {
                    icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
                    title: 'Unknown Status',
                    subtitle: 'Please contact support',
                    bgGradient: 'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-red-600/10',
                    borderGradient: 'bg-gradient-to-r from-red-500/30 to-rose-400/30',
                    iconBg: 'bg-gradient-to-br from-red-500/20 to-rose-400/20',
                    actionType: 'error' as const,
                    accentColor: 'red'
                };
        }
    };

    const renderCheckoutDetails = () => {
        const { checkoutType, subscription, topupAmount } = checkoutDetail;

        if (checkoutType === 'SUBSCRIPTION' && subscription) {
            return (
                <div className="relative overflow-hidden bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-400/20 flex items-center justify-center">
                                    <Crown className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Premium Plan</h3>
                                    <p className="text-gray-400 text-sm">Subscription Details</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-white">
                                    ${subscription.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-gray-400 text-xs">
                                    {subscription.isAnnual ? 'per year' : 'per month'}
                                </p>
                            </div>

                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                                <span className="text-gray-400 text-sm">Plan Name</span>
                                <span className="text-white font-medium">{subscription.name}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-gray-400 text-sm">Features</span>
                                <p className="text-white text-sm mt-1 leading-relaxed">{subscription.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (checkoutType === 'TOPUP' && topupAmount) {
            return (
                <div className="relative overflow-hidden bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-400/20 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Account Top-up</h3>
                                    <p className="text-gray-400 text-sm">Balance Addition</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                                    ${topupAmount}
                                </p>
                                <p className="text-gray-400 text-xs">credit added</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderActionButtons = (actionType: string, config: any) => {
        const getButtonClasses = (variant: 'primary' | 'secondary') => {
            const baseClasses = "w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden";

            if (variant === 'primary') {
                switch (config.accentColor) {
                    case 'blue':
                        return `${baseClasses} bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25`;
                    case 'emerald':
                        return `${baseClasses} bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25`;
                    case 'amber':
                        return `${baseClasses} bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25`;
                    case 'red':
                        return `${baseClasses} bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/25`;
                    default:
                        return `${baseClasses} bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white`;
                }
            } else {
                return `${baseClasses} bg-gray-900/50 hover:bg-gray-800/50 text-white border border-gray-800 hover:border-gray-700 backdrop-blur-sm`;
            }
        };

        switch (actionType) {
            case 'loading':
                return (
                    <div className="space-y-4">
                        <div className="w-full bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Loader className="w-5 h-5 animate-spin text-blue-400" />
                                    <span className="text-white font-medium">Processing Payment</span>
                                </div>
                                <span className="text-blue-400 font-semibold">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-800/50 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-gray-400 text-sm mt-3">Please do not close this window</p>
                        </div>
                    </div>
                );

            case 'success':
                return (
                    <div className="space-y-4">
                        {onContinue && (
                            <button onClick={onContinue} className={getButtonClasses('primary')}>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <CheckCircle className="w-5 h-5 relative z-10" />
                                <span className="relative z-10">Continue</span>
                                <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                            </button>
                        )}
                        <button onClick={onGoBack} className={getButtonClasses('secondary')}>
                            <ArrowLeft className="w-5 h-5" />
                            Return Home
                        </button>
                    </div>
                );

            case 'canceled':
                return (
                    <div className="space-y-4">
                        {onRetry && (
                            <button onClick={onRetry} className={getButtonClasses('primary')}>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <RefreshCw className="w-5 h-5 relative z-10 group-hover:rotate-180 transition-transform duration-300" />
                                <span className="relative z-10">Retry Payment</span>
                            </button>
                        )}
                        <button onClick={onGoBack} className={getButtonClasses('secondary')}>
                            <ArrowLeft className="w-5 h-5" />
                            Return Home
                        </button>
                    </div>
                );

            case 'error':
            default:
                return (
                    <div className="space-y-4">
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-red-300 font-medium mb-1">Error Details</p>
                                        <p className="text-red-200 text-sm leading-relaxed">{errorMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {onRetry && (
                            <button onClick={onRetry} className={getButtonClasses('primary')}>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <RefreshCw className="w-5 h-5 relative z-10 group-hover:rotate-180 transition-transform duration-300" />
                                <span className="relative z-10">Try Again</span>
                            </button>
                        )}
                        <button onClick={onGoBack} className={getButtonClasses('secondary')}>
                            <ArrowLeft className="w-5 h-5" />
                            Return Home
                        </button>
                    </div>
                );
        }
    };

    const config = getStatusConfig();

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="max-w-lg w-full relative z-10">
                {/* Main Status Card */}
                <div className={`relative overflow-hidden backdrop-blur-sm border rounded-3xl p-8 ${config.bgGradient} border-gray-800/50 group`}>
                    {/* Border Gradient Effect */}
                    <div className={`absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity duration-500`}>
                        <div className={`absolute inset-0 p-[1px] ${config.borderGradient} rounded-3xl`}>
                            <div className="w-full h-full bg-black/80 rounded-3xl"></div>
                        </div>
                    </div>

                    <div className="relative z-10">
                        {/* Status Header */}
                        <div className="text-center mb-8">
                            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${config.iconBg} flex items-center justify-center backdrop-blur-sm border border-gray-700/50 group-hover:scale-110 transition-transform duration-300`}>
                                {config.icon}
                            </div>

                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-2">
                                {config.title}
                            </h1>

                            <p className="text-gray-400 text-lg leading-relaxed">
                                {config.subtitle}
                            </p>
                        </div>

                        {/* Checkout Details */}
                        <div className="mb-8">
                            {renderCheckoutDetails()}
                        </div>

                        {/* Checkout ID */}
                        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/30 rounded-2xl p-4 mb-8 group/id hover:border-gray-700/50 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-4 h-4 text-gray-400" />
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Transaction ID</p>
                                    </div>
                                    <p className="text-sm text-gray-300 font-mono tracking-wide">{checkoutDetail.checkoutId}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(checkoutDetail.checkoutId)}
                                    className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors duration-200 group"
                                >
                                    <Copy className={`w-4 h-4 transition-colors duration-200 ${copied ? 'text-green-400' : 'text-gray-400 group-hover:text-white'}`} />
                                </button>
                            </div>
                            {copied && (
                                <div className="mt-2 text-xs text-green-400 font-medium">
                                    ✓ Copied to clipboard
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {renderActionButtons(config.actionType, config)}

                        {/* Support Information */}
                        <div className="mt-8 pt-6 border-t border-gray-800/50">
                            <div className="text-center">
                                <p className="text-gray-500 text-sm mb-2">
                                    Need assistance? Our support team is here to help
                                </p>
                                <a
                                    href="https://mail.google.com/mail/?view=cm&fs=1&to=SBA_Support@gmail.com&su=Support Request&body=Hi, I need help with..."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2 group"
                                >
                                    <span>SBA_Support@gmail.com</span>
                                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
                                </a>

                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                        <Shield className="w-4 h-4" />
                        <span>Your payment information is encrypted and secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutHandler;
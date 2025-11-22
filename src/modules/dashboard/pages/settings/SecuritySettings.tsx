import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Key, Smartphone, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import showToast from '@/utils/toast';
import { fetchTwoFactorStatus, requireTwoFactorAuth, updateTwoFactorStatus } from '@/modules/auth/services/twoFactorService';

interface SecuritySettingsState {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    sessionTimeout: string;
    loginAlerts: boolean;
    suspiciousActivityAlerts: boolean;
}

const SecuritySettings: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);


    const [securitySettings, setSecuritySettings] = useState({
        twoFactorEnabled: true,
        biometricEnabled: false,
        sessionTimeout: '30',
        loginAlerts: true,
        suspiciousActivityAlerts: true
    });
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [twoFactorStatusLoaded, setTwoFactorStatusLoaded] = useState(false);

    type SecuritySettingKey = keyof SecuritySettingsState;

    const handleSecurityToggle = (setting: SecuritySettingKey): void => {
        setSecuritySettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    };

    const { twoFactorEnabled } = securitySettings;

    useEffect(() => {
        let mounted = true;
        const loadStatus = async () => {
            try {
                const enabled = await fetchTwoFactorStatus();
                if (mounted) {
                    setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: enabled }));
                }
            } catch (error) {
                showToast('error', 'Unable to load two-factor status.');
            } finally {
                if (mounted) {
                    setTwoFactorStatusLoaded(true);
                }
            }
        };
        loadStatus();
        return () => {
            mounted = false;
        };
    }, []);

    const handleTwoFactorToggle = useCallback(async () => {
        setTwoFactorLoading(true);
        try {
            const verificationCode = await requireTwoFactorAuth();
            const nextState = !twoFactorEnabled;
            await updateTwoFactorStatus(nextState, verificationCode);
            setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: nextState }));
            showToast('success', nextState ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.');
        } catch (error) {
            showToast('error', error?.message ?? 'Failed to update two-factor authentication.');
        } finally {
            setTwoFactorLoading(false);
        }
    }, [twoFactorEnabled]);

    return (
        <div className="space-y-8">
            {/* Password Security */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                        <Key className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Password & Authentication</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter current password"
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 pr-12 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                                autoComplete="off"
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition-colors duration-200"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                                autoComplete="new-password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold text-white transition-all duration-200">
                        Update Password
                    </button>
                </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Two-Factor Authentication</h3>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-white font-medium">Authenticator App</p>
                                <p className="text-gray-400 text-sm">Use an app like Google Authenticator</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">
                                {twoFactorStatusLoaded
                                    ? securitySettings.twoFactorEnabled
                                        ? 'Two-factor authentication is active'
                                        : 'Two-factor authentication is disabled'
                                    : 'Loading status...'}
                            </span>
                            {securitySettings.twoFactorEnabled && (
                                <span className="px-3 py-1.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg text-xs font-medium flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3" />
                                    Enabled
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleTwoFactorToggle}
                            disabled={twoFactorLoading || !twoFactorStatusLoaded}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold hover:from-cyan-400 hover:to-cyan-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {twoFactorLoading
                                ? 'Updating...'
                                : securitySettings.twoFactorEnabled
                                    ? 'Disable 2FA'
                                    : 'Enable 2FA'}
                        </button>
                    </div>
                </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-white font-medium">Biometric Authentication</p>
                                <p className="text-gray-400 text-sm">Use fingerprint or face recognition</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSecurityToggle('biometricEnabled')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${securitySettings.biometricEnabled ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${securitySettings.biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Security Preferences */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Security Preferences</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Session Timeout</label>
                        <select
                            value={securitySettings.sessionTimeout}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                        >
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="120">2 hours</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div>
                            <p className="text-white font-medium">Login Alerts</p>
                            <p className="text-gray-400 text-sm">Get notified of new login attempts</p>
                        </div>
                        <button
                            onClick={() => handleSecurityToggle('loginAlerts')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${securitySettings.loginAlerts ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div>
                            <p className="text-white font-medium">Suspicious Activity Alerts</p>
                            <p className="text-gray-400 text-sm">Get notified of unusual account activity</p>
                        </div>
                        <button
                            onClick={() => handleSecurityToggle('suspiciousActivityAlerts')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${securitySettings.suspiciousActivityAlerts ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${securitySettings.suspiciousActivityAlerts ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500">
                        When enabling or disabling 2FA you will be asked to provide the verification code from your authenticator app.
                    </p>
                </div>
            </div>
    );
}

export default SecuritySettings;

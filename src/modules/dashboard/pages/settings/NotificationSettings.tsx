import React, { useState } from 'react';
import { User, Shield, Bell, Mail, Save, Phone, Calendar, AlertTriangle, Info } from 'lucide-react';

interface Notifications {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    marketing: boolean;
    security: boolean;
    updates: boolean;
    mentions: boolean;
    comments: boolean;
}

const NotificationSettings: React.FC = () => {
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        marketing: false,
        security: true,
        updates: true,
        mentions: true,
        comments: false
    });

    const handleNotificationToggle = (setting: keyof Notifications): void => {
        setNotifications(prev => ({ ...prev, [setting]: !prev[setting] }));
    };

    return (
        <div className="space-y-8">
            {/* Communication Preferences */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Communication Methods</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-white font-medium">Email Notifications</p>
                                <p className="text-gray-400 text-sm">Receive updates via email</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleNotificationToggle('emailNotifications')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications.emailNotifications ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-white font-medium">Push Notifications</p>
                                <p className="text-gray-400 text-sm">Receive browser/app notifications</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleNotificationToggle('pushNotifications')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications.pushNotifications ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-white font-medium">SMS Notifications</p>
                                <p className="text-gray-400 text-sm">Receive text message alerts</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleNotificationToggle('smsNotifications')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications.smsNotifications ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${notifications.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Categories */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Notification Categories</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-red-400" />
                            <div>
                                <p className="text-white font-medium">Security Alerts</p>
                                <p className="text-gray-400 text-sm">Login attempts, password changes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium">
                                Required
                            </span>
                            <button
                                onClick={() => handleNotificationToggle('security')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications.security ? 'bg-red-600' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${notifications.security ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="text-white font-medium">Product Updates</p>
                                <p className="text-gray-400 text-sm">New features, maintenance notices</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleNotificationToggle('updates')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications.updates ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${notifications.updates ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-green-400" />
                            <div>
                                <p className="text-white font-medium">Mentions & Tags</p>
                                <p className="text-gray-400 text-sm">When someone mentions you</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleNotificationToggle('mentions')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications.mentions ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${notifications.mentions ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-yellow-400" />
                            <div>
                                <p className="text-white font-medium">Comments & Replies</p>
                                <p className="text-gray-400 text-sm">Responses to your content</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleNotificationToggle('comments')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications.comments ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${notifications.comments ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-purple-400" />
                            <div>
                                <p className="text-white font-medium">Marketing & Promotions</p>
                                <p className="text-gray-400 text-sm">Special offers, newsletters</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleNotificationToggle('marketing')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications.marketing ? 'bg-red-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${notifications.marketing ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Schedule */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Notification Schedule</h3>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Quiet Hours Start</label>
                            <input
                                type="time"
                                defaultValue="22:00"
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Quiet Hours End</label>
                            <input
                                type="time"
                                defaultValue="08:00"
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">Active Days</label>
                        <div className="grid grid-cols-7 gap-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                <button
                                    key={day}
                                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${index < 5
                                        ? 'bg-red-600/20 text-red-300 border border-red-500/30'
                                        : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <div>
                                <p className="text-yellow-300 font-medium">Quiet Hours Active</p>
                                <p className="text-yellow-400/80 text-sm">Notifications will be silenced during these hours except for security alerts</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg shadow-red-500/25 flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    Save Notification Settings
                </button>
            </div>
        </div>
    );
}

export default NotificationSettings;
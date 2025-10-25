import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  Phone, 
  Shield, 
  Palette, 
  Bell, 
  Trash2, 
  Activity, 
  MapPin,
  CheckCircle,
  Link2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { getAccountDataAPI, saveData } from './services/AccountSettings';
import type { AccountDataResponse, UserUpdateProfile } from './types';

const DEFAULT_AVATAR_URL =
  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

const AccountSettings = () => {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const defaultProfileData: AccountDataResponse = useMemo(() => ({
    fullName: '',
    firstName: '',
    lastName: '',
    joinDate: '',
    email: '',
    phone: '',
    userCode: '',
    avatarUrl: DEFAULT_AVATAR_URL,
  }), []);
  const [profileData, setProfileData] = useState<AccountDataResponse>(defaultProfileData);
  const formattedJoinDate = useMemo(() => {
    if (!profileData.joinDate) return 'Unknown';
    const date = new Date(profileData.joinDate);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }, [profileData.joinDate]);
  const avatarPreviewUrl = useMemo(() => {
    const trimmed = profileData.avatarUrl?.trim();
    if (!trimmed) {
      return DEFAULT_AVATAR_URL;
    }
    return trimmed;
  }, [profileData.avatarUrl]);

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
  }, [activeTab]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const data = await getAccountDataAPI();
      const rawAvatar =
        (typeof data?.avatarUrl === 'string' ? data.avatarUrl : undefined) ??
        (typeof (data as any)?.avatarURL === 'string' ? (data as any).avatarURL : undefined);
      const normalizedAvatar =
        typeof rawAvatar === 'string' && rawAvatar.trim().length > 0
          ? rawAvatar.trim()
          : defaultProfileData.avatarUrl;

      setProfileData({
        fullName: data?.fullName ?? defaultProfileData.fullName,
        firstName: data?.firstName ?? defaultProfileData.firstName,
        lastName: data?.lastName ?? defaultProfileData.lastName,
        joinDate: data?.joinDate ?? defaultProfileData.joinDate,
        email: data?.email ?? defaultProfileData.email,
        phone: data?.phone ?? defaultProfileData.phone,
        userCode: data?.userCode ?? defaultProfileData.userCode,
        avatarUrl: normalizedAvatar,
      });
    } catch (error) {
      toast.error('Failed to load account data. Please try again.');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [defaultProfileData]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleProfileUpdate = (field: keyof AccountDataResponse, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: UserUpdateProfile = {
        ...profileData,
        joinDate: profileData.joinDate,
        avatarUrl: profileData.avatarUrl?.trim() || DEFAULT_AVATAR_URL,
      };
      const isSuccess = await saveData(payload);
      if (isSuccess) {
        toast.success('Account information updated successfully.');
        await loadProfile();
      } else {
        toast.error('Account update failed. Please try again.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Account update failed. Please try again.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Privacy', icon: Trash2 }
  ];

  const preferences = [
    { id: 'dark', label: 'Dark Mode', enabled: true },
    { id: 'contrast', label: 'High Contrast', enabled: false },
    { id: 'motion', label: 'Reduce Motion', enabled: false }
  ];

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

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div 
          data-section="header"
          className={`mb-12 transition-all duration-1000 ${
            visibleSections.has('header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h1 className="text-5xl md:text-6xl font-light mb-3">
            <span className="text-white">Account </span>
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Settings</span>
          </h1>
          <p className="text-gray-400 font-light text-lg">Manage your account preferences and profile settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tab Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-cyan-400/10 border border-cyan-400/50 text-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/30 border border-gray-800/50 hover:border-gray-800'
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${
                      activeTab === tab.id ? 'text-cyan-400' : 'group-hover:scale-110'
                    }`} />
                    <span className="font-light">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'profile' && (
              <>
                {/* Profile Header */}
                <div 
                  data-section="profile-header"
                  className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-gray-800 transition-all duration-1000 ${
                    visibleSections.has('profile-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-800/60 bg-gray-900/60 shadow-lg shadow-cyan-500/20 transition-all duration-300 group-hover:shadow-cyan-500/40">
                        <img
                          src={avatarPreviewUrl}
                          alt={`${profileData.firstName || 'User'} ${profileData.lastName || 'Avatar'}`}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = DEFAULT_AVATAR_URL;
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.focus()}
                        className="absolute -bottom-2 -right-2 w-9 h-9 bg-gray-800/80 backdrop-blur-sm border border-cyan-400/50 rounded-full flex items-center justify-center hover:bg-gray-700 hover:scale-110 transition-all duration-300"
                        aria-label="Update avatar using image link"
                      >
                        <Camera className="w-4 h-4 text-cyan-400" />
                      </button>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-500 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-light text-white mb-1">
                        {profileData.firstName} {profileData.lastName}
                      </h2>
                      <p className="text-gray-400 font-light">@{profileData.fullName}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-cyan-400 font-light">Active Now</span>
                        </div>
                        <span className="text-sm text-gray-600">•</span>
                        <span className="text-sm text-gray-400 font-light">
                          Joined {formattedJoinDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div 
                  data-section="profile-form"
                  className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-gray-800 transition-all duration-1000 delay-100 ${
                    visibleSections.has('profile-form') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                >
                  <h3 className="text-2xl font-light text-white mb-8">
                    Personal <span className="text-cyan-400">Information</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group md:col-span-2">
                      <label className="block text-sm font-light text-gray-400 mb-2">
                        Avatar Image Link
                      </label>
                      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-800/60 bg-gray-900/40 flex-shrink-0">
                          <img
                            src={avatarPreviewUrl}
                            alt="Avatar preview"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = DEFAULT_AVATAR_URL;
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="relative flex-1 group">
                          <Link2 className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 transition-colors duration-300 group-focus-within:text-cyan-400" />
                          <input
                            ref={avatarInputRef}
                            id="account-avatar-url"
                            type="url"
                            inputMode="url"
                            value={profileData.avatarUrl}
                            onChange={(e) => handleProfileUpdate('avatarUrl', e.target.value)}
                            onBlur={(e) => {
                              const trimmed = e.target.value.trim();
                              handleProfileUpdate('avatarUrl', trimmed || DEFAULT_AVATAR_URL);
                            }}
                            placeholder="https://example.com/your-avatar.jpg"
                            className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl pl-12 pr-4 py-3 text-white font-light placeholder-gray-500
                                     focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                          />
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">
                        Paste a direct HTTPS link to your profile image. Leave blank to keep the default avatar.
                      </p>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-light text-gray-400 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                        className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-3 text-white font-light placeholder-gray-500
                                 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-light text-gray-400 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                        className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-3 text-white font-light placeholder-gray-500
                                 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-light text-gray-400 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => handleProfileUpdate('fullName', e.target.value)}
                        className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl px-4 py-3 text-white font-light placeholder-gray-500
                                 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-light text-gray-400 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 transition-colors duration-300 group-focus-within:text-cyan-400" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleProfileUpdate('email', e.target.value)}
                          className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl pl-12 pr-4 py-3 text-white font-light placeholder-gray-500
                                   focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-light text-gray-400 mb-2">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 transition-colors duration-300 group-focus-within:text-cyan-400" />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                          className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl pl-12 pr-4 py-3 text-white font-light placeholder-gray-500
                                   focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-light text-gray-400 mb-2">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 transition-colors duration-300 group-focus-within:text-cyan-400" />
                        <input
                          type="text"
                          value={profileData.userCode}
                          onChange={(e) => handleProfileUpdate('userCode', e.target.value)}
                          className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl pl-12 pr-4 py-3 text-white font-light placeholder-gray-500
                                   focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'preferences' && (
              <div 
                data-section="preferences"
                className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-gray-800 transition-all duration-1000 ${
                  visibleSections.has('preferences') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <h3 className="text-2xl font-light text-white mb-8">
                  Appearance <span className="text-cyan-400">Preferences</span>
                </h3>
                <div className="space-y-6">
                  {preferences.map((pref, index) => (
                    <div 
                      key={pref.id} 
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-800/20 border border-gray-800/50 hover:border-cyan-400/30 transition-all duration-300"
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <span className="text-gray-300 font-light">{pref.label}</span>
                      <button 
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 ${
                          pref.enabled ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' : 'bg-gray-700'
                        }`}
                      >
                        <span 
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            pref.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`} 
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!['profile', 'preferences'].includes(activeTab) && (
              <div 
                data-section="coming-soon"
                className={`bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 transition-all duration-1000 ${
                  visibleSections.has('coming-soon') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-cyan-400/10 border border-cyan-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {tabs.find(t => t.id === activeTab)?.icon && 
                      React.createElement(tabs.find(t => t.id === activeTab).icon, { 
                        className: "w-8 h-8 text-cyan-400" 
                      })
                    }
                  </div>
                  <h3 className="text-2xl font-light text-white mb-2">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} <span className="text-cyan-400">Settings</span>
                  </h3>
                  <p className="text-gray-400 font-light">Coming soon...</p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div 
              data-section="save-button"
              className={`flex justify-end transition-all duration-1000 delay-200 ${
                visibleSections.has('save-button') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <button
                onClick={handleSave}
                disabled={isSaving || isLoadingProfile}
                className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 
                         disabled:from-gray-700 disabled:to-gray-800 rounded-xl font-light text-white transition-all duration-300 
                         shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:shadow-none disabled:cursor-not-allowed 
                         flex items-center gap-3 hover:scale-105 disabled:hover:scale-100"
              >
                {isSaving ? (
                  <>
                    <Save className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;

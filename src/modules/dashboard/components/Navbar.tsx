import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
  CheckCircle
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constant/routes";
import { useNavigate } from "react-router-dom";

const Navbar = ({ sidebarOpen, setSidebarOpen, notifications }) => {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const popupRef = useRef(null);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { loading, user, logOut } = useAuth();

  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleClickOutside = useCallback((event) => {
    const target = event.target;
    if (
      notificationRef.current && 
      !notificationRef.current.contains(target) &&
      userMenuRef.current &&
      !userMenuRef.current.contains(target)
    ) {
      setNotificationOpen(false);
      setUserMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        const rect = navbar.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        });
      }
    };

    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.addEventListener('mousemove', handleMouseMove);
      return () => navbar.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const markAllAsRead = () => {
    // Handle mark all as read logic
    console.log('Mark all as read');
  };

  const handleLogout = () => {
      logOut();
      navigate(ROUTES.HOME.path)
  };

  return (
    <nav className="relative bg-gray-950 border-b border-gray-800/50 backdrop-blur-xl z-50">
      {/* Dynamic gradient overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-300"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, #06b6d4 0%, transparent 60%)`
        }}
      />

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />

      <div className="relative px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left section */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="group p-3 rounded-xl bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 hover:border-cyan-400/50 hover:bg-gray-800/30 transition-all duration-300 hover:scale-105"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />
              ) : (
                <Menu className="h-5 w-5 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="text-2xl font-light text-white hover:text-cyan-400 transition-colors duration-300 cursor-pointer">
                  <span className="bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                    Reviux
                  </span>
                </div>
                <div className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-30 bg-cyan-400 transition-opacity duration-300" />
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/30 backdrop-blur-sm">
                <span className="text-cyan-400 text-sm font-light">Admin</span>
              </div>
            </div>
          </div>

          {/* Center search */}
          <div className="hidden md:flex relative flex-1 max-w-md mx-8">
            <Search 
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
                searchFocused ? 'text-cyan-400' : 'text-gray-500'
              }`} 
            />
            <input
              type="text"
              placeholder="Search..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full bg-gray-900/20 border border-gray-800/50 rounded-xl px-12 py-3 text-white font-light placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300"
            />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setUserMenuOpen(false);
                }}
                className="group relative p-3 rounded-xl bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 hover:border-cyan-400/50 hover:bg-gray-800/30 transition-all duration-300 hover:scale-105"
              >
                <Bell className="h-5 w-5 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <span className="text-white text-xs font-light animate-pulse">{unreadCount}</span>
                  </div>
                )}
              </button>

              {notificationOpen && (
                <div
                  className="absolute right-0 mt-3 w-80 bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-cyan-500/10 border border-gray-800/50 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="p-6 border-b border-gray-800/50 flex items-center justify-between">
                    <h3 className="text-lg font-light text-white">
                      Notifications
                    </h3>
                    <button 
                      onClick={markAllAsRead}
                      className="group px-3 py-1.5 text-sm text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20 rounded-lg transition-all duration-300 border border-cyan-400/30 font-light"
                    >
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Mark all read
                      </span>
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50 hover:scrollbar-thumb-cyan-400/30">
                    {notifications.map((notification, index) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 border-b border-gray-800/30 last:border-b-0 hover:bg-gray-800/30 transition-all duration-300 ${
                          notification.unread 
                            ? 'bg-cyan-400/5 border-l-2 border-l-cyan-400' 
                            : ''
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <p className="text-sm text-white font-light mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-500 font-light">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotificationOpen(false);
                }}
                className="group flex items-center gap-3 p-3 rounded-xl bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 hover:border-cyan-400/50 hover:bg-gray-800/30 transition-all duration-300 hover:scale-105"
              >
                <div className="relative w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all duration-300">
                  <User className="h-4 w-4 text-white" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-all duration-300 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-3 w-56 bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-cyan-500/10 border border-gray-800/50 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="p-2">
                    <a 
                      href="#" 
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white font-light hover:bg-gray-800/50 rounded-xl transition-all duration-300 group"
                    >
                      <User className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />
                      <span className="group-hover:text-cyan-400 transition-colors duration-300">Profile</span>
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white font-light hover:bg-gray-800/50 rounded-xl transition-all duration-300 group"
                    >
                      <Settings className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />
                      <span className="group-hover:text-cyan-400 transition-colors duration-300">Settings</span>
                    </a>
                    <hr className="my-2 border-gray-800/50" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 font-light hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all duration-300 group"
                    >
                      <LogOut className="h-4 w-4 group-hover:translate-x-[-2px] transition-transform duration-300" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in-from-top-2 {
          from {
            transform: translateY(-8px);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: fade-in 0.3s ease-out, slide-in-from-top-2 0.3s ease-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
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
    </nav>
  );
};

export default Navbar;

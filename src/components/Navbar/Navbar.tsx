import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Menu, X, Bell, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Assets } from "@/assets";
import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { ROUTES } from "@/constant/routes";

const Navbar = () => {
  const { loading, user, logOut, renderAuth, showAuthModal } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markManyAsRead,
  } = useNotifications();

  const dropdownRef = useRef(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleNotification = () =>
    setNotificationOpen((prev) => !prev);

  const handleClickOutside = useCallback((event) => {
    const target = event.target;
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(target)
    ) {
      setDropdownOpen(false);
    }
    if (
      notificationRef.current &&
      !notificationRef.current.contains(target)
    ) {
      setNotificationOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleItemClick = (action?: string) => {
    if (action === "logout") {
      logOut();
    }
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  const handleNotificationClick = async (id: number, link?: string | null) => {
    await markAsRead(id);
    if (link) {
      navigate(link);
      setNotificationOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((item) => !item.seen).map((item) => item.id);
    if (unreadIds.length === 0) return;
    await markManyAsRead(unreadIds);
  };

  const latestNotifications = notifications.slice(0, 5);

  const pathList = {
    home: "/",
    pricing: "/pricing",
    about: "/about",
    contact: "/contact-us",
  };

  const menuItems = [
    {
      icon: User,
      label: "Dashboard",
      onClick: () => handleItemClick(),
      href: "/dashboard"
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => handleItemClick(),
      href: "/user/setting"
    },
    {
      icon: LogOut,
      label: "Logout",
      onClick: () => handleItemClick("logout"),
      isButton: true
    }
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 text-white py-4 z-[100]">
        <div className="container mx-auto px-4 md:px-12 flex items-center justify-between relative">

          {/* Logo */}
          <Link to="/">
            <img
              src={Assets.Images.Logo}
              alt="Reviux Logo"
              className="h-14 w-auto cursor-pointer"
            />
          </Link>

          {/* Hamburger icon (mobile) */}
          <button
            className="md:hidden text-white p-2 hover:bg-gray-800/50 rounded-xl transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Centered Nav */}
          <ul
            className={`absolute md:static top-full left-0 right-0 w-full md:w-auto bg-gray-950/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-b md:border-b-0 border-gray-800/50 flex-col md:flex-row flex items-center gap-2 md:gap-1 py-4 md:py-0 mt-4 md:mt-0
              ${isMenuOpen ? "flex" : "hidden md:flex"}`}
          >
            {[
              { path: pathList.home, label: "Home" },
              { path: pathList.pricing, label: "Pricing" },
              { path: pathList.contact, label: "Contact" },
              { path: pathList.about, label: "About" }
            ].map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  className="px-4 py-2 rounded-xl font-light hover:bg-gray-800/50 hover:text-cyan-400 transition-all duration-300 block"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Auth + Avatar */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Notification Button */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={toggleNotification}
                    className="relative p-2 hover:bg-gray-800/50 rounded-xl transition-colors group"
                  >
                    <Bell className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 text-gray-950 text-xs rounded-full flex items-center justify-center font-medium">
                        {Math.min(unreadCount, 9)}
                        {unreadCount > 9 && "+"}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-cyan-500/10 border border-gray-800/50 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
                        <div>
                          <p className="text-sm text-white font-light">Notifications</p>
                          <p className="text-xs text-gray-500 font-light">
                            Bạn có {unreadCount} thông báo chưa đọc
                          </p>
                        </div>
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-light"
                        >
                          Đánh dấu đã đọc
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700/50 hover:scrollbar-thumb-cyan-400/30">
                        {latestNotifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-gray-500 font-light text-sm">
                            Không có thông báo nào
                          </div>
                        ) : (
                          latestNotifications.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleNotificationClick(item.id, item.link ?? undefined)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-800/30 last:border-b-0 hover:bg-gray-800/30 transition-all duration-300 ${
                                !item.seen ? "bg-cyan-400/5 border-l-2 border-l-cyan-400" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm text-white font-light">{item.title}</p>
                                  <p className="text-xs text-gray-400 font-light mt-1 line-clamp-2">
                                    {item.message}
                                  </p>
                                </div>
                                {!item.seen && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 font-light mt-2">
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                              </p>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-gray-800/50">
                        <button
                          onClick={() => {
                            setNotificationOpen(false);
                            navigate(ROUTES.DASHBOARD.child.NOTIFICATION_MANAGEMENT.getPath());
                          }}
                          className="w-full text-sm font-light text-cyan-400 hover:text-cyan-300"
                        >
                          Xem tất cả
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div ref={dropdownRef} className="relative flex items-center gap-2">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-800/50 transition-all duration-300 group"
                  >
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full ring-2 ring-gray-800 group-hover:ring-cyan-400 transition-all"
                    />
                    <span className="font-light hidden lg:block">{user.username}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-all duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50 z-50 overflow-hidden">
                      {/* Menu Header */}
                      <div className="px-4 py-4 border-b border-gray-800/50 bg-gradient-to-br from-cyan-900/20 to-transparent">
                        <p className="text-sm font-light text-white">Welcome back</p>
                        <p className="text-xs text-gray-400 mt-1 font-light">Manage your account</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {menuItems.map((item, index) => {
                          const IconComponent = item.icon;

                          if (item.isButton) {
                            return (
                              <button
                                key={index}
                                onClick={item.onClick}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-light text-gray-300 hover:text-white hover:bg-cyan-400/10 transition-all duration-200 group"
                              >
                                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-800/50 group-hover:bg-cyan-400/20 transition-all duration-200">
                                  <IconComponent className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                                </div>
                                <span>{item.label}</span>
                              </button>
                            );
                          }

                          return (
                            <a
                              key={index}
                              href={item.href}
                              onClick={item.onClick}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-light text-gray-300 hover:text-white hover:bg-cyan-400/10 transition-all duration-200 group"
                            >
                              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-800/50 group-hover:bg-cyan-400/20 transition-all duration-200">
                                <IconComponent className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                              </div>
                              <span>{item.label}</span>
                            </a>
                          );
                        })}
                      </div>

                      {/* Menu Footer */}
                      <div className="px-4 py-3 border-t border-gray-800/50 bg-gray-950/50">
                        <p className="text-xs text-gray-500 text-center font-light">Version 1.0.0</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showAuthModal("signIn")}
                  className="px-6 py-2 rounded-xl border border-gray-700 font-light hover:border-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-400 transition-all duration-300"
                >
                  Sign In
                </button>
                <button
                  onClick={() => showAuthModal("signUp")}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 font-light hover:from-cyan-400 hover:to-cyan-500 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  Sign Up
                </button>
              </div>
            )}

          </div>
        </div>
      </nav>

      {renderAuth()}
    </>
  );
};

export default Navbar;

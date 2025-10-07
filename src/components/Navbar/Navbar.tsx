import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { User, Settings, LogOut, Menu, X, Bell } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { Assets } from "@/assets";

const Navbar = ({ notifications = [], sidebarOpen, setSidebarOpen }) => {
  const { loading, user, logOut, renderAuth, showAuthModal } = useAuth();

  const dropdownRef = useRef(null);

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleClickOutside = useCallback((event) => {
    const target = event.target;
    if (dropdownRef.current && !dropdownRef.current.contains(target)) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleItemClick = (action) => {
    if (action === "logout") {
      logOut();
    }
    setDropdownOpen(false);
    setMenuOpen(false);
  };

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
                <button className="relative p-2 hover:bg-gray-800/50 rounded-xl transition-colors group">
                  <Bell className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 text-gray-950 text-xs rounded-full flex items-center justify-center font-medium">
                      {notifications.length}
                    </span>
                  )}
                </button>

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

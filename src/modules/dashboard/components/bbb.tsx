import { useState, useEffect, type ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

type MenuItem = {
  id?: string;
  path?: string;
  label: string;
  icon: ElementType;
  submenu?: MenuItem[] | null;
};

interface SidebarProps {
  menuItems: MenuItem[];
  activeMenu: string;
  setActiveMenu: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (state: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  menuItems,
  activeMenu,
  setActiveMenu,
  sidebarOpen,
  setSidebarOpen
}) => {
  const navigate = useNavigate();
  const [submenuOpen, setSubmenuOpen] = useState<Record<string, boolean>>({});
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const sidebarElement = document.querySelector<HTMLElement>('.sidebar-container');
    if (!sidebarElement) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = sidebarElement.getBoundingClientRect();
      setMousePosition({
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100
      });
    };

    sidebarElement.addEventListener('mousemove', handleMouseMove);
    return () => sidebarElement.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const resolveItemKey = (item: MenuItem) => item.id ?? item.path ?? '';

  const handleMenuClick = (item: MenuItem) => {
    const itemKey = resolveItemKey(item);

    if (item.submenu && item.submenu.length > 0) {
      if (itemKey) {
        setSubmenuOpen(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
      }
      return;
    }

    if (itemKey) {
      setActiveMenu(itemKey);
    }

    const targetPath = item.path ?? (itemKey ? `/dashboard/${itemKey}` : undefined);
    if (targetPath) {
      navigate(targetPath);
    }

    setSidebarOpen(false);
  };

  const handleSubmenuClick = (subItem: MenuItem) => {
    const subKey = resolveItemKey(subItem);

    if (subKey) {
      setActiveMenu(subKey);
    }

    const targetPath = subItem.path ?? (subKey ? `/dashboard/${subKey}` : undefined);
    if (targetPath) {
      navigate(targetPath);
    }

    setSidebarOpen(false);
  };

  const isActiveItem = (item: MenuItem) => {
    const key = resolveItemKey(item);
    return key ? activeMenu === key : false;
  };

  const hasActiveSubmenu = (item: MenuItem) =>
    item.submenu?.some(subItem => {
      const key = resolveItemKey(subItem);
      return key ? activeMenu === key : false;
    }) ?? false;

  const isSubmenuOpen = (item: MenuItem) => {
    const key = resolveItemKey(item);
    return key ? !!submenuOpen[key] : false;
  };

  return (
    <>
      <aside
        className={`sidebar-container ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-all duration-500 ease-in-out fixed inset-y-0 left-0 z-40 w-72 bg-gray-950 border-r border-gray-800/50 backdrop-blur-xl`}
      >
        {/* Dynamic gradient overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-500"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, #06b6d4 0%, transparent 60%)`
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />

        <div className="relative flex flex-col h-full">
          {/* Logo section */}
          <div className="p-6 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all duration-300 group-hover:shadow-cyan-500/50">
                  <span className="text-white font-light text-lg">E</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
              </div>
              <div>
                <div className="text-xl font-light">
                  <span className="bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                    Evally
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-light">Admin Dashboard</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50 hover:scrollbar-thumb-cyan-400/30">
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <div
                  key={`menu-item-${item.id || index}`}
                  className="group"
                  style={{
                    animation: sidebarOpen ? 'slideIn 0.3s ease-out forwards' : 'none',
                    animationDelay: `${index * 50}ms`,
                    opacity: sidebarOpen ? 1 : 0
                  }}
                >
                  <button
                    onClick={() => handleMenuClick(item)}
                    className={`relative group/item flex items-center w-full px-4 py-3 text-sm font-light rounded-xl transition-all duration-300 ${
                      isActiveItem(item) || hasActiveSubmenu(item)
                        ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 shadow-lg shadow-cyan-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/30 hover:border-gray-800/50 border border-transparent backdrop-blur-sm'
                    } hover:scale-105`}
                  >
                    {/* Active indicator */}
                    {(isActiveItem(item) || hasActiveSubmenu(item)) && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-cyan-500 rounded-r-full"></div>
                    )}

                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-200 ${
                        isActiveItem(item) || hasActiveSubmenu(item)
                          ? 'bg-cyan-400/20 text-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-gray-800/30 text-gray-400 group-hover/item:bg-gray-700/50 group-hover/item:text-cyan-400'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>

                    <span className="flex-1 text-left">{item.label}</span>

                    {item.submenu && (
                      <ChevronDown
                        className={`h-4 w-4 transition-all duration-300 ${
                          isSubmenuOpen(item) ? 'rotate-180 text-cyan-400' : 'text-gray-500'
                        }`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {item.submenu && (
                    <div
                      className={`overflow-hidden transition-all duration-500 ${
                        isSubmenuOpen(item) ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="ml-4 space-y-1 border-l-2 border-gray-800/50 pl-4">
                        {item.submenu.map((subItem, subIndex) => (
                          <button
                            key={`submenu-item-${subItem.id || subIndex}`}
                            onClick={() => handleSubmenuClick(subItem)}
                            className={`group/subitem flex items-center w-full px-3 py-2.5 text-sm font-light rounded-lg transition-all duration-300 ${
                              isActiveItem(subItem)
                                ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30'
                                : 'text-gray-500 hover:text-cyan-400 hover:bg-gray-800/20 border border-transparent'
                            } hover:scale-105 hover:translate-x-1`}
                            style={{
                              animationDelay: `${subIndex * 50}ms`
                            }}
                          >
                            <div
                              className={`flex items-center justify-center w-6 h-6 rounded-md mr-3 transition-all duration-300 ${
                                isActiveItem(subItem)
                                  ? 'bg-cyan-400/20 text-cyan-400'
                                  : 'bg-transparent text-gray-500 group-hover/subitem:text-cyan-400'
                              }`}
                            >
                              <subItem.icon className="h-3 w-3" />
                            </div>
                            <span className="flex-1 text-left">{subItem.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800/50">
            <div className="bg-gray-900/20 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 hover:border-cyan-400/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all duration-300 group-hover:shadow-cyan-500/50">
                    <span className="text-white text-xs font-light">AD</span>
                  </div>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-500 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-light text-white truncate">Admin User</div>
                  <div className="text-xs text-gray-500 font-light">admin@evally.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-all duration-500"
          onClick={() => setSidebarOpen(false)}
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
    </>
  );
};

export default Sidebar;

import { Outlet } from "react-router-dom";
import { Navbar, Sidebar } from "./components";
import {
  Settings,
  Users,
  Key,
  CreditCard,
  BarChart3,
  FileText,
  ClipboardList,
  Ticket,
  FileCog,
} from 'lucide-react';
import { useState } from "react";
import { ROUTES } from "@/constant/routes";
import { useAuth } from "@/context/AuthContext";
import useMenuAccessControl from "@/hooks/useMenuAccessControl";

const DashboardLayout = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const {
    isUser,
    isLecturer,
    hasDept,
  } = useMenuAccessControl();


  // Define the type for menu items to include optional visibleIf
  type MenuItem = {
    id?: string;
    path?: string;
    label: string;
    icon: any;
    submenu?: MenuItem[] | null;
    roles?: string[];
    visibleIf?: (user: any) => boolean;
  };
  
  const menuItems: MenuItem[] = [
    {
      path: ROUTES.DASHBOARD.path,
      label: ROUTES.DASHBOARD.label,
      icon: BarChart3,
      submenu: null,
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      submenu: [
        {
          id: ROUTES.DASHBOARD.child.USER_MANAGEMENT.path,
          label: ROUTES.DASHBOARD.child.USER_MANAGEMENT.label,
          icon: Users,
        },
      ],
      roles: ["ROLE_ADMIN"]
    },
    {
      id: ROUTES.DASHBOARD.child.PERMISSION_MANAGEMENT.path,
      label: ROUTES.DASHBOARD.child.PERMISSION_MANAGEMENT.label,
      icon: Key,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
    {
      id: ROUTES.DASHBOARD.child.SUBSCRIPTIONS.path,
      label: ROUTES.DASHBOARD.child.SUBSCRIPTIONS.label,
      icon: CreditCard,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
    {
      id: ROUTES.DASHBOARD.child.PAYMENT.path,
      label: ROUTES.DASHBOARD.child.PAYMENT.label,
      icon: CreditCard,
      submenu: null,
    },
    {
      id: 'ticket',
      label: 'Ticket',
      icon: Ticket,
      submenu: [
        {
          id: ROUTES.DASHBOARD.child.TICKET_MANAGEMENT.path,
          label: ROUTES.DASHBOARD.child.TICKET_MANAGEMENT.label,
          icon: FileCog,
          roles: ["ROLE_ADMIN"]
        },
        {
          id: ROUTES.DASHBOARD.child.MY_TICKET.path,
          label: ROUTES.DASHBOARD.child.MY_TICKET.label,
          icon: ClipboardList
        }
      ]
    },
    {
      id: ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.path,
      label: ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.label,
      icon: Settings,
      submenu: null,
    },
    {
      id: "logs",
      label: "Logs/Audit",
      icon: FileText,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
  ];

  const notifications = [
    { id: 1, message: "Có 5 bài thi mới cần chấm điểm", time: "2 phút trước", unread: true },
    { id: 2, message: "User john@example.com vừa đăng ký", time: "10 phút trước", unread: true },
    { id: 3, message: "Hệ thống backup hoàn tất", time: "1 giờ trước", unread: false },
    { id: 4, message: "Có ticket support mới #1234", time: "2 giờ trước", unread: true },
  ];

  /*
  const allowedMenuItems = useMemo(() => {
    return menuItems
      .map(item => {
        if (item.visibleIf && !item.visibleIf(user)) return null;

        if (item.submenu) {
          const filteredSubmenu = item.submenu.filter(sub =>
            (!sub.roles || (user && sub.roles.includes(user.role.name))) &&
            (!sub.visibleIf || sub.visibleIf(user))
          );

          if (filteredSubmenu.length > 0) {
            return {
              ...item,
              submenu: filteredSubmenu
            };
          }

          if (!item.roles || item.roles.includes(user.role.name)) {
            return { ...item, submenu: [] };
          }

          return null;
        }

        if (!item.roles || (user && item.roles.includes(user.role.name))) return item;

        return null;
      })
      .filter(Boolean);
  }, [user, hasDept]);




  */

  const allowedMenuItems = menuItems;

  return (
    <div className="min-h-screen flex bg-black text-white">
      <Sidebar
        menuItems={allowedMenuItems}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 relative">
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          notifications={notifications}
        />
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;

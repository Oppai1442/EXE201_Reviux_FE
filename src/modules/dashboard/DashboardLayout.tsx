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
  FlaskConical,
  Workflow,
  Receipt,
  Bell,
} from 'lucide-react';
import { useMemo, useState } from "react";
import { ROUTES } from "@/constant/routes";
import { useAuth } from "@/context/AuthContext";

const DashboardLayout = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

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
      roles: ["ROLE_ADMIN"]
    },
    {
      id: ROUTES.DASHBOARD.child.COUPONS.path,
      label: ROUTES.DASHBOARD.child.COUPONS.label,
      icon: Receipt,
      submenu: null,
      roles: ["ROLE_ADMIN", "ROLE_STAFF"]
    },
    {
      id: ROUTES.DASHBOARD.child.USER_MANAGEMENT.path,
      label: ROUTES.DASHBOARD.child.USER_MANAGEMENT.label,
      icon: Users,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
    {
      id: 'testing',
      label: 'Testing',
      icon: FlaskConical,
      submenu: [
        {
          id: ROUTES.DASHBOARD.child.MY_REQUESTS.path,
          label: ROUTES.DASHBOARD.child.MY_REQUESTS.label,
          icon: ClipboardList,
          roles: ["ROLE_USER"],
        },
        {
          id: ROUTES.DASHBOARD.child.REQUEST_MANAGEMENT.path,
          label: ROUTES.DASHBOARD.child.REQUEST_MANAGEMENT.label,
          icon: Workflow,
          roles: ["ROLE_ADMIN", "ROLE_STAFF"]
        }
      ]
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
      id: ROUTES.DASHBOARD.child.MY_TRANSACTION.path,
      label: ROUTES.DASHBOARD.child.MY_TRANSACTION.label,
      icon: CreditCard,
      submenu: null,
      // roles: ["ROLE_USER"]
    },
    {
      id: ROUTES.DASHBOARD.child.TRANSACTION.path,
      label: ROUTES.DASHBOARD.child.TRANSACTION.label,
      icon: CreditCard,
      submenu: null,
      roles: ["ROLE_ADMIN"]
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
          roles: ["ROLE_ADMIN", "ROLE_STAFF"]
        },
        {
          id: ROUTES.DASHBOARD.child.MY_TICKET.path,
          label: ROUTES.DASHBOARD.child.MY_TICKET.label,
          icon: ClipboardList,
          roles: ["ROLE_USER"]
        }
      ]
    },
    {
      id: ROUTES.DASHBOARD.child.MY_SUBSCRIPTIONS.path,
      label: ROUTES.DASHBOARD.child.MY_SUBSCRIPTIONS.label,
      icon: Receipt,
      submenu: null,
      roles: ["ROLE_USER"]
    },
    {
      id: ROUTES.DASHBOARD.child.NOTIFICATION_MANAGEMENT.path,
      label: ROUTES.DASHBOARD.child.NOTIFICATION_MANAGEMENT.label,
      icon: Bell,
      submenu: null,
      roles: ["ROLE_USER", "ROLE_ADMIN", "ROLE_STAFF"]
    },
    {
      id: ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.path,
      label: ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.label,
      icon: Settings,
      submenu: null,
    },
    {
      id: ROUTES.DASHBOARD.child.LOG.path,
      label: ROUTES.DASHBOARD.child.LOG.label,
      icon: FileText,
      submenu: null,
      roles: ["ROLE_ADMIN"]
    },
  ];



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

          if (!item.roles || (user && item.roles.includes(user.role.name))) {
            return { ...item, submenu: [] };
          }

          return null;
        }

        if (!item.roles || (user && item.roles.includes(user.role.name))) return item;

        return null;
      })
      .filter(Boolean) as MenuItem[];
  }, [user]);


  // const allowedMenuItems = menuItems;

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
        />
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;

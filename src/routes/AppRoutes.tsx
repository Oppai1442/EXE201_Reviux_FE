import { Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ROUTES } from '@/constant/routes';
import { CheckoutPage } from '@/modules/checkout';
import { PaymentManagement } from '@/modules/dashboard';

// Lazy load components
const Home = lazy(() => import('@/modules/home'));
const ContactUs = lazy(() => import('@/modules/contactUs'));
const NotFound = lazy(() => import('@/modules/notFound'));
const AboutPage = lazy(() => import('@/modules/aboutUs/pages/AboutUs'));
const Policy = lazy(() => import('@/modules/policy'));
const ToSPage = lazy(() => import('@/modules/tos'));
const Pricing = lazy(() => import('@/modules/pricingPage'));

// Dashboard components
const DashboardLayout = lazy(() => import('@/modules/dashboard/DashboardLayout'));
const Dashboard = lazy(() => import('@/modules/dashboard/pages/Dashboard'));
const AccountSettings = lazy(() => import('@/modules/dashboard/pages/settings/AccountSettings'));
const NotificationSettings = lazy(() => import('@/modules/dashboard/pages/settings/NotificationSettings'));
const PermissionManagement = lazy(() => import('@/modules/dashboard/pages/permission-management/PermissionManagement'));
const SecuritySettings = lazy(() => import('@/modules/dashboard/pages/settings/SecuritySettings'));
const SubscriptionManagement = lazy(() => import('@/modules/dashboard/pages/subscription-management/SubscriptionManagement'));
// const NotificationManagement = lazy(() => import('@/modules/dashboard/pages/notification/notification-management/NotificationManagement'));
const UserManagement = lazy(() => import('@/modules/dashboard/pages/user-management/UserManagement'));


// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

const routes = [
  { path: ROUTES.HOME.path, element: withSuspense(Home) },
  { path: ROUTES.CONTACT.path, element: withSuspense(ContactUs) },
  { path: ROUTES.ABOUT.path, element: withSuspense(AboutPage) },
  { path: ROUTES.PRICING.path, element: withSuspense(Pricing) },

  //Nằm ở footer
  { path: ROUTES.POLICY.path, element: <Policy /> },
  { path: ROUTES.TOS.path, element: <ToSPage /> },

  { path: ROUTES.CHECKOUT.path, element: <CheckoutPage/>},

  {
    path: ROUTES.DASHBOARD.path,
    element: <DashboardLayout />, 
    authOnly: false,
    children: [
      { index: true, element: <Dashboard />},

      { path: ROUTES.DASHBOARD.child.USER_MANAGEMENT.path, element: <UserManagement />},
      { path: ROUTES.DASHBOARD.child.PERMISSION_MANAGEMENT.path, element: <PermissionManagement /> },
      { path: ROUTES.DASHBOARD.child.SUBSCRIPTIONS.path, element: <SubscriptionManagement /> },
      { path: ROUTES.DASHBOARD.child.PAYMENT.path, element: <PaymentManagement /> },

      //Notification
      // { path: ROUTES.DASHBOARD.child.NOTIFICATION_MANAGEMENT.path, element: <NotificationManagement /> },

      
      //Settings
      { path: ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.path, element: <AccountSettings /> },
      // { path: ROUTES.DASHBOARD.child.SECURITY_SETTINGS.path, element: <SecuritySettings /> },
      // { path: ROUTES.DASHBOARD.child.NOTIFICATION_SETTINGS.path, element: <NotificationSettings /> },
    ]
  },

  //2 cái này sẽ luôn nằm ở cuối cùng
  { path: '*', element: <Navigate to={ROUTES.NOT_FOUND.path} replace /> },
  { path: ROUTES.NOT_FOUND.path, element: <NotFound /> },
];

export default routes;

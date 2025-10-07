// constants/routes.ts

export const ROUTES = {
    // PUBLIC
    HOME: { path: '/', label: 'Home', public: true },
    ABOUT: { path: '/about', label: 'About', public: true },
    CONTACT: { path: '/contact-us', label: 'About', public: true },
    PRICING: { path: '/pricing', label: 'Pricing', public: true },

    POLICY: { path: '/policy', label: 'Policy', public: true },
    TOS: { path: '/terms-of-service', label: 'Terms of Service', public: true },


    USER_DETAIL: { path: '/user/:id', getPath: (id: string) => `/user/${id}`, label: 'User', public: true },


    CHECKOUT: {
        path: '/checkout/:id',
        label: 'Checkout',
        public: true,
        getPath: (id: string) => `/checkout/${id}`
    },


    // AUTH
    DASHBOARD: {
        path: '/dashboard', label: 'Dashboard', authOnly: true,
        child: {
            USER_MANAGEMENT: { path: 'user-list', label: 'User List' },
            PERMISSION_MANAGEMENT: { path: 'permissions', label: 'Permission Management' },
            SUBSCRIPTIONS: { path: 'subscriptions', label: 'Subscriptions' },
            PAYMENT: { path: 'payment', label: 'Payment' },

            // Notification
            NOTIFICATION_MANAGEMENT: { path: 'notification/notification-management', label: 'Notification Management'},

            // Ticket
            TICKET_MANAGEMENT: { path: 'ticket/ticket-management', label: 'Ticket Management' },
            MY_TICKET: { path: 'ticket/my-ticket', label: 'My Ticket' },

            // Settings
            ACCOUNT_SETTINGS: { path: 'settings', label: 'Settings' },
            // SECURITY_SETTINGS: { path: 'settings/security', label: 'Security' },
            // NOTIFICATION_SETTINGS: { path: 'settings/notification', label: 'Notification' },
        }
    },

    // NOT FOUND
    NOT_FOUND: { path: '/404', label: 'Not Found', public: true },
};

export interface checkoutSubscription {
    id: number,
    name: string,
    description: string,
    price: number,
    finalPrice: number,
    isAnnual: boolean,
    features: {
        featureKey: string,
        featureValue: string
    }[]
}

export interface checkoutDetail {
    checkoutId: string,
    checkoutType: "SUBSCRIPTION" | "TOPUP",
    topupAmount?: number,
    subscription?: checkoutSubscription
    checkoutStatus: "ACTIVE" | "CANCELED" | "COMPLETED" | "FAILED" | "UNKNOWN"
}

export interface TopUpPlan {
    amount: number;
    currency: string;
    bonus?: number;
    badge?: string;
    popular?: boolean;
}

export type PaymentMethodBackendId = "ACCOUNT_BALANCE" | "VNPAY" | "STRIPE" | "MOMO" | "PAYOS" | "CREDIT_CARD";

export type PaymentMethodAvailabilityStatus = "AVAILABLE" | "COMING_SOON" | "DISABLED";

export interface checkoutPaymentMethodStatus {
    paymentMethod: PaymentMethodBackendId;
    available: boolean;
    status: PaymentMethodAvailabilityStatus;
    statusMessage?: string;
    displayName?: string;
}

export interface checkoutConfirmRedirectResponse {
    checkoutId: string,
    success: boolean,
    message: string,
    paymentMethod: string,
}

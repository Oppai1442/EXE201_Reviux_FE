export interface feature {
    id: number;
    featureKey: string;
    featureValue: string;
}

type BillingPeriod =
    | 'MONTHLY'
    | 'QUARTERLY'
    | 'SEMI_ANNUALLY'
    | 'ANNUALLY'
    | 'BIENNIALLY'
    | 'TRIENNIALLY'
    | 'LIFETIME';

export interface SubscriptionMini {
    id: number;
    name: string;
    description: string;
    price: number;
    discountPrice: number;
    billingPeriod: BillingPeriod
    icon: string;
    themeColor: string;
    isPopular: boolean;
    features: feature[];
}
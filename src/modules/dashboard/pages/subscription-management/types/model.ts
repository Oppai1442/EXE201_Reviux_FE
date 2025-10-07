export interface SubscriptionFeature {
  featureKey: string;
  featureValue: string;
}

export type BillingPeriod =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_ANNUALLY'
  | 'ANNUALLY'
  | 'BIENNIALLY'
  | 'TRIENNIALLY'
  | 'LIFETIME';

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED' | 'DRAFT';

export interface Subscription {
  id: number;
  name: string;
  description: string;
  price: string;
  discountPrice?: string | null;
  durationDays?: number | null;
  maxUsage?: number | null;
  status: SubscriptionStatus;
  createdAt?: string;
  updatedAt?: string;
  icon: string;
  themeColor: string;
  isPopular: boolean;
  billingPeriod: BillingPeriod;
  features: SubscriptionFeature[];
}

export interface Feature {
  featureKey: string;
  dataType: 'boolean' | 'number'
}

export interface createSubscriptionRequestDTO {
  name: string;
  description: string;
  price: string;
  discountPrice?: string | null;
  status: SubscriptionStatus;
  icon: string;
  themeColor: string;
  isPopular: boolean;
  billingPeriod: BillingPeriod;
  features: SubscriptionFeature[];
}

export interface updateSubscriptionRequestDTO {
  subscriptionId: number;
  name?: string;
  description?: string;
  price?: string;
  discountPrice?: string | null;
  durationDays?: number | null;
  status?: SubscriptionStatus;
  icon?: string;
  themeColor?: string;
  isPopular?: boolean;
  billingPeriod?: BillingPeriod;
  features?: SubscriptionFeature[];
}
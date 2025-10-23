import { getData } from "@/services/api/apiService";

export interface SubscriptionFeature {
  id: number;
  featureKey: string;
  featureValue: string;
}

export type BillingPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY" | "ANNUALLY" | "WEEKLY" | "CUSTOM" | string;

export interface SubscriptionMini {
  id: number;
  name: string;
  description: string | null;
  price: number | string | null;
  discountPrice: number | string | null;
  billingPeriod: BillingPeriod | null;
  icon: string | null;
  themeColor: string | null;
  isPopular: boolean;
  features: SubscriptionFeature[];
}

export interface SubscriptionSummary {
  id: number;
  name: string;
  description: string | null;
  price: number | string | null;
  discountPrice: number | string | null;
  durationDays: number | null;
  icon: string | null;
  themeColor: string | null;
}

export interface UserSubscription {
  id: number;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  customName: string | null;
  customDescription: string | null;
  customPrice: number | string | null;
  billingPeriod: BillingPeriod | null;
  subscription: SubscriptionSummary | null;
}

const unwrap = <T>(response: unknown): T => {
  return (response as { data?: T }).data ?? (response as T);
};

export const getMySubscriptionsAPI = async (): Promise<UserSubscription[]> => {
  const response = await getData<UserSubscription[]>("/user-subscriptions/me");
  return unwrap<UserSubscription[]>(response);
};

export const getAvailableSubscriptionsAPI = async (): Promise<SubscriptionMini[]> => {
  const response = await getData<SubscriptionMini[]>("/subscription/get-mini");
  return unwrap<SubscriptionMini[]>(response);
};

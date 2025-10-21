import { getData } from "@/services/api/apiService";

export interface ApiSubscriptionPlan {
  id?: number;
  name?: string;
  description?: string | null;
  durationDays?: number | null;
}

export interface UserSubscriptionRecord {
  id: number;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  subscription?: ApiSubscriptionPlan | null;
  customName?: string | null;
  customDescription?: string | null;
  customPrice?: number | string | null;
  createdAt?: string | null;
}

const SUBSCRIPTION_ENDPOINTS = ["/subscription/user-subscriptions/me", "/user-subscriptions/me"] as const;

const normalizeResponse = (payload: unknown): UserSubscriptionRecord[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as UserSubscriptionRecord[];
  }

  if (typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data as UserSubscriptionRecord[];
    }
    if (data) {
      return [data as UserSubscriptionRecord];
    }
    return [payload as UserSubscriptionRecord];
  }

  return [];
};

export const getCurrentUserSubscriptionsAPI = async (): Promise<UserSubscriptionRecord[]> => {
  let lastError: unknown = null;

  for (const endpoint of SUBSCRIPTION_ENDPOINTS) {
    try {
      const response = await getData<unknown>(endpoint);
      return normalizeResponse(response);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      lastError = error;

      if (status === 404 || status === 405) {
        continue;
      }

      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
};

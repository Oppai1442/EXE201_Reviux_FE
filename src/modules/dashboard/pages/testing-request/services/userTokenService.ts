import { getData, postData } from "@/services/api/apiService";

export type PlanType = "FREE" | "PRO" | "ENTERPRISE";

export interface UserTokenInfo {
  planType: PlanType;
  remainingTokens: number;
  totalTokens: number;
  planDefaultTokens: number;
  lifetimeConsumedTokens: number;
  nextResetAt: string | null;
  canPurchase: boolean;
}

export const getCurrentUserTokensAPI = async (): Promise<UserTokenInfo> => {
  const response = await getData<UserTokenInfo>("/user-tokens/me");
  return (response as { data: UserTokenInfo }).data ?? (response as UserTokenInfo);
};

export const buyTokensAPI = async (tokens: number): Promise<UserTokenInfo> => {
  const response = await postData<UserTokenInfo>("/user-tokens/buy", { tokens });
  return (response as { data: UserTokenInfo }).data ?? (response as UserTokenInfo);
};

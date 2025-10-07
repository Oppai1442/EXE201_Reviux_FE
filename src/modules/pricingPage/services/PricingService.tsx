import { getData, postData } from "@/services/api/apiService"
import type { SubscriptionMini } from "../types/model"

export const getMiniSubscription = async () => {
    const response = await getData<SubscriptionMini[]>("/subscription/get-mini")
    return response.data
}

export const generateCheckoutAPI = async (req: {
    planId: number,
    isAnnual: boolean
}) => {
    const response = await postData<{sessionId: string}>("/checkout/subscription", req)
    return response.data;
}
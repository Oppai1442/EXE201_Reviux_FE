import { getData, postData } from "@/services/api/apiService"
import { buildQuery } from "@/utils"
import type { checkoutConfirmRedirectResponse, checkoutDetail } from "../types"

export const getCheckoutDetailAPI = async(checkoutId: string | "") => {
    const query = buildQuery({checkoutId})
    const response = await getData<checkoutDetail>(`/checkout/detail?${query}`)
    return response.data
}

export const initiatePaymentAPI = async(req: any) => {
    const response = await postData('/checkout/confirm', req)
    return response.data
}

export const checkoutVnpayConfirm = async(req: any) => {
    const response = await postData<checkoutConfirmRedirectResponse>('/checkout/confirm-redirect', req)
    return response
}

export const checkoutStripeConfirm = async(req: { checkoutId: string; sessionId: string }) => {
    const response = await postData<checkoutConfirmRedirectResponse>('/checkout/stripe/confirm', req)
    return response
}

export const getWalletBalanceAPI = async () => {
    const response = await getData<number>('/wallet/balance')
    return response.data
}

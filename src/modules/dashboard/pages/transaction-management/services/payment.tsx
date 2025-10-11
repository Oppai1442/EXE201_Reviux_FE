import { getData, postData } from "@/services/api/apiService"
import { buildQuery } from "@/utils"

export const generateCheckoutTopupAPI = async(req: any) => {
    const response = await postData<{sessionId: string}>("/checkout/topup", req)
    return response.data
}

export const getMyTransactionSummaryAPI = async () => {
    const response = await getData("/transaction/summary")
    return response.data
}

export const getMyTransactionHistroyAPI = async(page: number = 0, size: number = 10, search: string = "", status: string = "") => {
    const query = buildQuery({page, size, search, status})
    const response = await getData(`/transaction/me?${query}`)
    return response.data
}
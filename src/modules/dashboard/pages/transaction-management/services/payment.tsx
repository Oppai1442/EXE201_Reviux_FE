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

export const getAdminTransactionSummaryAPI = async(filters: Record<string, unknown> = {}) => {
    const query = buildQuery(filters)
    const url = query ? `/transaction/admin/summary?${query}` : "/transaction/admin/summary"
    const response = await getData(url)
    return response.data
}

export const getAdminTransactionsAPI = async(params: Record<string, unknown> = {}) => {
    const query = buildQuery(params)
    const url = query ? `/transaction/admin?${query}` : "/transaction/admin"
    const response = await getData(url)
    return response.data
}

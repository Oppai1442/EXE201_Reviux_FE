import { getData } from "@/services/api/apiService"
import type { UserMini } from "@/types"
import { buildQuery } from "@/utils"

export const getUserSummaryAPI = async() => {
    const response = await getData("/users/sumary")
    return response.data
}

export const getAllUserAPI = async(page: number = 0, size: number = 5, search: string = "", role: string = "", status: string = "all") => {
    const query = buildQuery({page, size, search, role, status})
    const response = await getData<{content: UserMini[]}>(`/users?${query}`)
    return response.data
}
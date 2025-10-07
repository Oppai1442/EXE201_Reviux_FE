import { getData } from "../api/apiService"

export const departmentGetUserDataAPI = async() => {
    const response = await getData("/department/userdata")
    return response.data
}
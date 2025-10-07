import { deleteData, getData, postData, putData } from "@/services/api/apiService"
import type { createSubscriptionRequestDTO, Feature, Subscription, updateSubscriptionRequestDTO } from "../types";
import { buildQuery } from "@/utils";

export const getSubscriptionsAPI = async () => {
    const response = await getData<Subscription[]>("/subscription/get-all");
    return response.data;
}

export const getFeaturesAPI = async () => {
    const response = await getData<Feature[]>("/subscription/get-features")
    return response.data
}

export const createSubscriptionAPI = async (dto: createSubscriptionRequestDTO) => {
    const response = await postData<Subscription>("/subscription/create", dto);
    return response.data;
}

export const updateSubscriptionAPI = async (dto: updateSubscriptionRequestDTO) => {
    const response = await putData("/subscription/update", dto);
    return response.data;
}

export const deleteSubscriptionAPI = async (subscriptionId: number) => {
    const query = buildQuery({ subscriptionId })
    const response = await deleteData(`/subscription/delete?${query}`);
    return response.data;
}

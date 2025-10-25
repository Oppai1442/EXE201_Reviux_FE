import { getData, postData } from '@/services/api/apiService';
import type {
  CreateTicketMessageRequest,
  TicketDetail,
  TicketListResponse,
  TicketMessage,
} from '../types';

export const getMyTicketsAPI = async () => {
  const response = await getData<TicketListResponse>('/ticket/my');
  return response.data;
};

export const getTicketDetailAPI = async (ticketId: number) => {
  const response = await getData<TicketDetail>(`/ticket/my/${ticketId}`);
  return response.data;
};

export const postTicketMessageAPI = async (
  ticketId: number,
  payload: CreateTicketMessageRequest,
) => {
  const response = await postData<TicketMessage>(
    `/ticket/my/${ticketId}/messages`,
    payload,
  );
  return response.data;
};


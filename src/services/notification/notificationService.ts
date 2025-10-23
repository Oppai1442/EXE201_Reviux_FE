import axiosInstance from "@/services/api/axiosInstance";
import type { NotificationDTO, PageResponse } from "@/types/notification";

const BASE_PATH = "/notification";

export interface FetchNotificationOptions {
  page?: number;
  size?: number;
  sort?: string;
}

export const notificationService = {
  async fetchUserNotifications(
    userId: number,
    options: FetchNotificationOptions = {}
  ): Promise<PageResponse<NotificationDTO>> {
    const { page = 0, size = 20, sort = "createdAt,desc" } = options;
    return axiosInstance.get<PageResponse<NotificationDTO>>(
      `${BASE_PATH}/user/${userId}/paged`,
      {
        params: { page, size, sort },
      }
    );
  },

  async markAsRead(id: number): Promise<void> {
    await axiosInstance.post(`${BASE_PATH}/${id}/mark-as-read`);
  },

  async deleteNotification(id: number): Promise<void> {
    await axiosInstance.delete(`${BASE_PATH}/${id}`);
  },
};

export default notificationService;


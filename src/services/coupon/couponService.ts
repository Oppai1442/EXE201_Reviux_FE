import axiosInstance from '@/services/api/axiosInstance';

export type CouponDiscountType = 'PERCENTAGE' | 'FIXED';

export interface CouponDTO {
  id: number;
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  usageCount?: number | null;
  oneTimeUse?: boolean | null;
  specificUserEmail?: string | null;
  totalRevenue?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CouponPayload {
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  oneTimeUse?: boolean;
  specificUserEmail?: string | null;
}

export interface CouponApplyResponse {
  code: string;
  amount: number;
  discount: number;
  finalAmount: number;
  message?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

const COUPON_BASE_URL = '/coupons';

const unwrap = <T>(response: ApiResponse<T> | T): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
};

export const couponService = {
  async getCoupons(): Promise<CouponDTO[]> {
    const response = await axiosInstance.get<ApiResponse<CouponDTO[]> | CouponDTO[]>(COUPON_BASE_URL);
    return unwrap(response);
  },

  async createCoupon(payload: CouponPayload): Promise<CouponDTO> {
    const response = await axiosInstance.post<ApiResponse<CouponDTO> | CouponDTO>(COUPON_BASE_URL, payload);
    return unwrap(response);
  },

  async updateCoupon(id: number, payload: CouponPayload): Promise<CouponDTO> {
    const response = await axiosInstance.put<ApiResponse<CouponDTO> | CouponDTO>(`${COUPON_BASE_URL}/${id}`, payload);
    return unwrap(response);
  },

  async deleteCoupon(id: number): Promise<void> {
    await axiosInstance.delete(`${COUPON_BASE_URL}/${id}`);
  },

  async applyCoupon(code: string, amount: number, user?: { id?: number | null; email?: string | null }): Promise<CouponApplyResponse> {
    const response = await axiosInstance.post<ApiResponse<CouponApplyResponse> | CouponApplyResponse>(
      `${COUPON_BASE_URL}/apply`,
      {
        code,
        amount,
        userId: user?.id ?? undefined,
        userEmail: user?.email ?? undefined,
      }
    );
    return unwrap(response);
  },
};

export default couponService;

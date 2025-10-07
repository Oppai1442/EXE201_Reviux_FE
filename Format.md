

# MSS301 Frontend — **ONE** Coding Standard Guide (React + TS)


## 1) Strategic DDD

* **Bounded Context (BC).** Mỗi BC là 1 module độc lập (payment, subscription, user…), giao tiếp qua API/Event.
* **Ubiquitous Language.** Glossary riêng cho từng BC, dùng thống nhất ở domain/entity, UI, API, test.
* **Context Mapping & ACL.** Khi BC giao tiếp, luôn đặt **Anti-Corruption Layer (ACL)**: mapper DTO⇆Domain để tránh rò rỉ mô hình.

---

## 2) Layered Architecture

```
src/
  contexts/
    <bounded-context>/
      domain/           # Entities, ValueObjects, Aggregates, Events (thuần TS)
      application/      # Use cases, Ports (Repo interfaces), mappers
      infrastructure/   # Adapters: HTTP repos, cache, localStorage, event bus
      presentation/     # React UI: pages, widgets, hooks
```

* **Presentation** chỉ gọi **Application (use case)**.
* **Domain** thuần TS, không phụ thuộc framework/thư viện.

---

## 3) Tactical DDD

* **Entity** có identity, mutable theo lifecycle.
* **Value Object** bất biến, so sánh theo giá trị.
* **Aggregate Root** điều phối thay đổi trong aggregate.
* **Domain Events**: “điều đã xảy ra” để audit, đồng bộ, tích hợp.
* **Repository (Ports)**: định nghĩa interface domain-centric ở application, hiện thực ở infra.

---

## 4) Naming & Structure

* **Thư mục**: `kebab-case`.
* **Component/Type/Class/Enum**: `PascalCase`.
* **Biến/Hàm/Method**: `camelCase`.
* **File**: `PascalCase.tsx` (component, default export), `index.ts` (re-export).
* **Routes**: object `ROUTES` + `getPath()` path động.
* **Types**: tách `types/`, re-export `index.d.ts`.

---

## 5) Hooks & UI

* Hooks `use…`: trả `{ data, loading, error, refetch }`.
* Fetch trong `useEffect`/`useCallback`.
* i18n: `useTranslation`.
* URL utils: `getQueryParam/setQueryParam/deleteQueryParam`.

---

## 6) Service/API — Chuẩn hoá

* **Response shape**: `ApiResponse<T>` (`status, code, message, meta, data`).
* **Pagination**: `PaginatedResponse<T>` + `PaginationParams`.
* **DTO hậu tố**: `…DTO`.
* **Helper**: `buildQuery(params)` dùng xuyên suốt repos.
* **Trả về**: luôn **`data`** cho UI (đúng thói quen code hiện tại).
* **Contract**: giữ tương thích code cũ (hiện nhiều hàm rời `.get/.post` → `response.data`).

---

## 7) API Implementation — Class Pattern

### 7.1 Base HTTP Client

```ts
// src/services/http/BaseApiClient.ts
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from '@/services/api/axiosInstance'; // hoặc axios.create nếu cần tách baseURL

export abstract class BaseApiClient {
  protected http: AxiosInstance;

  constructor(baseURL = '/') {
    this.http = axios;
    this.http.defaults.baseURL = baseURL;
    this.http.defaults.timeout = 15_000;

    this.http.interceptors.request.use((config) => {
      const token = localStorage.getItem('accountToken');
      if (token) (config.headers ??= {}).Authorization = `Bearer ${token}`;
      return config;
    });
  }

  protected async get<T>(url: string, config?: AxiosRequestConfig) {
    const res = await this.http.get<{ data: T }>(url, config);
    return res.data.data;
  }
  protected async post<T>(url: string, body?: any, config?: AxiosRequestConfig) {
    const res = await this.http.post<{ data: T }>(url, body, config);
    return res.data.data;
  }
  protected async put<T>(url: string, body?: any, config?: AxiosRequestConfig) {
    const res = await this.http.put<{ data: T }>(url, body, config);
    return res.data.data;
  }
  protected async delete<T>(url: string, config?: AxiosRequestConfig) {
    const res = await this.http.delete<{ data: T }>(url, config);
    return res.data.data;
  }
}
```

---

### 7.2 Domain vs DTO + Mapper

```ts
// src/contexts/billing/domain/Payment.ts
export interface Payment {
  id: number;
  userId: number;
  amount: number;
  status: 'pending' | 'authorized' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}
```

```ts
// src/contexts/billing/infrastructure/dto/PaymentDTO.ts
export interface PaymentDTO {
  id: number;
  userId: number;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const toDomain = (dto: PaymentDTO): Payment => ({
  ...dto,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});
```

---

### 7.3 Payment Repository Interface

```ts
// src/contexts/billing/application/ports/PaymentRepository.ts
import type { Payment } from '../../domain/Payment';

export interface PaymentRepository {
  authorize(payload: Omit<Payment,'id'|'createdAt'|'updatedAt'>): Promise<Payment>;
  findById(id: number): Promise<Payment>;
  list(params?: PaginationParams): Promise<PaginatedResponse<Payment>>;
  listAll?(params?: PaginationParams): Promise<PaginatedResponse<Payment>>;
  listByUser?(userId: number, params?: PaginationParams): Promise<PaginatedResponse<Payment>>;
  listByStatus?(status: string, params?: PaginationParams): Promise<PaginatedResponse<Payment>>;
  update?(id: number, payload: Omit<Payment,'id'|'createdAt'|'updatedAt'>): Promise<Payment>;
  remove?(id: number): Promise<{ message: string }>;
  refund?(id: number): Promise<Payment>;
  statsByUser(userId: number): Promise<PaymentStats>;
  statsByStatus?(status: string): Promise<PaymentStats>;
}
```

---

### 7.4 Payment HTTP Implementation

```ts
// src/contexts/billing/infrastructure/http/PaymentHttpRepository.ts
import { BaseApiClient } from '@/services/http/BaseApiClient';
import type { PaymentRepository } from '../../application/ports/PaymentRepository';
import { PaymentDTO, toDomain } from '../dto/PaymentDTO';

export class PaymentHttpRepository extends BaseApiClient implements PaymentRepository {
  constructor() { super('/payment'); }

  async authorize(payload: Omit<Payment,'id'|'createdAt'|'updatedAt'>) {
    const dto = await this.post<PaymentDTO>('', payload);
    return toDomain(dto);
  }
  async findById(id: number) {
    const dto = await this.get<PaymentDTO>(`/${id}`);
    return toDomain(dto);
  }
  async list(params: PaginationParams = {}) {
    const q = new URLSearchParams(params as Record<string,string>);
    const dtoPage = await this.get<PaginatedResponse<PaymentDTO>>(`?${q.toString()}`);
    return { ...dtoPage, data: dtoPage.data.map(toDomain) };
  }
  // thêm các method listAll, listByUser, listByStatus, update, remove, statsByStatus … (theo endpoints repo hiện tại)
}
```

---

### 7.5 Subscription HTTP Implementation

```ts
// src/contexts/billing/infrastructure/http/SubscriptionHttpRepository.ts
import { BaseApiClient } from '@/services/http/BaseApiClient';
import type { Subscription, Feature, createSubscriptionRequestDTO, updateSubscriptionRequestDTO } from '@/modules/dashboard/pages/subscription-management/types';

export class SubscriptionHttpRepository extends BaseApiClient {
  getAll() { return this.get<Subscription[]>('/subscription/get-all'); }
  getFeatures() { return this.get<Feature[]>('/subscription/get-features'); }
  create(dto: createSubscriptionRequestDTO) { return this.post<Subscription>('/subscription/create', dto); }
  update(dto: updateSubscriptionRequestDTO) { return this.put<Subscription>('/subscription/update', dto); }
  delete(subscriptionId: number) {
    const q = new URLSearchParams({ subscriptionId: String(subscriptionId) });
    return this.delete<boolean>(`/subscription/delete?${q.toString()}`);
  }
}
```

---

### 7.6 Use Case Example

```ts
// src/contexts/billing/application/authorizePayment.ts
import type { PaymentRepository } from './ports/PaymentRepository';
import type { Payment } from '../domain/Payment';

type Input = Omit<Payment,'id'|'createdAt'|'updatedAt'>;
export const authorizePayment = (repo: PaymentRepository) => async (payload: Input) => {
  return repo.authorize(payload);
};
```

---

## 8) Error Handling & Retry

* Map `status → message`, hiển thị toast (pattern như `handleAuthError`).
* Retry 1–2 lần với backoff nếu `status >= 500`.
* Hỗ trợ `AbortSignal?` để cancel request.
* **Always return domain type cho UI**, không để DTO rò rỉ.

---

## 9) Hooks (View-Model)

* Pattern: `{data, loading, error, refetch}`.
* Ví dụ:

```ts
export const usePayments = () => {
  const repo = new PaymentHttpRepository();
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error|null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await repo.list();
      setData(res.data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
};
```
---

## 10) Routing & Module Surface

* Định nghĩa routes tập trung (public/auth/child) + `getPath`.
* Module index export pages/components (clear entry point).
* Page lazy-load qua `AppRoutes`.

---

## 11) TL;DR — Quy ước cứng

* **BC-driven + 4-layer** (Domain, Application, Infrastructure, Presentation).
* **Naming**: `kebab-case` (dir), `PascalCase` (type/class/component), `camelCase` (func/var).
* **Domain vs DTO**: domain thuần TS, mapper DTO⇆Domain.
* **Repository**: interface domain-centric, infra hiện thực.
* **API**: `BaseApiClient` + `*HttpRepository`, token từ `localStorage`.
* **Hooks**: `{data,loading,error,refetch}`.
* **Always return domain type** cho UI.
* **Giữ contract** để migrate không vỡ UI.

---

## 12) Migration Plan

1. Thêm `BaseApiClient`, `PaymentHttpRepository`, `SubscriptionHttpRepository` (domain/DTO separation).
2. Thay `paymentService` trong hooks bằng repo class (giữ contract).
3. Dần migrate các service còn lại (`department`, `user`, …) → pattern class.
4. Hoàn tất chuyển đổi: toàn bộ UI thao tác qua domain types.
---

## 13) Restful API

1. **Endpoint Naming**

   * Sử dụng **danh từ số nhiều**:

     * `/payments`, `/subscriptions`, `/users`.
   * Sub-resource:

     * `/users/{id}/payments`.

2. **HTTP Verb**

   * `GET /resources` → list.
   * `GET /resources/{id}` → detail.
   * `POST /resources` → create.
   * `PUT /resources/{id}` → full update.
   * `PATCH /resources/{id}` → partial update.
   * `DELETE /resources/{id}` → remove.

3. **Response Code**

   * 200 OK (success).
   * 201 Created (POST success).
   * 204 No Content (DELETE success).
   * 400 Bad Request (validation).
   * 401 Unauthorized.
   * 403 Forbidden.
   * 404 Not Found.
   * 409 Conflict.
   * 500 Internal Server Error.

4. **Query Params**

   * Pagination: `?page=1&limit=20`.
   * Filtering: `?status=active`.
   * Sorting: `?sortBy=createdAt&order=desc`.

5. **Versioning**

   * Prefix: `/api/v1/payments`.
   * Đảm bảo backward compatibility khi nâng version.

6. **Consistency**

   * Body dùng JSON, field `camelCase`.
   * Timestamp ISO 8601 (UTC).
   * Money: số nguyên (cents) hoặc decimal chuẩn.

---

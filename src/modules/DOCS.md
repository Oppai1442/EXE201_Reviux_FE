# 📦 modules/ Structure Guide

Tất cả các **tính năng (feature)** được tổ chức trong `src/modules/`, mỗi module là 1 thư mục chứa đầy đủ UI, logic, state, API.

### 📁 Cấu trúc chuẩn của một module (ví dụ: `auth/`)

```ts
src/modules/auth/
├── components/         # Các UI component chỉ dùng trong auth
│   └── LoginForm.tsx
├── pages/              # Các page được gán với route
│   └── LoginPage.tsx
├── hooks/              # Custom hook logic
│   └── useLogin.ts
├── services/           # Gọi API qua axios hoặc fetch
│   └── authApi.ts
├── store/              # State quản lý nội bộ (Redux/Zustand/Context)
│   └── authStore.ts
├── types.ts            # TypeScript interface / types riêng của module
└── index.ts            # Optional, gom export ra ngoài
```

> ⚠️ Tuyệt đối không để chung các thành phần từ module khác.


---

## 📁 `modules/shared/`

Thư mục này chứa **các phần dùng chung giữa các module**, gồm:

```ts
    src/modules/shared/
    ├── components/         # Button, Modal, Input,...
    ├── hooks/              # useDebounce, useClickOutside,...
    ├── utils/              # formatDate, validateEmail,...
    └── constants/          # Enum, regex, API constants,...
```

---

## ✅ Naming convention

| Loại                 | Cấu trúc tên               | Ví dụ                                | Ghi chú thêm                                 |
| -------------------- | -------------------------- | ------------------------------------ | -------------------------------------------- |
| **Component**        | `PascalCase.tsx`           | `LoginForm.tsx`                      | Một file = một component                     |
| **Page Component**   | `PascalCase.tsx`           | `LoginPage.tsx`                      | Dùng trong router                            |
| **Hook**             | `useXyz.ts`                | `useLogin.ts`                        | Chữ `use` bắt buộc                           |
| **API Service**      | `xxxApi.ts`                | `authApi.ts`                         | Một module 1 file, chia nhỏ nếu phức tạp     |
| **State Store**      | `xxxStore.ts` / `slice.ts` | `authStore.ts` / `authSlice.ts`      | Zustand hoặc Redux                           |
| **Type Definition**  | `types.ts`                 | `types.ts`                           | Trong từng module, gom tất cả interface/type |
| **Enum/Constant**    | `constants.ts`             | `authConstants.ts` / `FormStatus.ts` | Enum, regex, static value                    |
| **Util Function**    | `camelCase.ts`             | `formatDate.ts`, `debounce.ts`       | 1 file = 1 hàm, dùng default export          |
| **Test file**        | `*.test.ts(x)`             | `LoginForm.test.tsx`                 | Đặt cùng cấp hoặc trong `__tests__`          |
| **Style module**     | `Component.module.scss`    | `LoginForm.module.scss`              | Đặt cạnh file `.tsx` cùng tên                |
| **Shared component** | `PascalCase.tsx`           | `Button.tsx`                         | Trong `modules/shared/components/`           |


---

## 🚀 Cách import trong cùng module

Không import từ `src/...`, chỉ import tương đối:

```ts
import LoginForm from '../components/LoginForm';
import { useLogin } from '../hooks/useLogin';

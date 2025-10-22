import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/constant/routes";
import { Loading } from "@/components/Loading";
import {
  getAvailableSubscriptionsAPI,
  getMySubscriptionsAPI,
  type BillingPeriod,
  type SubscriptionFeature,
  type SubscriptionMini,
  type UserSubscription,
} from "./services/mySubscriptionService";
import {
  getCurrentUserTokensAPI,
  type UserTokenInfo,
} from "../testing-request/services/userTokenService";
import { useTranslation } from "react-i18next";

type StatusVariant = "active" | "expired" | "canceled" | "pending";

const parseDate = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseNumber = (value: number | string | null | undefined): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
};

const formatCurrencyValue = (value: number | string | null | undefined): string => {
  const numeric = parseNumber(value);
  if (numeric === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
};

const formatDate = (value: string | null, includeTime = false): string => {
  const parsed = parseDate(value);
  if (!parsed) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(parsed);
};

const humanizeStatus = (status: string | null): { label: string; variant: StatusVariant } => {
  const normalized = status?.trim().toLowerCase() ?? "active";
  if (normalized === "canceled") {
    return { label: "Canceled", variant: "canceled" };
  }
  if (normalized === "expired") {
    return { label: "Expired", variant: "expired" };
  }
  if (normalized === "pending") {
    return { label: "Pending Activation", variant: "pending" };
  }
  return { label: "Active", variant: "active" };
};

const isSubscriptionActive = (subscription: UserSubscription, reference: Date): boolean => {
  const status = subscription.status?.trim().toLowerCase();
  if (status && status !== "active") {
    return false;
  }
  const start = parseDate(subscription.startDate);
  if (start && start > reference) {
    return false;
  }
  const end = parseDate(subscription.endDate);
  if (end && end <= reference) {
    return false;
  }
  return true;
};

const formatBillingPeriod = (period: BillingPeriod | null): string => {
  if (!period) {
    return "Monthly";
  }
  const normalized = period.toString().toLowerCase();
  switch (normalized) {
    case "weekly":
      return "Weekly";
    case "quarterly":
      return "Quarterly";
    case "yearly":
    case "annually":
      return "Yearly";
    case "custom":
      return "Custom";
    case "monthly":
    default:
      return "Monthly";
  }
};

const toDefaultFeatureLabel = (key: string): string => {
  if (!key) return '';

  return key
    .split('_')
    .map((segment) => {
      if (segment.length <= 3 && segment === segment.toUpperCase()) {
        return segment;
      }

      return segment.charAt(0) + segment.slice(1).toLowerCase();
    })
    .join(' ');
};

const formatFeatureValue = (feature: SubscriptionFeature, t: any): string => {
  if (feature.featureValue) {
    const defaultLabel = toDefaultFeatureLabel(feature.featureKey);
    return t(`subscription.features.${feature.featureKey}`, { defaultValue: defaultLabel });

  }
  return feature.featureKey
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatTokenCountdown = (iso: string | null): string => {
  if (!iso) {
    return "—";
  }
  const nextReset = parseDate(iso);
  if (!nextReset) {
    return "—";
  }
  const diffMs = nextReset.getTime() - Date.now();
  if (diffMs <= 0) {
    return "Available now";
  }
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};

const getStatusClasses = (variant: StatusVariant): string => {
  switch (variant) {
    case "expired":
      return "bg-rose-500/15 text-rose-300 border border-rose-500/40";
    case "canceled":
      return "bg-orange-500/15 text-orange-300 border border-orange-500/40";
    case "pending":
      return "bg-amber-500/15 text-amber-300 border border-amber-500/40";
    case "active":
    default:
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";
  }
};

const fallbackFreeFeatures: SubscriptionFeature[] = [
  {
    id: -1,
    featureKey: "FREE_TIER_TOKENS",
    featureValue: "5 tokens every 12 hours",
  },
  {
    id: -2,
    featureKey: "BASIC_REQUESTS",
    featureValue: "Submit basic testing requests",
  },
  {
    id: -3,
    featureKey: "COMMUNITY_SUPPORT",
    featureValue: "Access to community support channel",
  },
];

const MySubscription: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionMini[]>([]);
  const [tokenInfo, setTokenInfo] = useState<UserTokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { t } = useTranslation();

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [subscriptionRes, tokenRes, plansRes] = await Promise.all([
        getMySubscriptionsAPI(),
        getCurrentUserTokensAPI().catch(() => null),
        getAvailableSubscriptionsAPI().catch(() => []),
      ]);
      setSubscriptions(subscriptionRes ?? []);
      setTokenInfo(tokenRes);
      setAvailablePlans(plansRes ?? []);
      setError(null);
    } catch (err) {
      console.error("Failed to load subscription data", err);
      setError("Không thể tải dữ liệu subscription. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeSubscription = useMemo(() => {
    const now = new Date();
    const candidates = subscriptions
      .filter((subscription) => isSubscriptionActive(subscription, now))
      .sort((a, b) => {
        const aDate = parseDate(a.startDate) ?? parseDate(a.createdAt) ?? new Date(0);
        const bDate = parseDate(b.startDate) ?? parseDate(b.createdAt) ?? new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
    return candidates[0] ?? null;
  }, [subscriptions]);

  const activePlanDefinition = useMemo(() => {
    if (!activeSubscription?.subscription?.id) {
      return null;
    }
    return availablePlans.find((plan) => plan.id === activeSubscription.subscription?.id) ?? null;
  }, [activeSubscription, availablePlans]);

  const subscriptionHistory = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      const aDate = parseDate(a.startDate) ?? parseDate(a.createdAt) ?? new Date(0);
      const bDate = parseDate(b.startDate) ?? parseDate(b.createdAt) ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
  }, [subscriptions]);

  const planName = activeSubscription
    ? activeSubscription.subscription?.name ?? activeSubscription.customName ?? "Custom plan"
    : "Free Tier";

  const planStatus = humanizeStatus(activeSubscription?.status ?? (activeSubscription ? "active" : "expired"));

  const planPrice =
    activeSubscription && (activeSubscription.customPrice ?? activeSubscription.subscription?.price)
      ? formatCurrencyValue(activeSubscription.customPrice ?? activeSubscription.subscription?.price)
      : activeSubscription
        ? "Included in plan"
        : "—";

  const billingPeriod = activeSubscription
    ? formatBillingPeriod(activePlanDefinition?.billingPeriod ?? null)
    : "12-hour token refresh";

  const planFeatures: SubscriptionFeature[] = activeSubscription
    ? activePlanDefinition?.features?.length
      ? activePlanDefinition.features
      : activeSubscription.customDescription
        ? [
          {
            id: -1,
            featureKey: "CUSTOM_PLAN_DESCRIPTION",
            featureValue: activeSubscription.customDescription,
          },
        ]
        : []
    : fallbackFreeFeatures;

  const handleRefresh = () => {
    if (!isRefreshing) {
      void loadData();
    }
  };

  const handleManagePlan = () => {
    navigate(ROUTES.PRICING.path);
  };

  const handleGoToTransactions = () => {
    navigate(`${ROUTES.DASHBOARD.path}/${ROUTES.DASHBOARD.child.TRANSACTION.path}`);
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(false);
    alert("Tính năng hủy subscription đang được phát triển. Vui lòng liên hệ đội ngũ hỗ trợ.");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20">
        <header className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-400/80">Subscription Center</p>
              <h1 className="mt-2 text-4xl font-light md:text-5xl">
                Quản lý gói <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">Reviux</span>
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-400">
                Theo dõi gói hiện tại, số token còn lại và lịch sử subscription của bạn. Điều chỉnh kế hoạch để phù hợp với nhu cầu kiểm thử.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Làm mới
              </button>
              <button
                type="button"
                onClick={handleManagePlan}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <CreditCard className="h-4 w-4" />
                Chọn gói khác
              </button>
            </div>
          </div>
          {error ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}
        </header>

        <section className="mb-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-cyan-500/10">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-light text-white">{planName}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(planStatus.variant)}`}>
                      {planStatus.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {activeSubscription
                      ? "Bạn đang sử dụng gói trả phí của Reviux. Token được reset sau mỗi 12 giờ theo chính sách của gói."
                      : "Bạn đang ở free tier. Khám phá các gói nâng cao để có thêm token và tính năng."}
                  </p>
                </div>
                {activeSubscription ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-500/50 hover:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    >
                      <XCircle className="h-4 w-4" />
                      Yêu cầu hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleGoToTransactions}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 px-4 py-2 text-sm text-cyan-300 transition hover:border-cyan-500/60 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Lịch sử thanh toán
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Chi phí</p>
                  <p className="mt-2 text-2xl font-light text-white">{planPrice}</p>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Chu kỳ</p>
                  <p className="mt-2 text-2xl font-light text-white">{billingPeriod}</p>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Bắt đầu</p>
                  <p className="mt-2 text-2xl font-light text-white">{formatDate(activeSubscription?.startDate ?? activeSubscription?.createdAt ?? null)}</p>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Ngày kết thúc</p>
                  <p className="mt-2 text-2xl font-light text-white">{formatDate(activeSubscription?.endDate ?? null)}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm uppercase tracking-[0.35em] text-slate-500">Tính năng bao gồm</h3>
                {planFeatures.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">Thông tin tính năng sẽ được hiển thị khi gói dịch vụ được cập nhật.</p>
                ) : (
                  <ul className="mt-4 grid gap-3 md:grid-cols-2">
                    {planFeatures.map((feature) => (
                      <li key={feature.id} className="flex items-start gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3">
                        <CheckCircle className="mt-0.5 h-4 w-4 text-cyan-400" />
                        <span className="text-sm text-slate-200">{formatFeatureValue(feature, t)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/80">Token Balance</p>
                  <h3 className="mt-2 text-2xl font-light text-white">Token còn lại</h3>
                </div>
                <Shield className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/30 px-4 py-3">
                  <span>Số dư</span>
                  <span className="text-lg font-semibold text-cyan-300">
                    {tokenInfo ? `${tokenInfo.remainingTokens} / ${tokenInfo.totalTokens}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/30 px-4 py-3">
                  <span>Tiếp theo reset</span>
                  <span className="text-sm text-slate-200">{formatTokenCountdown(tokenInfo?.nextResetAt ?? null)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/30 px-4 py-3">
                  <span>Loại gói</span>
                  <span className="text-sm text-slate-200">{tokenInfo?.planType ?? "FREE"}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Token được reset tự động mỗi 12 giờ. Với gói trả phí, bạn có thể mua thêm token thông qua mục Testing Requests.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-cyan-500/10">
              <h3 className="text-lg font-light text-white">Bạn cần thêm?</h3>
              <p className="mt-2 text-sm text-slate-400">
                Khám phá các gói nâng cao với nhiều token hơn, quyền truy cập ưu tiên và tính năng dành cho doanh nghiệp.
              </p>
              <button
                type="button"
                onClick={handleManagePlan}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 px-4 py-2 text-sm text-cyan-300 transition hover:border-cyan-500/60 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                Khám phá gói <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </section>

        <section className="mb-14">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light text-white">Lịch sử subscription</h2>
            <Calendar className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Tất cả gói mà bạn đã đăng ký. Danh sách được sắp xếp theo thời gian gần nhất.
          </p>

          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
            {subscriptionHistory.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">Chưa có subscription nào được ghi nhận.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-950/40 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Gói</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Bắt đầu</th>
                      <th className="px-6 py-4">Kết thúc</th>
                      <th className="px-6 py-4">Chi phí</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
                    {subscriptionHistory.map((item) => {
                      const statusMeta = humanizeStatus(item.status);
                      const itemPrice = formatCurrencyValue(item.customPrice ?? item.subscription?.price);
                      const name = item.subscription?.name ?? item.customName ?? "Custom plan";
                      return (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="font-medium text-white">{name}</div>
                            <div className="text-xs text-slate-400">
                              {item.subscription?.description ?? item.customDescription ?? "Không có mô tả"}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(statusMeta.variant)}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">{formatDate(item.startDate ?? item.createdAt ?? null)}</td>
                          <td className="whitespace-nowrap px-6 py-4">{formatDate(item.endDate ?? null)}</td>
                          <td className="whitespace-nowrap px-6 py-4">{itemPrice}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light text-white">Gợi ý gói nổi bật</h2>
            <TrendingUp className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-2 text-sm text-slate-400">Chọn gói phù hợp để mở khóa thêm token và quyền lợi.</p>

          <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900/60 px-6 py-10 text-center text-sm text-slate-400">
                Chưa có dữ liệu gói subscription để hiển thị.
              </div>
            ) : (
              availablePlans.map((plan) => {
                const isCurrent = plan.id === activeSubscription?.subscription?.id;
                return (
                  <div
                    key={plan.id}
                    className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-cyan-500/10 transition hover:border-cyan-500/40"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-light text-white">{plan.name}</h3>
                      {isCurrent ? (
                        <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
                          Đang sử dụng
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{plan.description ?? "—"}</p>
                    <div className="mt-4 text-3xl font-light text-cyan-300">{formatCurrencyValue(plan.discountPrice ?? plan.price)}</div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{formatBillingPeriod(plan.billingPeriod)}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-200">
                      {plan.features.slice(0, 4).map((feature) => (
                        <li key={feature.id} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 text-cyan-400" />
                          <span>{formatFeatureValue(feature, t)}</span>
                        </li>
                      ))}
                      {plan.features.length > 4 ? (
                        <li className="text-xs text-slate-500">+ {plan.features.length - 4} tính năng khác</li>
                      ) : null}
                    </ul>
                    <button
                      type="button"
                      onClick={handleManagePlan}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 px-4 py-2 text-sm text-cyan-300 transition hover:border-cyan-500/60 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    >
                      Xem chi tiết <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {showCancelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-rose-500/20">
            <div className="flex items-center gap-3 text-rose-200">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-xl font-light">Yêu cầu hủy subscription</h3>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              Sau khi hủy, bạn vẫn có thể sử dụng gói hiện tại đến hết chu kỳ thanh toán. Vui lòng xác nhận để gửi yêu cầu tới đội ngũ hỗ trợ.
            </p>
            <div className="mt-6 space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Gói hiện tại</p>
              <p className="text-lg font-light text-white">{planName}</p>
              <p className="text-sm text-slate-400">
                Chúng tôi sẽ liên hệ để hoàn tất yêu cầu hủy subscription của bạn trong thời gian sớm nhất.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-slate-600"
              >
                Tiếp tục sử dụng
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                className="flex-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition hover:border-rose-500/60 hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                Gửi yêu cầu hủy
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MySubscription;

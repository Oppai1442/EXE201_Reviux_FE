import React, { useCallback, useEffect, useMemo, useState } from "react";
import Joyride, { type CallBackProps, type Step } from "react-joyride";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Activity,
  Eye,
  FileText,
  RefreshCw,
  Loader2,
  Plus,
  Zap,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loading } from "@/components/Loading";
import QATestingForm from "./components/QATestingForm";
import { ticketService } from "@/services/ticket/ticketService";
import { ROUTES } from "@/constant/routes";
import { useNotifications } from "@/context/NotificationContext";
import {
  getBugReportsAPI,
  getTestingRequestDetailsAPI,
  getTestingRequestStatusesAPI,
  acceptTestingQuoteAPI,
  confirmTestingCompletionAPI,
  submitTestingRequestFeedbackAPI,
  type ApiUser,
  type BugComment,
  type BugReport,
  type TestLogInfo,
  type TestingRequestDetails,
  type TestingUpdateInfo,
  type TestingRequestStatusOption,
  type TestingScopeItem,
  type TestingRequestFeedback,
} from "./services/testingRequestService";
import {
  getCurrentUserTokensAPI,
  buyTokensAPI,
  type UserTokenInfo,
} from "./services/userTokenService";
import { buildApiUrl } from "@/utils";

type RequestStatus = string;
type RequestPriority = "urgent" | "high" | "medium" | "low";
type SortField = "createdAt" | "updatedAt" | "progress" | "title" | "status";
type SortDirection = "asc" | "desc";

interface FiltersState {
  status: "all" | RequestStatus;
  priority: "all" | RequestPriority;
  productType: "all" | string;
}

interface RequestItem {
  id: number;
  code: string;
  title: string;
  description: string;
  status: RequestStatus;
  rawStatus: string;
  progress: number;
  priority: RequestPriority;
  productType: string;
  productTypeRaw: string;
  createdAt: string;
  updatedAt: string;
  deadline: string;
  assignedTester: string;
  customerName: string;
  fileUrl: string | null;
  referenceUrl: string | null;
  testingTypes: string[];
  desiredDeadline?: string | null;
  attachmentDownloadUrl?: string | null;
  attachmentFileName?: string | null;
  feedback?: TestingRequestFeedback | null;
  updates: TestingUpdateInfo[];
  logs: TestLogInfo[];
  bugReports: BugReport[];
  requestedTokenFee?: number | null;
  userCouponCode?: string | null;
  userCouponDiscountAmount?: number | null;
  testingScope?: TestingScopeItem[] | null;
  quotedPrice?: number | null;
  quoteCurrency?: string | null;
  quoteNotes?: string | null;
  quoteCustomerNotes?: string | null;
  quoteSentAt?: string | null;
  quoteExpiry?: string | null;
  quoteAcceptedAt?: string | null;
  inProgressAt?: string | null;
  readyForReviewAt?: string | null;
  completedAt?: string | null;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface FilterPanelProps {
  filters: FiltersState;
  productTypes: string[];
  statusOptions: Array<{ value: FiltersState["status"]; label: string }>;
  isOpen: boolean;
  onToggle: () => void;
  onFilterChange: <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => void;
}

interface SortControlProps {
  field: SortField;
  direction: SortDirection;
  onChange: (field: SortField, direction: SortDirection) => void;
}

interface StatChipProps {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: string;
}

interface RequestCardProps {
  item: RequestItem;
  onSelect: (item: RequestItem) => void;
  formatStatusLabel: (status: string) => string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface RequestDetailsDrawerProps {
  request: RequestItem | null;
  onClose: () => void;
  formatStatusLabel: (status: string) => string;
  getStatusMeta: (value?: string | null) => TestingRequestStatusOption;
  onCreateTicket?: (request: RequestItem) => void;
  creatingTicket?: boolean;
  canCreateTicket?: boolean;
  onAcceptQuote?: (request: RequestItem) => void;
  onConfirmCompletion?: (request: RequestItem) => void;
  acceptingQuote?: boolean;
  confirmingCompletion?: boolean;
  onSubmitFeedback?: (request: RequestItem, payload: FeedbackFormValues) => void;
  submittingFeedback?: boolean;
  allowFeedback?: boolean;
}

interface FeedbackFormValues {
  rating: number;
  comment?: string;
}

interface FeedbackPanelProps {
  request: RequestItem;
  allowFeedback?: boolean;
  onSubmitFeedback?: (request: RequestItem, payload: FeedbackFormValues) => void;
  submittingFeedback?: boolean;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  request,
  allowFeedback = false,
  onSubmitFeedback,
  submittingFeedback = false,
}) => {
  const [rating, setRating] = useState<number | null>(request.feedback?.rating ?? null);
  const [comment, setComment] = useState(request.feedback?.comment ?? "");
  const [isEditing, setIsEditing] = useState(!request.feedback);

  useEffect(() => {
    setRating(request.feedback?.rating ?? null);
    setComment(request.feedback?.comment ?? "");
    setIsEditing(!request.feedback);
  }, [request]);

  const canEdit = allowFeedback && request.status === "COMPLETED";
  const displayForm = canEdit && (isEditing || !request.feedback);
  const activeRating = rating ?? 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSubmitFeedback || rating === null) {
      return;
    }
    const payload: FeedbackFormValues = {
      rating,
      comment: comment.trim() ? comment.trim() : undefined,
    };
    onSubmitFeedback(request, payload);
  };

  const starValues = [1, 2, 3, 4, 5];

  return (
    <div className="rounded-2xl border border-gray-800/70 bg-gray-900/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-light text-white">Share your feedback</h3>
          <p className="text-xs text-gray-400">
            A quick rating helps us improve the testing experience.
          </p>
        </div>
        {request.feedback && canEdit && !displayForm && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-cyan-300 hover:text-cyan-100"
          >
            Update feedback
          </button>
        )}
      </div>

      {displayForm ? (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Satisfaction</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {starValues.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full border border-transparent p-1 transition-colors duration-150 ${
                    value <= activeRating ? "text-amber-300" : "text-gray-600 hover:text-gray-400"
                  }`}
                  onClick={() => setRating(value)}
                  aria-label={`Set rating to ${value}`}
                >
                  <Star
                    className="h-6 w-6"
                    fill={value <= activeRating ? "currentColor" : "none"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRating(0)}
                className={`rounded-full border px-2 py-1 text-xs ${
                  activeRating === 0
                    ? "border-rose-400/60 text-rose-300"
                    : "border-gray-800/60 text-gray-500 hover:border-rose-400/40 hover:text-rose-200"
                }`}
              >
                0 - Very dissatisfied
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">
              Comment <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-800/70 bg-gray-900/60 p-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-500/70 focus:outline-none"
              placeholder="Tell us what went well or what needs improvement..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={rating === null || submittingFeedback}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submittingFeedback ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {request.feedback ? "Update Feedback" : "Submit Feedback"}
          </button>
          <p className="text-center text-xs text-gray-500">
            Feedback is required before creating a support ticket.
          </p>
        </form>
      ) : request.feedback ? (
        <div className="mt-4 space-y-3 rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
          <div className="flex items-center gap-2 text-amber-300">
            {starValues.map((value) => (
              <Star
                key={`summary-${value}`}
                className="h-5 w-5"
                strokeWidth={1.5}
                fill={value <= (request.feedback?.rating ?? 0) ? "currentColor" : "none"}
              />
            ))}
            <span className="text-sm text-gray-200">{request.feedback.rating} / 5</span>
          </div>
          {request.feedback.comment ? (
            <p className="text-sm text-gray-200">{request.feedback.comment}</p>
          ) : (
            <p className="text-xs text-gray-500">No additional comments were provided.</p>
          )}
          <div className="text-xs text-gray-500">
            Submitted {formatDateTime(request.feedback.updatedAt ?? request.feedback.createdAt)}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          Feedback has not been recorded yet. Team members can view it once the customer submits their
          rating.
        </p>
      )}
    </div>
  );
};

const DEFAULT_PRIORITY: RequestPriority = "medium";
const ITEMS_PER_PAGE = 6;

const formatCouponDiscount = (value?: number | null) => {
  if (typeof value !== "number") {
    return null;
  }
  if (value >= 0 && value <= 1) {
    const percent = value * 100;
    return `${percent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  }
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const severityPriorityMap: Record<string, RequestPriority> = {
  CRITICAL: "urgent",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const STATUS_DEADLINE_OFFSETS: Record<string, number> = {
  NEW: 10,
  PENDING: 7,
  WAITING_CUSTOMER: 5,
  IN_PROGRESS: 14,
  READY_FOR_REVIEW: 3,
  COMPLETED: 0,
  CANCELLED: 0,
  EXPIRED: 0,
};

const DEFAULT_STATUS_OPTION: TestingRequestStatusOption = {
  code: "UNKNOWN",
  label: "Pending",
  description: "Awaiting next action",
  progress: 20,
  terminal: false,
};

const fallbackStatusLabel = (status: string) =>
  status
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const STATUS_ORDER = [
  "NEW",
  "PENDING",
  "WAITING_CUSTOMER",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
];

const priorityLabels: Record<RequestPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const productTypeLabelMap: Record<string, string> = {
  WEB: "Web Application",
  MOBILE: "Mobile Application",
  API: "API Service",
};

const getStatusBadgeClasses = (status: string): string => {
  const code = status.toUpperCase();
  switch (code) {
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
    case "READY_FOR_REVIEW":
      return "bg-purple-500/10 text-purple-300 border border-purple-500/30";
    case "IN_PROGRESS":
      return "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30";
    case "WAITING_CUSTOMER":
      return "bg-amber-500/10 text-amber-300 border border-amber-500/30";
    case "CANCELLED":
    case "EXPIRED":
      return "bg-rose-500/10 text-rose-300 border border-rose-500/30";
    case "NEW":
    case "PENDING":
      return "bg-sky-500/10 text-sky-300 border border-sky-500/30";
    default:
      return "bg-slate-500/10 text-slate-300 border border-slate-500/30";
  }
};

const priorityClasses: Record<RequestPriority, string> = {
  urgent: "bg-rose-500/10 text-rose-300 border border-rose-500/40",
  high: "bg-orange-500/10 text-orange-300 border border-orange-500/40",
  medium: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/40",
  low: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40",
};

const ticketPriorityMap: Record<RequestPriority, "low" | "medium" | "high"> = {
  urgent: "high",
  high: "high",
  medium: "medium",
  low: "low",
};

const mapPriorityForTicket = (priority: RequestPriority): "low" | "medium" | "high" =>
  ticketPriorityMap[priority] ?? "medium";

const toTimestamp = (value?: string | null) => {
  if (!value) {
    return 0;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatRequestId = (id: number) => `TR-${id.toString().padStart(4, "0")}`;

const formatProductType = (value?: string | null) => {
  if (!value) {
    return "Unknown";
  }
  const label = productTypeLabelMap[value.toUpperCase()];
  if (label) {
    return label;
  }
  const normalized = value.replace(/[_-]+/g, " ").toLowerCase();
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatResetCountdown = (value?: string | null) => {
  if (!value) {
    return "--";
  }
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) {
    return "--";
  }
  const diffMs = target - Date.now();
  if (diffMs <= 0) {
    return "soon";
  }
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  if (days > 0) {
    const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
    return `${days}d ${hours}h`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const buildDisplayName = (user: ApiUser | null | undefined): string => {
  if (!user) {
    return "Unassigned";
  }

  if (user.fullName && user.fullName.trim()) {
    return user.fullName.trim();
  }

  const pieces = [user.firstName, user.lastName]
    .map((part) => (part ? part.trim() : ""))
    .filter(Boolean);
  if (pieces.length) {
    return pieces.join(" ");
  }

  if (user.username && user.username.trim()) {
    return user.username.trim();
  }

  if (user.email && user.email.trim()) {
    return user.email.trim();
  }

  if (user.phone && user.phone.trim()) {
    return user.phone.trim();
  }

  return "Unassigned";
};

const deriveAssignedTester = (detail: TestingRequestDetails, reports: BugReport[]): string => {
  if (detail.updates?.length) {
    const orderedUpdates = [...detail.updates].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
    const lastWithTester = orderedUpdates.find((update) => update.tester);
    if (lastWithTester?.tester) {
      return buildDisplayName(lastWithTester.tester);
    }
  }

  const reportWithTester = reports.find((report) => report.tester);
  if (reportWithTester?.tester) {
    return buildDisplayName(reportWithTester.tester);
  }

  return "Unassigned";
};

const derivePriority = (reports: BugReport[]): RequestPriority => {
  if (!reports?.length) {
    return DEFAULT_PRIORITY;
  }

  const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  for (const severity of severityOrder) {
    if (reports.some((report) => report.severity?.toUpperCase() === severity)) {
      return severityPriorityMap[severity];
    }
  }

  return DEFAULT_PRIORITY;
};

const computeDeadline = (detail: TestingRequestDetails, statusCode: string): string => {
  const base = detail.updatedAt ?? detail.createdAt;
  const baseDate = base ? new Date(base) : new Date();
  const offsetDays = STATUS_DEADLINE_OFFSETS[statusCode] ?? 10;
  if (offsetDays > 0) {
    baseDate.setDate(baseDate.getDate() + offsetDays);
  }

  return baseDate.toISOString();
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrencyAmount = (amount?: number | null, currency?: string | null) => {
  if (amount === null || amount === undefined) {
    return "—";
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return "—";
  }
  const normalizedCurrency =
    currency && currency.trim().length > 0 ? currency.trim().toUpperCase() : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
    }).format(numericAmount);
  } catch (error) {
    return `${normalizedCurrency} ${numericAmount.toFixed(2)}`;
  }
};

const humanizeStatus = (value?: string | null) => {
  if (!value) {
    return "Unknown";
  }
  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusIcon = (status: RequestStatus) => {
  const code = status.toUpperCase();
  switch (code) {
    case "COMPLETED":
      return <CheckCircle className="h-4 w-4" />;
    case "READY_FOR_REVIEW":
      return <Eye className="h-4 w-4" />;
    case "IN_PROGRESS":
      return <Activity className="h-4 w-4" />;
    case "WAITING_CUSTOMER":
      return <AlertCircle className="h-4 w-4" />;
    case "CANCELLED":
    case "EXPIRED":
      return <XCircle className="h-4 w-4" />;
    case "NEW":
    case "PENDING":
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getSeverityMeta = (severity?: string | null) => {
  const normalized = severity?.toUpperCase() ?? "";
  const priority = severityPriorityMap[normalized] ?? DEFAULT_PRIORITY;
  return {
    label: normalized ? normalized.toLowerCase() : "unknown",
    badgeClass: priorityClasses[priority],
  };
};

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Search requests..." }) => (
  <div className="relative">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-800/60 bg-gray-900/60 px-10 py-2 text-sm text-white backdrop-blur focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder:text-gray-500 transition-all duration-300"
    />
  </div>
);

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, productTypes, statusOptions, isOpen, onToggle, onFilterChange }) => {

  const priorityOptions: Array<{ value: FiltersState["priority"]; label: string }> = [
    { value: "all", label: "All priorities" },
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 rounded-lg border border-gray-800/60 bg-gray-900/60 px-4 py-2 text-sm text-white backdrop-blur transition-colors duration-200 hover:border-cyan-500/40 hover:text-cyan-200"
      >
        <Filter className="h-4 w-4" />
        Filters
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-3 w-72 rounded-xl border border-gray-800/70 bg-gray-950/95 p-4 shadow-xl shadow-cyan-500/10 backdrop-blur">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Status</label>
              <select
                value={filters.status}
                onChange={(event) => onFilterChange("status", event.target.value as FiltersState["status"])}
                className="w-full rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">Priority</label>
              <select
                value={filters.priority}
                onChange={(event) => onFilterChange("priority", event.target.value as FiltersState["priority"])}
                className="w-full rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">Product type</label>
              <select
                value={filters.productType}
                onChange={(event) => onFilterChange("productType", event.target.value as FiltersState["productType"])}
                className="w-full rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                <option value="all">All product types</option>
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatProductType(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SortControl: React.FC<SortControlProps> = ({ field, direction, onChange }) => {
  const sortOptions: Array<{ value: SortField; label: string }> = [
    { value: "createdAt", label: "Created date" },
    { value: "updatedAt", label: "Last update" },
    { value: "progress", label: "Progress" },
    { value: "status", label: "Status" },
    { value: "title", label: "Title" },
  ];

  const toggleDirection = () => {
    onChange(field, direction === "asc" ? "desc" : "asc");
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={field}
        onChange={(event) => onChange(event.target.value as SortField, direction)}
        className="rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={toggleDirection}
        className="rounded-lg border border-gray-800/60 bg-gray-900/60 p-2 text-white transition-colors duration-200 hover:border-cyan-500/40 hover:text-cyan-200"
      >
        {direction === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </button>
    </div>
  );
};

const StatChip: React.FC<StatChipProps> = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-2 rounded-full border border-gray-800/60 bg-gray-900/50 px-3 py-1 text-xs text-gray-300">
    <Icon className={`h-3 w-3 ${accent}`} />
    <span>{label}</span>
    <span className="text-white">{value}</span>
  </div>
);

const RequestCard: React.FC<RequestCardProps> = ({ item, onSelect, formatStatusLabel }) => (
  <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-800/60 bg-gray-900/50 p-6 backdrop-blur transition-all duration-300 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10">
    <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-sky-500/5 to-blue-500/5" />
    </div>

    <div className="relative z-10 flex h-full flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-cyan-400/80">{item.code}</div>
          <h3 className="mt-1 text-lg font-light text-white">{item.title}</h3>
        </div>
        <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${getStatusBadgeClasses(item.status)}`}>
          {getStatusIcon(item.status)}
          {formatStatusLabel(item.status)}
        </span>
      </div>

      <p className="text-sm font-light text-gray-300 line-clamp-3">{item.description || "No description provided."}</p>

      <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-500">
            <User className="h-3 w-3" />
            Assigned tester
          </div>
          <div className="text-sm text-gray-200">{item.assignedTester}</div>
        </div>
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-500">
            <Calendar className="h-3 w-3" />
            Created
          </div>
          <div className="text-sm text-gray-200">{formatDate(item.createdAt)}</div>
        </div>
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-500">
            <Clock className="h-3 w-3" />
            Target deadline
          </div>
          <div className="text-sm text-gray-200">{formatDate(item.deadline)}</div>
        </div>
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/50 p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-500">
            <FileText className="h-3 w-3" />
            Product type
          </div>
          <div className="text-sm text-gray-200">{item.productType}</div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
          <span>Progress</span>
          <span className="text-cyan-300">{item.progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatChip icon={MessageCircle} label="Updates" value={item.updates.length} accent="text-cyan-300" />
        <StatChip icon={Activity} label="Logs" value={item.logs.length} accent="text-emerald-300" />
        <StatChip icon={AlertCircle} label="Bug reports" value={item.bugReports.length} accent="text-rose-300" />
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${priorityClasses[item.priority]}`}>
          {priorityLabels[item.priority]}
        </span>
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="flex items-center gap-2 text-sm text-cyan-300 transition-colors duration-200 hover:text-cyan-100"
        >
          View details
          <ArrowDown className="h-4 w-4 -rotate-90" />
        </button>
      </div>
    </div>
  </div>
);

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages: Array<number | "ellipsis"> = [];

  for (let page = 1; page <= totalPages; page += 1) {
    if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return (
    <div id="myreq-tour-pagination" className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-2 text-sm text-white transition-colors duration-200 hover:border-cyan-500/40 hover:text-cyan-200 disabled:pointer-events-none disabled:opacity-40"
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index.toString()}`} className="px-2 text-sm text-gray-500">
            ...
          </span>
        ) : (
          <button
            type="button"
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${page === currentPage
              ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20"
              : "border border-gray-800/60 bg-gray-900/60 text-white hover:border-cyan-500/40 hover:text-cyan-200"
              }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-2 text-sm text-white transition-colors duration-200 hover:border-cyan-500/40 hover:text-cyan-200 disabled:pointer-events-none disabled:opacity-40"
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

const BugCommentsList = ({ comments }: { comments?: BugComment[] }) => {
  if (!comments?.length) {
    return (
      <div className="rounded-lg border border-gray-800/60 bg-gray-900/40 p-3 text-sm text-gray-400">
        No comments yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-lg border border-gray-800/60 bg-gray-900/40 p-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{buildDisplayName(comment.commenter)}</span>
            <span>{formatDateTime(comment.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm text-gray-200">{comment.comment}</p>
        </div>
      ))}
    </div>
  );
};

const RequestDetailsDrawer: React.FC<RequestDetailsDrawerProps> = ({
  request,
  onClose,
  formatStatusLabel,
  getStatusMeta,
  onCreateTicket,
  creatingTicket = false,
  canCreateTicket = false,
  onAcceptQuote,
  onConfirmCompletion,
  acceptingQuote = false,
  confirmingCompletion = false,
  onSubmitFeedback,
  submittingFeedback = false,
  allowFeedback = false,
}) => {
  if (!request) {
    return null;
  }

  const [detailTourRun, setDetailTourRun] = useState(false);
  const [detailTourKey, setDetailTourKey] = useState(() => Date.now());

  const detailSteps = useMemo<Step[]>(() => [
    {
      target: "#myreq-detail-header",
      title: "Request snapshot",
      content: "Quickly review the project summary, latest status, and priority from this panel.",
      disableBeacon: true,
    },
    {
      target: "#myreq-detail-metrics",
      title: "Financial & scope info",
      content: "Token fees, coupon usage, and quote data are organized here for easy reference.",
    },
    {
      target: "#myreq-detail-actions",
      title: "Customer actions",
      content: "Accept quotes, confirm completion, or raise support tickets using these buttons.",
    },
    {
      target: "#myreq-detail-updates",
      title: "Progress timeline",
      content: "See every tester update with its status and timestamp to understand momentum.",
    },
    {
      target: "#myreq-detail-logs",
      title: "Testing logs",
      content: "Execution logs summarize findings collected during testing sessions.",
    },
    {
      target: "#myreq-detail-bugs",
      title: "Bug reports",
      content: "Linked issues, severities, and conversations all live inside this section.",
    },
  ], []);

  const handleDetailTour = useCallback(() => {
    setDetailTourKey(Date.now());
    setDetailTourRun(true);
  }, []);

  const handleDetailTourCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      setDetailTourRun(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur">
      <div className="relative h-full w-full max-w-[95vw] overflow-hidden rounded-3xl border border-gray-800/70 bg-gray-950/95 shadow-2xl shadow-cyan-500/20">
        <Joyride
          key={detailTourKey}
          steps={detailSteps}
          run={detailTourRun}
          continuous
          showProgress
          showSkipButton
          scrollToFirstStep
          disableOverlayClose
          callback={handleDetailTourCallback}
          styles={{
            options: {
              primaryColor: "#06b6d4",
              backgroundColor: "#020617",
              textColor: "#f8fafc",
              zIndex: 11000,
            },
            tooltipContainer: {
              borderRadius: "1rem",
            },
          }}
          locale={{
            next: "Next",
            back: "Back",
            last: "Finish",
            skip: "Skip tour",
          }}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 z-10 text-gray-400 transition-colors duration-200 hover:text-white"
        >
          <XCircle className="h-6 w-6" />
        </button>

        <div className="flex h-full gap-6 p-6">
          {/* Left Column - Main Info */}
          <div className="flex w-2/5 flex-col gap-6 overflow-y-auto pr-2">
            <div id="myreq-detail-header">
              <div className="text-xs text-cyan-400/80">{request.code}</div>
              <h2 className="mt-2 text-2xl font-light text-white">{request.title}</h2>
              <p className="mt-3 text-sm font-light text-gray-300">
                {request.description || "No description provided for this request."}
              </p>
              <button
                type="button"
                onClick={handleDetailTour}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-1.5 text-xs text-white transition-colors duration-200 hover:border-cyan-500/40 hover:text-cyan-200"
              >
                Launch detail tour
              </button>
            </div>

            <div id="myreq-detail-metrics" className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${getStatusBadgeClasses(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {formatStatusLabel(request.status)}
                  </span>
                  <div className="mt-1 text-xs text-gray-400">Updated {formatDateTime(request.updatedAt)}</div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Priority</div>
                <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs ${priorityClasses[request.priority]}`}>
                  {priorityLabels[request.priority]}
                </span>
              </div>

              {typeof request.requestedTokenFee === "number" && (
                <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Scoping Token Fee</div>
                  <div className="mt-2 text-lg font-light text-cyan-300">
                    {request.requestedTokenFee} token{request.requestedTokenFee === 1 ? "" : "s"}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Covers the discovery work QA performs before preparing a detailed quote.
                  </p>
                  {request.testingScope?.length ? (
                    <div className="mt-3 space-y-1 text-xs text-gray-400">
                      {request.testingScope.map((scope) => (
                        <div key={`${scope.type}-${scope.tokens}`} className="flex items-center justify-between rounded-md border border-gray-800/60 bg-gray-900/40 px-2 py-1">
                          <span className="text-gray-300">{scope.type}</span>
                          <span className="text-cyan-300">{scope.tokens}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {request.userCouponCode && (
                <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Coupon</div>
                  <div className="mt-2 text-lg font-light text-emerald-300">{request.userCouponCode}</div>
                  {formatCouponDiscount(request.userCouponDiscountAmount) && (
                    <div className="mt-2 text-xs text-gray-400">
                      Discount applied:{" "}
                      <span className="text-emerald-200">
                        {formatCouponDiscount(request.userCouponDiscountAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Quote Details</div>
                {request.quotedPrice != null ? (
                  <>
                    <div className="mt-2 text-lg font-light text-cyan-300">
                      {formatCurrencyAmount(request.quotedPrice, request.quoteCurrency)}
                    </div>
                    {request.quoteNotes ? (
                      <p className="mt-2 text-sm text-gray-200">{request.quoteNotes}</p>
                    ) : null}
                    <div className="mt-3 space-y-1 text-xs text-gray-400">
                      {request.quoteSentAt && <div>Sent {formatDateTime(request.quoteSentAt)}</div>}
                      {request.quoteExpiry && <div>Expires {formatDateTime(request.quoteExpiry)}</div>}
                      {request.quoteAcceptedAt && (
                        <div className="text-cyan-300">Accepted {formatDateTime(request.quoteAcceptedAt)}</div>
                      )}
                      {request.quoteCustomerNotes && (
                        <div className="italic text-gray-300">
                          Your note: {request.quoteCustomerNotes}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mt-2 text-sm text-gray-400">
                    Waiting for our QA team to send a formal quote. You&apos;ll be notified once it&apos;s ready.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Assigned tester</div>
                <div className="mt-2 text-sm text-gray-200">{request.assignedTester}</div>
              </div>

              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Customer</div>
                <div className="mt-2 text-sm text-gray-200">{request.customerName}</div>
              </div>

              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Created</div>
                <div className="mt-1 text-sm text-gray-200">{formatDateTime(request.createdAt)}</div>
              </div>

              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Target deadline</div>
                <div className="mt-1 text-sm text-gray-200">{formatDateTime(request.deadline)}</div>
              </div>

              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Product type</div>
                <div className="mt-1 text-sm text-gray-200">{request.productType}</div>
              </div>

              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Reference file</div>
                {request.referenceUrl ? (
                  <a
                    href={request.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-100"
                  >
                    <FileText className="h-4 w-4" />
                    Open attachment
                  </a>
                ) : (
                  <div className="mt-2 text-sm text-gray-400">No file attached.</div>
                )}
              </div>
            </div>

            {(request.testingTypes.length > 0 ||
              request.referenceUrl ||
              request.attachmentDownloadUrl ||
              request.desiredDeadline) && (
                <div className="rounded-2xl border border-gray-800/70 bg-gray-900/50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-light text-white">Request scope & assets</h3>
                    {request.desiredDeadline && (
                      <span className="text-xs text-gray-400">
                        Requested deadline: {formatDateTime(request.desiredDeadline)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4 text-sm text-gray-300">
                    {request.testingTypes.length > 0 && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">Testing types</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {request.testingTypes.map((type) => (
                            <span
                              key={type}
                              className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {request.referenceUrl && (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Reference link</div>
                        <a
                          href={request.referenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-cyan-300 transition-colors duration-200 hover:text-cyan-100"
                        >
                          Open
                        </a>
                      </div>
                    )}
                    {request.attachmentDownloadUrl && (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                          <FileText className="h-4 w-4 text-cyan-300" />
                          <span className="truncate">
                            {request.attachmentFileName ?? "Testing assets archive"}
                          </span>
                        </div>
                        <a
                          href={buildApiUrl(request.attachmentDownloadUrl)}
                          className="text-xs text-cyan-300 transition-colors duration-200 hover:text-cyan-100"
                          target="_blank"
                          rel="noreferrer"
                          download={request.attachmentFileName ?? undefined}
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

            <div id="myreq-detail-actions" className="space-y-3">
              {request.status === "WAITING_CUSTOMER" && onAcceptQuote && (
                <button
                  type="button"
                  onClick={() => onAcceptQuote(request)}
                  disabled={acceptingQuote}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {acceptingQuote ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Accept Quote &amp; Start Testing
                </button>
              )}

              {request.status === "READY_FOR_REVIEW" && onConfirmCompletion && (
                <button
                  type="button"
                  onClick={() => onConfirmCompletion(request)}
                  disabled={confirmingCompletion}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirmingCompletion ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Confirm Completion
                </button>
              )}

              {request.status === "COMPLETED" && (
                <FeedbackPanel
                  request={request}
                  allowFeedback={allowFeedback}
                  onSubmitFeedback={onSubmitFeedback}
                  submittingFeedback={submittingFeedback}
                />
              )}

              {canCreateTicket && onCreateTicket && (
                <button
                  type="button"
                  onClick={() => onCreateTicket(request)}
                  disabled={creatingTicket}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingTicket ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Support Ticket
                </button>
              )}

              {!(
                (request.status === "WAITING_CUSTOMER" && onAcceptQuote) ||
                (request.status === "READY_FOR_REVIEW" && onConfirmCompletion) ||
                (canCreateTicket && onCreateTicket)
              ) && (
                <p className="text-center text-xs text-gray-500">No actions available for this request yet.</p>
              )}
            </div>
          </div>

          {/* Right Column - Updates, Logs & Bug Reports */}
          <div className="flex w-3/5 flex-col gap-6 overflow-y-auto pr-2">
            <div id="myreq-detail-updates" className="rounded-2xl border border-gray-800/70 bg-gray-900/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-light text-white">Latest updates</h3>
                  <p className="text-xs text-gray-400">
                    {request.updates.length} update{request.updates.length === 1 ? "" : "s"} recorded
                  </p>
                </div>
              </div>

              {request.updates.length === 0 && (
                <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4 text-sm text-gray-400">
                  No updates recorded for this request.
                </div>
              )}

              <div className="space-y-3">
                {request.updates.map((update) => {
                  const statusMeta = getStatusMeta(update.status);
                  const statusCode = statusMeta.code;
                  return (
                    <div key={update.id} className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-white">{update.updateNote || "No note provided."}</div>
                          <div className="mt-1 text-xs text-gray-400">
                            {buildDisplayName(update.tester)} • {formatDateTime(update.createdAt)}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${getStatusBadgeClasses(statusCode)}`}>
                          {getStatusIcon(statusCode)}
                          {formatStatusLabel(statusCode)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div id="myreq-detail-logs" className="rounded-2xl border border-gray-800/70 bg-gray-900/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-light text-white">Recent test logs</h3>
                  <p className="text-xs text-gray-400">Showing up to 8 latest entries</p>
                </div>
                <span className="text-xs text-gray-500">{request.logs.length} total</span>
              </div>

              {request.logs.length === 0 ? (
                <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4 text-sm text-gray-400">
                  No logs recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {request.logs.slice(0, 8).map((log) => (
                    <div key={log.id} className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="uppercase tracking-wide text-white/70">{log.logLevel}</span>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-200">{log.logMessage}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div id="myreq-detail-bugs" className="rounded-2xl border border-gray-800/70 bg-gray-900/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-light text-white">Bug reports</h3>
                  <p className="text-xs text-gray-400">Linked issues and conversations</p>
                </div>
                <span className="text-xs text-gray-500">{request.bugReports.length} total</span>
              </div>

              {request.bugReports.length === 0 ? (
                <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4 text-sm text-gray-400">
                  No bug reports have been submitted for this request yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {request.bugReports.map((bug) => {
                    const severityMeta = getSeverityMeta(bug.severity);
                    return (
                      <div key={bug.id} className="rounded-2xl border border-gray-800/60 bg-gray-900/40 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm text-white">{bug.title}</div>
                            <div className="text-xs text-gray-500">{formatDateTime(bug.createdAt)}</div>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs uppercase tracking-wide ${severityMeta.badgeClass}`}>
                            {severityMeta.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-200">
                          {bug.description || "No description provided for this bug report."}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                          <span>Status: {humanizeStatus(bug.status)}</span>
                          <span>Tester: {buildDisplayName(bug.tester)}</span>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="text-xs uppercase tracking-wide text-gray-500">Comments</div>
                          <BugCommentsList comments={bug.comments} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, showAuthModal } = useAuth();
  const { notifications } = useNotifications();
  const isStaff = Array.isArray((user as unknown as { roles?: Array<{ name?: string }> })?.roles)
    && ((user as unknown as { roles?: Array<{ name?: string }> }).roles?.some((role) => role?.name === 'STAFF'));
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FiltersState>({ status: "all", priority: "all", productType: "all" });
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<UserTokenInfo | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isBuyingTokens, setIsBuyingTokens] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [acceptingQuote, setAcceptingQuote] = useState(false);
  const [confirmingCompletion, setConfirmingCompletion] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [statusOptions, setStatusOptions] = useState<TestingRequestStatusOption[]>([]);
  const [tourRun, setTourRun] = useState(false);
  const [tourKey, setTourKey] = useState(() => Date.now());

  const statusMap = useMemo(() => {
    const map: Record<string, TestingRequestStatusOption> = {};
    statusOptions.forEach((option) => {
      map[option.code.toUpperCase()] = option;
    });
    return map;
  }, [statusOptions]);

  const getStatusMeta = useCallback(
    (value?: string | null): TestingRequestStatusOption => {
      if (!value) {
        return DEFAULT_STATUS_OPTION;
      }
      const key = value.toUpperCase();
      return statusMap[key] ?? DEFAULT_STATUS_OPTION;
    },
    [statusMap],
  );

  const formatStatusLabel = useCallback(
    (value: string) => {
      const meta = getStatusMeta(value);
      if (meta.code !== DEFAULT_STATUS_OPTION.code || meta.label !== DEFAULT_STATUS_OPTION.label) {
        return meta.label;
      }
      return fallbackStatusLabel(value);
    },
    [getStatusMeta],
  );

  const computeProgressValue = useCallback(
    (detail: TestingRequestDetails) => {
      let progress = getStatusMeta(detail.status).progress;
      detail.updates?.forEach((update) => {
        const updateProgress = getStatusMeta(update.status).progress;
        if (updateProgress > progress) {
          progress = updateProgress;
        }
      });
      return Math.min(100, Math.max(5, progress));
    },
    [getStatusMeta],
  );

  const computeDeadlineValue = useCallback(
    (detail: TestingRequestDetails, statusCode: string) => computeDeadline(detail, statusCode),
    [],
  );

  const statusOptionsForFilter = useMemo(() => {
    const options: Array<{ value: FiltersState["status"]; label: string }> = [
      { value: "all", label: "All statuses" },
    ];
    statusOptions.forEach((option) => {
      if (option.code === DEFAULT_STATUS_OPTION.code) {
        return;
      }
      options.push({ value: option.code, label: option.label || fallbackStatusLabel(option.code) });
    });
    const [allOption, ...rest] = options;
    rest.sort((a, b) => {
      const aIndex = STATUS_ORDER.indexOf(String(a.value).toUpperCase());
      const bIndex = STATUS_ORDER.indexOf(String(b.value).toUpperCase());
      const safeA = aIndex === -1 ? STATUS_ORDER.length : aIndex;
      const safeB = bIndex === -1 ? STATUS_ORDER.length : bIndex;
      return safeA - safeB;
    });
    return [allOption, ...rest];
  }, [statusOptions]);

  const mapDetailToItem = useCallback(
    (detail: TestingRequestDetails, reports: BugReport[]): RequestItem => {
      const statusMeta = getStatusMeta(detail.status);
      const statusCode = statusMeta.code;
      const desiredDeadline = detail.desiredDeadline ?? null;
      const computedDeadline = desiredDeadline ?? computeDeadlineValue(detail, statusCode);

      return {
        id: detail.id,
        code: formatRequestId(detail.id),
        title: detail.title ?? "Untitled request",
        description: detail.description ?? "",
        status: statusCode,
        rawStatus: detail.status ?? "UNKNOWN",
        progress: computeProgressValue(detail),
        priority: derivePriority(reports),
        productType: formatProductType(detail.productType),
        productTypeRaw: detail.productType?.toUpperCase() ?? "UNKNOWN",
        createdAt: detail.createdAt ?? "",
        updatedAt: detail.updatedAt ?? "",
        deadline: computedDeadline,
        desiredDeadline,
        assignedTester: deriveAssignedTester(detail, reports),
        customerName: buildDisplayName(detail.customer),
        fileUrl: detail.fileUrl ?? null,
        referenceUrl: detail.referenceUrl ?? detail.fileUrl ?? null,
        testingTypes: detail.testingTypes ?? [],
        attachmentDownloadUrl: detail.attachmentDownloadUrl ?? null,
        attachmentFileName: detail.attachmentFileName ?? null,
        feedback: detail.feedback ?? null,
        updates: detail.updates ?? [],
        logs: detail.logs ?? [],
        bugReports: reports,
        requestedTokenFee: detail.requestedTokenFee ?? null,
        userCouponCode: detail.userCouponCode ?? null,
        userCouponDiscountAmount: detail.userCouponDiscountAmount ?? null,
        testingScope: detail.testingScope ?? null,
        quotedPrice: detail.quotedPrice ?? null,
        quoteCurrency: detail.quoteCurrency ?? null,
        quoteNotes: detail.quoteNotes ?? null,
        quoteCustomerNotes: detail.quoteCustomerNotes ?? null,
        quoteSentAt: detail.quoteSentAt ?? null,
        quoteExpiry: detail.quoteExpiry ?? null,
        quoteAcceptedAt: detail.quoteAcceptedAt ?? null,
        inProgressAt: detail.inProgressAt ?? null,
        readyForReviewAt: detail.readyForReviewAt ?? null,
        completedAt: detail.completedAt ?? null,
      };
    },
    [computeDeadlineValue, computeProgressValue, getStatusMeta],
  );

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const response = await getTestingRequestStatusesAPI();
        setStatusOptions(response);
      } catch (error) {
        console.error("Failed to load testing request statuses", error);
        toast.error("Unable to load status dictionary. Some labels may appear generic.");
      }
    };

    loadStatuses();
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const fetchTokenInfo = useCallback(async () => {
    if (!user) {
      setTokenInfo(null);
      setTokenError(null);
      setTokenLoading(false);
      return;
    }

    setTokenLoading(true);
    setTokenError(null);

    try {
      const info = await getCurrentUserTokensAPI();
      setTokenInfo(info);
    } catch (error) {
      console.error("Failed to load token balance", error);
      toast.error("Unable to load your token balance right now.");
      setTokenError("Unable to load token balance.");
      setTokenInfo(null);
    } finally {
      setTokenLoading(false);
    }
  }, [user]);

const ownerId = user?.id ?? null;

  const handleCreateTicketFromRequest = useCallback(
    async (request: RequestItem) => {
      if (creatingTicket) {
        return;
      }
      if (!user) {
        toast.error("Please sign in to create a support ticket.");
        showAuthModal("signIn");
        return;
      }

      if (request.status !== 'COMPLETED') {
        toast.error("Support tickets can only be created for completed requests.");
        return;
      }

      setCreatingTicket(true);
      try {
        await ticketService.createTicket({
          userId: user.id,
          subject: `${request.title} (${request.code})`,
          description:
            request.description ||
            `Follow-up ticket for testing request ${request.code}.`,
          priority: mapPriorityForTicket(request.priority),
        });
        toast.success("Support ticket created successfully.");
        setSelectedRequest(null);
        navigate(ROUTES.DASHBOARD.child.MY_TICKET.getPath());
      } catch (error) {
        console.error("Failed to create ticket from testing request", error);
        toast.error("Failed to create support ticket.");
      } finally {
        setCreatingTicket(false);
      }
    },
    [creatingTicket, navigate, showAuthModal, user],
  );

  const handleBuyTokens = useCallback(async () => {
    if (!tokenInfo) {
      toast.error("Token balance is not available yet.");
      return;
    }
    if (!tokenInfo.canPurchase) {
      toast.error("Vui \u1ed3ng mua plan tr\u01b0\u1edbc.");
      return;
    }

    const input = window.prompt("Enter the number of tokens to purchase", "10");
    if (!input) {
      return;
    }

    const parsed = Number.parseInt(input, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Please enter a valid token amount.");
      return;
    }

    try {
      setIsBuyingTokens(true);
      const updated = await buyTokensAPI(parsed);
      setTokenInfo(updated);
      setTokenError(null);
      toast.success(`Purchased ${parsed} token${parsed > 1 ? "s" : ""}.`);
    } catch (error) {
      console.error("Failed to purchase tokens", error);
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? "Failed to purchase tokens. Please try again.");
    } finally {
      setIsBuyingTokens(false);
    }
  }, [tokenInfo]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchTokenInfo();
  }, [authLoading, fetchTokenInfo]);

  const fetchRequests = useCallback(
    async (variant: "initial" | "refresh" = "initial"): Promise<RequestItem[]> => {
      let mapped: RequestItem[] = [];
      if (ownerId === null) {
        setRequests([]);
        if (variant === "initial") {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
        return mapped;
      }

      if (variant === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const [requestDetails, bugReports] = await Promise.all([getTestingRequestDetailsAPI(), getBugReportsAPI()]);

        const bugByRequest = new Map<number, BugReport[]>();
        bugReports.forEach((report) => {
          const requestId = report.request?.id;
          if (requestId == null) {
            return;
          }
          const existing = bugByRequest.get(requestId) ?? [];
          existing.push(report);
          bugByRequest.set(requestId, existing);
        });

        const ownedRequests = requestDetails.filter((detail) => detail.customer?.id === ownerId);

        mapped = ownedRequests.map((detail) => {
          const reports = bugByRequest.get(detail.id) ?? [];
          return mapDetailToItem(detail, reports);
        });

        mapped.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
        setRequests(mapped);
      } catch (error) {
        console.error("Failed to load testing requests", error);
        toast.error("Failed to load your testing requests. Please try again.");
      } finally {
        if (variant === "initial") {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
        return mapped;
      }
    },
    [ownerId, mapDetailToItem],
  );

  const refreshRequestsAndSelect = useCallback(
    async (requestId: number) => {
      const updated = await fetchRequests("refresh");
      const refreshed = updated.find((item) => item.id === requestId) ?? null;
      setSelectedRequest(refreshed);
    },
    [fetchRequests],
  );

  const handleAcceptQuote = useCallback(
    async (request: RequestItem) => {
      if (acceptingQuote) {
        return;
      }
      setAcceptingQuote(true);
      try {
        await acceptTestingQuoteAPI(request.id);
        toast.success("Quote accepted. Our QA team will begin their work.");
        await refreshRequestsAndSelect(request.id);
      } catch (error) {
        console.error("Failed to accept quote", error);
        toast.error("Unable to accept the quote at this time.");
      } finally {
        setAcceptingQuote(false);
      }
    },
    [acceptingQuote, refreshRequestsAndSelect],
  );

  const handleConfirmCompletion = useCallback(
    async (request: RequestItem) => {
      if (confirmingCompletion) {
        return;
      }
      setConfirmingCompletion(true);
      try {
        await confirmTestingCompletionAPI(request.id);
        toast.success("Thanks for confirming the testing results.");
        await refreshRequestsAndSelect(request.id);
      } catch (error) {
        console.error("Failed to confirm completion", error);
        toast.error("Unable to confirm completion right now.");
      } finally {
        setConfirmingCompletion(false);
      }
    },
    [confirmingCompletion, refreshRequestsAndSelect],
  );

  const handleSubmitFeedback = useCallback(
    async (request: RequestItem, payload: FeedbackFormValues) => {
      if (submittingFeedback) {
        return;
      }
      setSubmittingFeedback(true);
      const trimmedPayload: FeedbackFormValues = {
        rating: payload.rating,
        comment: payload.comment?.trim() ? payload.comment.trim() : undefined,
      };
      try {
        const feedback = await submitTestingRequestFeedbackAPI(request.id, trimmedPayload);
        setRequests((prev) =>
          prev.map((item) => (item.id === request.id ? { ...item, feedback } : item)),
        );
        setSelectedRequest((prev) => (prev && prev.id === request.id ? { ...prev, feedback } : prev));
        toast.success("Thanks for sharing your feedback!");
      } catch (error) {
        console.error("Failed to submit testing request feedback", error);
        toast.error("Unable to save your feedback right now.");
      } finally {
        setSubmittingFeedback(false);
      }
    },
    [submittingFeedback],
  );

  useEffect(() => {
    if (statusOptions.length > 0 && ownerId !== null) {
      fetchRequests("refresh");
    }
  }, [statusOptions, ownerId, fetchRequests]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      setRequests([]);
      setSelectedRequest(null);
      setShowCreateForm(false);
      return;
    }

    fetchRequests("initial");
  }, [authLoading, user, fetchRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortField, sortDirection]);

  // Realtime refresh on notifications affecting my requests (list + open drawer)
  useEffect(() => {
    const relevantTypes = new Set([
      'TESTING_REQUEST',
      'TESTING_UPDATE',
      'TEST_LOG',
      'BUG_REPORT',
      'BUG_COMMENT',
    ]);
    const hasRelevant = notifications.some((n) => relevantTypes.has(n.type));
    if (!hasRelevant) return;

    // If a request drawer is open, refresh that specific item and keep it selected
    if (selectedRequest) {
      void refreshRequestsAndSelect(selectedRequest.id);
    } else {
      // Otherwise refresh the whole list quietly
      void fetchRequests('refresh');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const productTypes = useMemo(() => {
    const values = new Set<string>();
    requests.forEach((request) => {
      if (request.productTypeRaw && request.productTypeRaw !== "UNKNOWN") {
        values.add(request.productTypeRaw);
      }
    });
    return Array.from(values).sort();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    let items = [...requests];
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      items = items.filter((item) => {
        const haystacks = [
          item.title,
          item.code,
          item.assignedTester,
          item.productType,
          item.customerName,
          formatStatusLabel(item.status),
        ];
        return haystacks.some((value) => value.toLowerCase().includes(term));
      });
    }

    if (filters.status !== "all") {
      items = items.filter((item) => item.status === filters.status);
    }
    if (filters.priority !== "all") {
      items = items.filter((item) => item.priority === filters.priority);
    }
    if (filters.productType !== "all") {
      items = items.filter((item) => item.productTypeRaw === filters.productType);
    }

    const sorted = [...items].sort((a, b) => {
      switch (sortField) {
        case "createdAt":
          return toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
        case "updatedAt":
          return toTimestamp(a.updatedAt) - toTimestamp(b.updatedAt);
        case "progress":
          return a.progress - b.progress;
        case "status":
          const aIndex = STATUS_ORDER.indexOf(a.status.toUpperCase());
          const bIndex = STATUS_ORDER.indexOf(b.status.toUpperCase());
          const safeA = aIndex === -1 ? STATUS_ORDER.length : aIndex;
          const safeB = bIndex === -1 ? STATUS_ORDER.length : bIndex;
          return safeA - safeB;
        case "title":
        default:
          return a.title.localeCompare(b.title);
      }
    });

    if (sortDirection === "desc") {
      sorted.reverse();
    }

    return sorted;
  }, [requests, searchTerm, filters, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const hasVisibleRequests = paginatedRequests.length > 0;
  const hasMultiplePages = totalPages > 1;

  const tourSteps = useMemo<Step[]>(() => {
    const steps: Step[] = [
      {
        target: "#myreq-tour-header",
        title: "Welcome to your testing hub",
        content: "This control bar keeps quick actions like creating new requests, refreshing data, and launching this guide.",
        disableBeacon: true,
      },
      {
        target: "#myreq-tour-new-request",
        title: "Submit a request",
        content: "Kick off a new QA request when you have enough tokens available.",
      },
      {
        target: "#myreq-tour-tokens",
        title: "Token overview",
        content: "Track remaining tokens, reset window, and purchase top-ups without leaving the page.",
      },
      {
        target: "#myreq-tour-stats",
        title: "Status at a glance",
        content: "These tiles summarize totals, active work, completions, and high-priority items.",
      },
      {
        target: "#myreq-tour-controls",
        title: "Search & filters",
        content: "Combine search, filters, and sorting to zero in on the requests you need.",
      },
      {
        target: "#myreq-tour-list",
        title: "Request catalogue",
        content: "Each card highlights scope, status, testers, and shortcuts to detailed information.",
      },
    ];

    if (hasVisibleRequests) {
      steps.push({
        target: "#myreq-tour-card",
        title: "Card actions",
        content: "Open the details drawer to review updates, accept quotes, or confirm completion.",
      });
    }

    if (hasMultiplePages) {
      steps.push({
        target: "#myreq-tour-pagination",
        title: "Navigate history",
        content: "Use pagination controls to explore archived requests while keeping filters intact.",
      });
    }

    return steps;
  }, [hasMultiplePages, hasVisibleRequests]);

  const handleTourCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      setTourRun(false);
    }
  }, []);

  const handleStartTour = useCallback(() => {
    if (requests.length === 0) {
      toast.error("You need at least one testing request to start the tour.");
      return;
    }
    setTourKey(Date.now());
    setTourRun(true);
  }, [requests.length]);

  const summary = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let highPriority = 0;
    const activeStatuses = new Set(["NEW", "PENDING", "WAITING_CUSTOMER", "IN_PROGRESS", "READY_FOR_REVIEW"]);
    requests.forEach((item) => {
      const statusCode = item.status.toUpperCase();
      if (statusCode === "COMPLETED") {
        completed += 1;
      }
      if (activeStatuses.has(statusCode)) {
        inProgress += 1;
      }
      if (item.priority === "urgent" || item.priority === "high") {
        highPriority += 1;
      }
    });
    return {
      total: requests.length,
      inProgress,
      completed,
      highPriority,
    };
  }, [requests]);

  const handleFilterChange = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    if (isRefreshing) {
      return;
    }
    fetchRequests("refresh");
    void fetchTokenInfo();
  };

  const handleOpenCreateForm = () => {
    setSelectedRequest(null);
    if (tokenLoading) {
      toast.error("Token balance is loading. Please try again in a moment.");
      return;
    }
    if (tokenInfo && tokenInfo.remainingTokens <= 0) {
        toast.error("Vui \u1ed3ng mua plan tr\u01b0\u1edbc.");
      return;
    }
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleRequestSubmitted = () => {
    setShowCreateForm(false);
    fetchRequests("refresh").catch(() => {
      /* handled by fetchRequests toast */
    });
    void fetchTokenInfo();
  };

  const handleRequireTokens = useCallback(
    (neededTokens: number) => {
      setShowCreateForm(false);
      if (tokenInfo?.canPurchase) {
        toast.error(`You need ${neededTokens} token${neededTokens > 1 ? "s" : ""}. Buy more tokens to continue.`);
      } else {
        toast.error("Vui \u1ed3ng mua plan tr\u01b0\u1edbc.");
      }
    },
    [tokenInfo],
  );

  if (authLoading || tokenLoading || isLoading) {
    return <Loading isVisible variant="fullscreen" message="Loading your testing requests..." />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-gray-950 text-white">
        <div className="rounded-2xl border border-gray-800/60 bg-gray-900/60 px-6 py-5 text-center shadow-lg shadow-cyan-500/10">
          <h2 className="text-xl font-light">Sign in required</h2>
          <p className="mt-2 text-sm text-gray-400">Please sign in to view and track your testing requests.</p>
          <button
            type="button"
            onClick={() => showAuthModal("signIn")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-2 text-sm text-white transition-transform duration-200 hover:scale-105"
          >
            <User className="h-4 w-4" />
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <Joyride
        key={tourKey}
        steps={tourSteps}
        run={tourRun && tourSteps.length > 0}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        disableOverlayClose
        callback={handleTourCallback}
        styles={{
          options: {
            primaryColor: "#06b6d4",
            backgroundColor: "#020617",
            textColor: "#f8fafc",
            zIndex: 10000,
          },
          tooltipContainer: {
            borderRadius: "1rem",
          },
        }}
        locale={{
          next: "Next",
          back: "Back",
          last: "Finish",
          skip: "Skip tour",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.12), transparent)`,
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

      { /* HEADER */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header
          id="myreq-tour-header"
          className="sticky top-0 z-10 -mx-4 mb-8 border-b border-gray-800/60 bg-gray-950/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-light tracking-tight">
                <span className="bg-gradient-to-r from-white via-cyan-400 to-white bg-clip-text text-transparent">
                  My Testing Requests
                </span>
              </h1>
              <p className="mt-1 text-sm text-gray-400">Monitor your submissions, progress, and testing feedback.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartTour}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-800/60 bg-gray-900/60 px-4 py-2 text-sm text-white transition-colors duration-200 hover:border-cyan-500/40 hover:text-cyan-200"
              >
                Guided Tour
              </button>
              <button
                type="button"
                id="myreq-tour-new-request"
                onClick={handleOpenCreateForm}
                disabled={showCreateForm || tokenLoading || (tokenInfo != null && tokenInfo.remainingTokens <= 0)}
                title={tokenInfo && tokenInfo.remainingTokens <= 0 ? "Not enough tokens" : undefined}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                New Request
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-800/60 bg-gray-900/60 px-4 py-2 text-sm text-white transition-colors duration-200 hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-50"
              >
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </header>

        <div id="myreq-tour-tokens" className="mb-8 rounded-2xl border border-gray-800/60 bg-gray-900/60 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm text-gray-400">Remaining tokens</div>
                <div className="text-xl font-semibold text-white">
                  {tokenInfo ? `${tokenInfo.remainingTokens} / ${tokenInfo.totalTokens}` : "--"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Next reset in</div>
              <div className="text-xl font-semibold text-white">{formatResetCountdown(tokenInfo?.nextResetAt)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Plan type</div>
              <div className="text-xl font-semibold text-white">{(tokenInfo?.planType ?? "FREE").toUpperCase()}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void handleBuyTokens();
              }}
              disabled={!tokenInfo || !tokenInfo.canPurchase || isBuyingTokens}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBuyingTokens ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {isBuyingTokens ? "Processing..." : "Buy more tokens"}
            </button>
            <div className="text-xs text-gray-500">
              {tokenInfo?.canPurchase
                ? "Purchased tokens are added on top of your plan allocation."
                : "Upgrade to a paid plan to purchase additional tokens."}
            </div>
          </div>
          {tokenError ? <p className="mt-3 text-xs text-rose-400">{tokenError}</p> : null}
        </div>

        <div id="myreq-tour-stats" className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-800/60 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-400">Total requests</div>
            <div className="mt-2 text-2xl font-light text-white">{summary.total}</div>
          </div>
          <div className="rounded-2xl border border-gray-800/60 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-400">Active</div>
            <div className="mt-2 text-2xl font-light text-cyan-300">{summary.inProgress}</div>
          </div>
          <div className="rounded-2xl border border-gray-800/60 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-400">Completed</div>
            <div className="mt-2 text-2xl font-light text-emerald-300">{summary.completed}</div>
          </div>
          <div className="rounded-2xl border border-gray-800/60 bg-gray-900/60 p-4">
            <div className="text-sm text-gray-400">High priority</div>
            <div className="mt-2 text-2xl font-light text-rose-300">{summary.highPriority}</div>
          </div>
        </div>

        <div id="myreq-tour-controls" className="mb-8 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by title, code, tester, or status..." />
          </div>
          <div className="flex gap-3">
            <FilterPanel
              filters={filters}
              productTypes={productTypes}
              statusOptions={statusOptionsForFilter}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen((prev) => !prev)}
              onFilterChange={handleFilterChange}
            />
            <SortControl
              field={sortField}
              direction={sortDirection}
              onChange={(field, direction) => {
                setSortField(field);
                setSortDirection(direction);
              }}
            />
          </div>
        </div>

        <div id="myreq-tour-list">
          {paginatedRequests.length === 0 ? (
            <div className="rounded-2xl border border-gray-800/60 bg-gray-900/60 py-16 text-center">
              <h3 className="text-lg font-light text-gray-300">No requests match the current filters.</h3>
              <p className="mt-2 text-sm text-gray-500">Try updating your search terms or reset the filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {paginatedRequests.map((request, index) => (
                <div id={index === 0 ? "myreq-tour-card" : undefined} key={request.id}>
                  <RequestCard
                    item={request}
                    onSelect={setSelectedRequest}
                    formatStatusLabel={formatStatusLabel}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-800/70 bg-gray-950/95 p-6 shadow-2xl shadow-cyan-500/20">
            <QATestingForm
              onClose={handleCloseCreateForm}
              onSubmitted={handleRequestSubmitted}
              tokenInfo={tokenInfo}
              onRequireTokens={handleRequireTokens}
            />
          </div>
        </div>
      )}

      <RequestDetailsDrawer
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        formatStatusLabel={formatStatusLabel}
        getStatusMeta={getStatusMeta}
        onCreateTicket={handleCreateTicketFromRequest}
        creatingTicket={creatingTicket}
        canCreateTicket={Boolean(
          selectedRequest && selectedRequest.status === "COMPLETED" && !isStaff && selectedRequest.feedback,
        )}
        onAcceptQuote={handleAcceptQuote}
        onConfirmCompletion={handleConfirmCompletion}
        acceptingQuote={acceptingQuote}
        confirmingCompletion={confirmingCompletion}
        onSubmitFeedback={handleSubmitFeedback}
        submittingFeedback={submittingFeedback}
        allowFeedback={!isStaff}
      />
    </div>
          <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-spin {
          animation: spin 1s linear;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </>
  );
};

export default MyRequestsPage;

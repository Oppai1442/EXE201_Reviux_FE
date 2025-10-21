import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  FileText,
  RefreshCw,
  Loader2,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Loading } from "@/components/Loading";
import QATestingForm from "./components/QATestingForm";
import {
  getBugReportsAPI,
  getTestingRequestDetailsAPI,
  type ApiUser,
  type BugComment,
  type BugReport,
  type TestLogInfo,
  type TestingRequestDetails,
  type TestingUpdateInfo,
} from "./services/testingRequestService";

type NormalizedStatus = "pending" | "in-progress" | "completed" | "failed";
type RequestPriority = "urgent" | "high" | "medium" | "low";
type SortField = "createdAt" | "updatedAt" | "progress" | "title" | "status";
type SortDirection = "asc" | "desc";

interface FiltersState {
  status: "all" | NormalizedStatus;
  priority: "all" | RequestPriority;
  productType: "all" | string;
}

interface RequestItem {
  id: number;
  code: string;
  title: string;
  description: string;
  status: NormalizedStatus;
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
  updates: TestingUpdateInfo[];
  logs: TestLogInfo[];
  bugReports: BugReport[];
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface FilterPanelProps {
  filters: FiltersState;
  productTypes: string[];
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
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface RequestDetailsDrawerProps {
  request: RequestItem | null;
  onClose: () => void;
}

const DEFAULT_PRIORITY: RequestPriority = "medium";
const ITEMS_PER_PAGE = 6;

const statusDictionary: Record<string, { status: NormalizedStatus; progress: number }> = {
  NEW: { status: "pending", progress: 15 },
  QUEUED: { status: "pending", progress: 20 },
  WAITING_CUSTOMER: { status: "pending", progress: 30 },
  PENDING_REVIEW: { status: "in-progress", progress: 55 },
  IN_PROGRESS: { status: "in-progress", progress: 65 },
  READY_FOR_REVIEW: { status: "in-progress", progress: 85 },
  COMPLETED: { status: "completed", progress: 100 },
  BLOCKED: { status: "failed", progress: 35 },
  FAILED: { status: "failed", progress: 25 },
  CANCELLED: { status: "failed", progress: 20 },
};

const severityPriorityMap: Record<string, RequestPriority> = {
  CRITICAL: "urgent",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const statusWeights: Record<NormalizedStatus, number> = {
  pending: 1,
  "in-progress": 2,
  completed: 3,
  failed: 4,
};

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

const statusPillClasses: Record<NormalizedStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/40",
  "in-progress": "bg-cyan-500/10 text-cyan-300 border border-cyan-500/40",
  completed: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40",
  failed: "bg-rose-500/10 text-rose-300 border border-rose-500/40",
};

const priorityClasses: Record<RequestPriority, string> = {
  urgent: "bg-rose-500/10 text-rose-300 border border-rose-500/40",
  high: "bg-orange-500/10 text-orange-300 border border-orange-500/40",
  medium: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/40",
  low: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40",
};

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

const normalizeStatus = (value?: string | null): { status: NormalizedStatus; progress: number } => {
  if (!value) {
    return { status: "pending", progress: 20 };
  }
  const normalized = statusDictionary[value.toUpperCase()];
  if (normalized) {
    return normalized;
  }
  return { status: "pending", progress: 20 };
};

const computeProgress = (detail: TestingRequestDetails): number => {
  let progress = normalizeStatus(detail.status).progress;

  if (detail.updates?.length) {
    detail.updates.forEach((update) => {
      const mapped = normalizeStatus(update.status);
      if (mapped.progress > progress) {
        progress = mapped.progress;
      }
    });
  }

  return Math.min(100, Math.max(5, progress));
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

const computeDeadline = (detail: TestingRequestDetails, status: NormalizedStatus): string => {
  const base = detail.updatedAt ?? detail.createdAt;
  const baseDate = base ? new Date(base) : new Date();
  const offsets: Record<NormalizedStatus, number> = {
    pending: 10,
    "in-progress": 14,
    completed: 0,
    failed: 5,
  };

  const days = offsets[status] ?? 10;
  if (days > 0) {
    baseDate.setDate(baseDate.getDate() + days);
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

const getStatusIcon = (status: NormalizedStatus) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "failed":
      return <XCircle className="h-4 w-4" />;
    case "in-progress":
      return <Activity className="h-4 w-4" />;
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

const mapDetailToItem = (detail: TestingRequestDetails, reports: BugReport[]): RequestItem => {
  const normalizedStatus = normalizeStatus(detail.status);
  const desiredDeadline = detail.desiredDeadline ?? null;
  const computedDeadline = desiredDeadline ?? computeDeadline(detail, normalizedStatus.status);
  return {
    id: detail.id,
    code: formatRequestId(detail.id),
    title: detail.title ?? "Untitled request",
    description: detail.description ?? "",
    status: normalizedStatus.status,
    rawStatus: detail.status ?? "UNKNOWN",
    progress: computeProgress(detail),
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
    updates: detail.updates ?? [],
    logs: detail.logs ?? [],
    bugReports: reports,
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

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, productTypes, isOpen, onToggle, onFilterChange }) => {
  const statusOptions: Array<{ value: FiltersState["status"]; label: string }> = [
    { value: "all", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In progress" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Blocked / Failed" },
  ];

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

const RequestCard: React.FC<RequestCardProps> = ({ item, onSelect }) => (
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
        <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${statusPillClasses[item.status]}`}>
          {getStatusIcon(item.status)}
          {humanizeStatus(item.rawStatus)}
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
    <div className="mt-8 flex items-center justify-center gap-2">
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

const RequestDetailsDrawer: React.FC<RequestDetailsDrawerProps> = ({ request, onClose }) => {
  if (!request) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur">
      <div className="relative h-full w-full max-w-[95vw] overflow-hidden rounded-3xl border border-gray-800/70 bg-gray-950/95 shadow-2xl shadow-cyan-500/20">
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
            <div>
              <div className="text-xs text-cyan-400/80">{request.code}</div>
              <h2 className="mt-2 text-2xl font-light text-white">{request.title}</h2>
              <p className="mt-3 text-sm font-light text-gray-300">
                {request.description || "No description provided for this request."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-800/70 bg-gray-900/50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${statusPillClasses[request.status]}`}>
                    {getStatusIcon(request.status)}
                    {humanizeStatus(request.rawStatus)}
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
                          href={request.attachmentDownloadUrl}
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
          </div>

          {/* Right Column - Updates, Logs & Bug Reports */}
          <div className="flex w-3/5 flex-col gap-6 overflow-y-auto pr-2">
            <div className="rounded-2xl border border-gray-800/70 bg-gray-900/50 p-5">
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
                  const normalized = normalizeStatus(update.status);
                  return (
                    <div key={update.id} className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-white">{update.updateNote || "No note provided."}</div>
                          <div className="mt-1 text-xs text-gray-400">
                            {buildDisplayName(update.tester)} • {formatDateTime(update.createdAt)}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${statusPillClasses[normalized.status]}`}>
                          {getStatusIcon(normalized.status)}
                          {humanizeStatus(update.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800/70 bg-gray-900/50 p-5">
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

            <div className="rounded-2xl border border-gray-800/70 bg-gray-900/50 p-5">
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
  const { user, loading: authLoading, showAuthModal } = useAuth();
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

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const ownerId = user?.id ?? null;

  const fetchRequests = useCallback(
    async (variant: "initial" | "refresh" = "initial") => {
      if (ownerId === null) {
        setRequests([]);
        if (variant === "initial") {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
        return;
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

        const mapped = ownedRequests.map((detail) => {
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
      }
    },
    [ownerId],
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setIsLoading(false);
      setRequests([]);
      return;
    }
    fetchRequests("initial");
  }, [authLoading, user, fetchRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortField, sortDirection]);

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
          humanizeStatus(item.rawStatus),
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
          return statusWeights[a.status] - statusWeights[b.status];
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

  const summary = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let highPriority = 0;
    requests.forEach((item) => {
      if (item.status === "completed") {
        completed += 1;
      }
      if (item.status === "in-progress" || item.status === "pending") {
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
    if (!isRefreshing) {
      fetchRequests("refresh");
    }
  };

  const handleOpenCreateForm = () => {
    setSelectedRequest(null);
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
  };

  if (authLoading || isLoading) {
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
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.12), transparent)`,
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

      { /* HEADER */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-10 -mx-4 mb-8 border-b border-gray-800/60 bg-gray-950/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
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
                onClick={handleOpenCreateForm}
                disabled={showCreateForm}
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

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
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

        <div className="mb-8 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by title, code, tester, or status..." />
          </div>
          <div className="flex gap-3">
            <FilterPanel
              filters={filters}
              productTypes={productTypes}
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

        {paginatedRequests.length === 0 ? (
          <div className="rounded-2xl border border-gray-800/60 bg-gray-900/60 py-16 text-center">
            <h3 className="text-lg font-light text-gray-300">No requests match the current filters.</h3>
            <p className="mt-2 text-sm text-gray-500">Try updating your search terms or reset the filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {paginatedRequests.map((request) => (
              <RequestCard key={request.id} item={request} onSelect={setSelectedRequest} />
            ))}
          </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-800/70 bg-gray-950/95 p-6 shadow-2xl shadow-cyan-500/20">
            <QATestingForm onClose={handleCloseCreateForm} onSubmitted={handleRequestSubmitted} />
          </div>
        </div>
      )}

      <RequestDetailsDrawer request={selectedRequest} onClose={() => setSelectedRequest(null)} />
    </div>
  );
};

export default MyRequestsPage;

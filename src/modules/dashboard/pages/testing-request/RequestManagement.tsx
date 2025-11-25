import { useState, useEffect, useRef, useCallback, useMemo, type FormEvent } from 'react';
import Joyride, { type CallBackProps, type Step } from 'react-joyride';
import {
  Search,
  Filter,
  ChevronDown,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import AssignTesterForm from './components/AssignTesterForm';
import { useNotifications } from '@/context/NotificationContext';
import QuoteForm, { type QuoteFormState } from './components/QuoteForm';
import StatusUpdateForm from './components/StatusUpdateForm';
import TestLogForm from './components/TestLogForm';
import BugReportForm from './components/BugReportForm';
import {
  getBugReportsAPI,
  getTestingRequestDetailsAPI,
  createTestingUpdateAPI,
  createTestLogAPI,
  createBugReportAPI,
  getAssignableTestersAPI,
  getTestingRequestStatusesAPI,
  updateTestingRequestStatusAPI,
  sendTestingQuoteAPI,
  markReadyForReviewAPI,
  type BugReport,
  type TestingRequestDetails,
  type TestingUpdateInfo,
  type AssignableTester,
  type TestingRequestStatusOption,
} from './services/testingRequestService';

type RequestStatus = string;
type RequestPriority = 'urgent' | 'high' | 'medium' | 'low';
type SortKey = 'id' | 'projectName' | 'testType' | 'status' | 'priority' | 'createdAt' | 'deadline';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface FiltersState {
  status: 'all' | RequestStatus;
  priority: 'all' | RequestPriority;
  testType: 'all' | 'functional' | 'performance' | 'security' | 'usability' | 'compatibility';
  dateRange: 'all' | '7days' | '30days' | '90days';
}

interface RequestTableItem {
  id: string;
  numericId: number;
  projectName: string;
  testType: string;
  status: RequestStatus;
  priority: RequestPriority;
  createdAt: string;
  deadline: string;
  description: string;
  progress: number;
  assignedTester: string;
  fileUrl: string | null;
  details: TestingRequestDetails;
  bugReports: BugReport[];
}

const DEFAULT_PRIORITY: RequestPriority = 'medium';

const severityPriorityMap: Record<string, RequestPriority> = {
  CRITICAL: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

const productTypeTestMap: Record<string, string> = {
  WEB: 'functional',
  MOBILE: 'usability',
  API: 'performance',
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

const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ['PENDING', 'CANCELLED'],
  PENDING: ['CANCELLED'],
  WAITING_CUSTOMER: ['CANCELLED', 'EXPIRED'],
  IN_PROGRESS: ['READY_FOR_REVIEW', 'CANCELLED'],
  READY_FOR_REVIEW: ['COMPLETED'],
};

const DEFAULT_STATUS_OPTION: TestingRequestStatusOption = {
  code: 'UNKNOWN',
  label: 'Pending',
  description: 'Awaiting next action',
  progress: 20,
  terminal: false,
};

const fallbackStatusLabel = (status: string) =>
  status
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildTesterName = (tester: TestingUpdateInfo['tester'] | BugReport['tester']): string => {
  if (!tester) {
    return 'Unassigned';
  }

  if (tester.fullName && tester.fullName.trim()) {
    return tester.fullName.trim();
  }

  const names = [tester.firstName, tester.lastName]
    .map((part) => (part ? part.trim() : ''))
    .filter(Boolean);
  if (names.length) {
    return names.join(' ');
  }

  if (tester.username && tester.username.trim()) {
    return tester.username.trim();
  }

  if (tester.email && tester.email.trim()) {
    return tester.email.trim();
  }

  return 'Unassigned';
};

const deriveAssignedTester = (detail: TestingRequestDetails, reports: BugReport[]): string => {
  if (detail.updates?.length) {
    const updates = [...detail.updates].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    const updateWithTester = updates.find((update) => update.tester);
    if (updateWithTester?.tester) {
      return buildTesterName(updateWithTester.tester);
    }
  }

  const bugWithTester = reports.find((report) => report.tester);
  if (bugWithTester?.tester) {
    return buildTesterName(bugWithTester.tester);
  }

  return 'Unassigned';
};

const derivePriority = (reports: BugReport[]): RequestPriority => {
  if (!reports?.length) {
    return DEFAULT_PRIORITY;
  }

  const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  for (const severity of priorityOrder) {
    if (reports.some((report) => report.severity?.toUpperCase() === severity)) {
      return severityPriorityMap[severity];
    }
  }

  return DEFAULT_PRIORITY;
};

const deriveTestType = (productType?: string | null): string => {
  if (!productType) {
    return 'compatibility';
  }
  return productTypeTestMap[productType.toUpperCase()] ?? 'compatibility';
};

const computeDeadline = (detail: TestingRequestDetails, statusCode: string): string => {
  const base = detail.updatedAt ?? detail.createdAt;
  const baseDate = base ? new Date(base) : new Date();
  const deadline = new Date(baseDate.getTime());
  const offsetDays = STATUS_DEADLINE_OFFSETS[statusCode] ?? 10;
  if (offsetDays > 0) {
    deadline.setDate(deadline.getDate() + offsetDays);
  }

  return deadline.toISOString();
};

const formatRequestId = (id: number) => `TR-${id.toString().padStart(4, '0')}`;

const humanizeStatus = (status: string) =>
  status
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date?: string | null) => {
  if (!date) {
    return '—';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (date?: string | null) => {
  if (!date) {
    return '-';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrencyAmount = (amount?: number | null, currency?: string | null) => {
  if (amount === null || amount === undefined) {
    return '—';
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return '—';
  }
  const normalizedCurrency =
    currency && currency.trim().length > 0 ? currency.trim().toUpperCase() : 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(numericAmount);
  } catch (error) {
    return `${normalizedCurrency} ${numericAmount.toFixed(2)}`;
  }
};

const ASSIGN_STATUS_OPTIONS = ['PENDING', 'WAITING_CUSTOMER', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'COMPLETED', 'CANCELLED'];
const TEST_LOG_LEVELS = ['INFO', 'WARN', 'ERROR'];
const BUG_SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const BUG_STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const ASSIGN_FORM_INITIAL = { testerId: '', status: 'IN_PROGRESS', note: '' };
const TEST_LOG_FORM_INITIAL = { level: 'INFO', message: '' };
const BUG_REPORT_FORM_INITIAL = { title: '', description: '', severity: 'MEDIUM', status: 'OPEN', testerId: '' };
const STATUS_FORM_INITIAL = { status: '' };
const QUOTE_FORM_INITIAL: QuoteFormState = { amount: '', currency: 'USD', expiryDays: '7', notes: '' };

const TestRequestManagement = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestTableItem[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestTableItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState<FiltersState>({
    status: 'all',
    priority: 'all',
    testType: 'all',
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestTableItem | null>(null);
  const [activeForm, setActiveForm] = useState<'assign' | 'testLog' | 'bugReport' | 'status' | 'quote' | null>(null);
  const [testerOptions, setTesterOptions] = useState<AssignableTester[]>([]);
  const { notifications } = useNotifications();
  const lastSyncRef = useRef<number>(Date.now());
  const [assignForm, setAssignForm] = useState(() => ({ ...ASSIGN_FORM_INITIAL }));
  const [testLogForm, setTestLogForm] = useState(() => ({ ...TEST_LOG_FORM_INITIAL }));
  const [bugReportForm, setBugReportForm] = useState(() => ({ ...BUG_REPORT_FORM_INITIAL }));
  const [statusForm, setStatusForm] = useState(() => ({ ...STATUS_FORM_INITIAL }));
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>(() => ({ ...QUOTE_FORM_INITIAL }));
  const [tourRun, setTourRun] = useState(false);
  const [tourKey, setTourKey] = useState(() => Date.now());
  const [tourAutoOpenedDetail, setTourAutoOpenedDetail] = useState(false);
  const [tourStage, setTourStage] = useState<'overview' | 'detail' | null>(null);
  const filtersInitialOpenRef = useRef(showFilters);
  const tourPreviousSelectionRef = useRef<RequestTableItem | null>(null);

  const formatCouponDiscount = useCallback((value?: number | null) => {
    if (typeof value !== 'number') {
      return null;
    }
    if (value >= 0 && value <= 1) {
      const percent = value * 100;
      return `${percent.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
    }
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }, []);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState<TestingRequestStatusOption[]>([]);

  const statusMap = useMemo(() => {
    const map: Record<string, TestingRequestStatusOption> = {};
    statusOptions.forEach((option) => {
      map[option.code.toUpperCase()] = option;
    });
    return map;
  }, [statusOptions]);

  const statusOptionsForForm = useMemo(
    () => statusOptions.filter((option) => option.code !== DEFAULT_STATUS_OPTION.code),
    [statusOptions],
  );

  const statusOptionsForRequest = useMemo(() => {
    if (!selectedRequest) {
      return statusOptionsForForm;
    }
    const allowed = STATUS_TRANSITIONS[selectedRequest.status] ?? [];
    if (allowed.length === 0) {
      return statusOptionsForForm.filter((option) => option.code === selectedRequest.status);
    }
    return statusOptionsForForm.filter((option) => allowed.includes(option.code));
  }, [selectedRequest, statusOptionsForForm]);

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

  const isTerminalStatus = useCallback(
    (value: string) => getStatusMeta(value).terminal,
    [getStatusMeta],
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

  const tourOverviewSteps = useMemo<Step[]>(() => {
    const steps: Step[] = [
      {
        target: '#testing-tour-header',
        title: 'Mission control',
        content: 'This hero header keeps the Testing Request Management context handy and now hosts quick actions.',
        disableBeacon: true,
      },
      {
        target: '#testing-tour-search',
        title: 'Global search',
        content: 'Quickly locate a request by ID, project name, scope, or description with the fuzzy search input.',
      },
      {
        target: '#testing-tour-filter-toggle',
        title: 'Precision filters',
        content: 'Use the filter toolkit to slice requests by lifecycle, priority, test type, or time range.',
      },
      {
        target: '#testing-tour-filters',
        title: 'Saved presets',
        content: 'Each dropdown works together so you can stack multiple filters without leaving the page.',
      },
      {
        target: '#testing-tour-table',
        title: 'Unified queue',
        content: 'The table lists every request with sortable columns, live progress, and quick exports.',
      },
    ];

    if (filteredRequests.length > 0) {
      steps.push({
        target: '#testing-tour-row-actions',
        title: 'Row level controls',
        content: 'Open the timeline, download the attachment, or inspect logs directly from each row.',
      });
    }

    steps.push({
      target: '#testing-tour-pagination',
      title: 'Navigate history',
      content: 'Use the paginator to move across the backlog without losing your current filters.',
    });

    return steps;
  }, [filteredRequests.length]);

  const tourDetailSteps = useMemo<Step[]>(() => {
    if (filteredRequests.length === 0) {
      return [];
    }
    return [
      {
        target: '#testing-tour-detail-sidebar',
        title: 'Request cockpit',
        content: 'The sidebar summarizes the selected request with coupon intel, quote data, and status badges.',
        placement: 'right',
      },
      {
        target: '#testing-tour-action-buttons',
        title: 'Workflow shortcuts',
        content: 'Assign testers, send quotes, log bugs, or change status with a single click from this stack.',
        placement: 'right',
      },
      {
        target: '#testing-tour-detail-forms',
        title: 'Context-aware forms',
        content: 'Each form opens inline so you can capture updates without leaving the request view.',
        placement: 'left',
      },
      {
        target: '#testing-tour-progress-updates',
        title: 'Progress intelligence',
        content: 'Track the narrative of updates, logs, and reviewer notes to understand momentum.',
        placement: 'top',
      },
      {
        target: '#testing-tour-bug-reports',
        title: 'Issue tracking',
        content: 'Every bug linked to the request appears here with severity, status, and assigned tester.',
        placement: 'top',
      },
    ];
  }, [filteredRequests.length]);

  const currentTourSteps = useMemo(
    () => (tourStage === 'detail' ? tourDetailSteps : tourOverviewSteps),
    [tourDetailSteps, tourOverviewSteps, tourStage],
  );

  const handleTourFinished = useCallback(() => {
    setTourRun(false);
    setTourStage(null);
    setShowFilters(filtersInitialOpenRef.current);
    const previousSelection = tourPreviousSelectionRef.current;
    if (previousSelection) {
      setSelectedRequest(previousSelection);
    } else if (tourAutoOpenedDetail) {
      setSelectedRequest(null);
    }
    setActiveForm(null);
    setTourAutoOpenedDetail(false);
    tourPreviousSelectionRef.current = null;
  }, [tourAutoOpenedDetail]);

  useEffect(() => {
    if (!tourStage) {
      setTourRun(false);
      return;
    }

    const ensureDetailSelection = () => {
      if (selectedRequest) {
        return true;
      }
      const fallback = filteredRequests[0];
      if (fallback) {
        setSelectedRequest(fallback);
        setTourAutoOpenedDetail(true);
        return true;
      }
      return false;
    };

    if (tourStage === 'overview') {
      setSelectedRequest(null);
      setActiveForm(null);
      setTourAutoOpenedDetail(false);
      setShowFilters(true);
    } else if (tourStage === 'detail') {
      if (!ensureDetailSelection()) {
        handleTourFinished();
        return;
      }
      setActiveForm(null);
    }

    setTourRun(true);
    setTourKey(Date.now());
  }, [filteredRequests, handleTourFinished, selectedRequest, tourStage]);

  useEffect(() => {
    if (tourStage !== 'detail') {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [tourStage]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type } = data;
      if (type === 'error:target_not_found') {
        return;
      }

      if (tourStage === 'detail' && type === 'step:before') {
        const targetSelector =
          typeof data.step?.target === 'string' ? data.step.target : undefined;
        if (targetSelector) {
          const element = document.querySelector<HTMLElement>(targetSelector);
          element?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
        }
      }

      if (['finished', 'skipped'].includes(status)) {
        handleTourFinished();
      }
    },
    [handleTourFinished, tourStage],
  );

  const handleStartTour = useCallback(() => {
    if (requests.length === 0) {
      toast.error('Load at least one testing request before starting the guided tour.');
      return;
    }
    filtersInitialOpenRef.current = showFilters;
    tourPreviousSelectionRef.current = selectedRequest;
    setSelectedRequest(null);
    setActiveForm(null);
    setShowFilters(true);
    setTourAutoOpenedDetail(false);
    setTourStage('overview');
  }, [requests.length, selectedRequest, showFilters]);

  const handleStartDetailTour = useCallback(() => {
    if (!selectedRequest && filteredRequests.length === 0) {
      toast.error('Select a testing request first.');
      return;
    }
    filtersInitialOpenRef.current = showFilters;
    tourPreviousSelectionRef.current = selectedRequest;
    setTourStage('detail');
  }, [filteredRequests.length, selectedRequest, showFilters]);

  const canSendQuote = selectedRequest?.status === 'PENDING';
  const canMarkReadyForReview = selectedRequest?.status === 'IN_PROGRESS';
  const selectedStatusIsTerminal = selectedRequest ? isTerminalStatus(selectedRequest.status) : false;
  const detailTourActive = tourStage === 'detail' && tourRun;

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const response = await getTestingRequestStatusesAPI();
        setStatusOptions(response);
      } catch (error) {
        console.error('Failed to load testing request statuses', error);
        toast.error('Unable to load request statuses. Some visual indicators may be inaccurate.');
      }
    };

    loadStatuses();
  }, []);

  const refreshSelectedRequest = async (requestId: number) => {
    const updated = await fetchRequests({ silent: true, suppressMessages: true });
    const refreshed = updated.find((item) => item.numericId === requestId);
    setSelectedRequest(refreshed ?? null);
  };

  const handleToggleForm = (form: 'assign' | 'testLog' | 'bugReport' | 'status' | 'quote') => {
    setFormSubmitting(false);
    const isSame = activeForm === form;
    const nextForm = isSame ? null : form;

    if (!isSame) {
      if (form === 'quote') {
        if (selectedRequest?.details) {
          const { details } = selectedRequest;
          const amount = details.quotedPrice != null ? String(details.quotedPrice) : QUOTE_FORM_INITIAL.amount;
          const currency = details.quoteCurrency ?? QUOTE_FORM_INITIAL.currency;
          const expiry = (() => {
            if (details.quoteExpiry) {
              const expiryDate = new Date(details.quoteExpiry);
              const baseDate = details.quoteSentAt ? new Date(details.quoteSentAt) : new Date();
              const diffMs = expiryDate.getTime() - baseDate.getTime();
              if (Number.isFinite(diffMs) && diffMs > 0) {
                return String(Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24))));
              }
            }
            return QUOTE_FORM_INITIAL.expiryDays;
          })();
          setQuoteForm({
            amount,
            currency: currency.toUpperCase(),
            expiryDays: expiry,
            notes: details.quoteNotes ?? '',
          });
        } else {
          setQuoteForm({ ...QUOTE_FORM_INITIAL });
        }
      } else {
        setQuoteForm({ ...QUOTE_FORM_INITIAL });
      }

      if (form === 'status') {
        if (selectedRequest) {
          const allowed = STATUS_TRANSITIONS[selectedRequest.status] ?? [];
          setStatusForm({ status: allowed[0] ?? '' });
        } else {
          setStatusForm({ ...STATUS_FORM_INITIAL });
        }
      }
    } else {
      if (form === 'quote') {
        setQuoteForm({ ...QUOTE_FORM_INITIAL });
      }
      if (form === 'status') {
        setStatusForm({ ...STATUS_FORM_INITIAL });
      }
    }

    setActiveForm(nextForm);
  };

  const getCurrentUserDisplayName = () => {
    if (!user) {
      return '';
    }
    const names = [user.firstName, user.lastName]
      .map((part) => (part ? part.trim() : ''))
      .filter(Boolean)
      .join(' ')
      .trim();

    if (names) {
      return names;
    }

    const fullName = (user as unknown as { fullName?: string })?.fullName;
    if (fullName && fullName.trim()) {
      return fullName.trim();
    }

    if (user.username && user.username.trim()) {
      return user.username.trim();
    }

    return 'You';
  };

  const handleClaimRequest = async () => {
    if (!selectedRequest) {
      return;
    }
    if (!user) {
      toast.error('You must be signed in to claim a request.');
      return;
    }

    const requestId = selectedRequest.numericId;
    setActionLoading(true);
    try {
      const displayName = getCurrentUserDisplayName();
      await createTestingUpdateAPI({
        requestId,
        testerId: user.id,
        status: 'IN_PROGRESS',
        note: `Claimed by ${displayName}`,
      });
      toast.success('Request claimed successfully.');
      await refreshSelectedRequest(requestId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to claim testing request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest) {
      return;
    }

    const testerId = Number(assignForm.testerId);
    if (!testerId) {
      toast.error('Please select a tester to assign.');
      return;
    }

    const requestId = selectedRequest.numericId;
    setFormSubmitting(true);
    try {
      const note = assignForm.note.trim();
      const tester = testerOptions.find((option) => option.id === testerId);
      const fallbackNote = tester
        ? `Assigned to ${tester.fullName || tester.email || `tester #${tester.id}`}`
        : 'Tester assignment update';
      await createTestingUpdateAPI({
        requestId,
        testerId,
        status: assignForm.status || 'IN_PROGRESS',
        note: note || fallbackNote,
      });
      toast.success('Tester assigned successfully.');
      setActiveForm(null);
      await refreshSelectedRequest(requestId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to assign tester.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTestLogSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest) {
      return;
    }

    const message = testLogForm.message.trim();
    if (!message) {
      toast.error('Log message is required.');
      return;
    }

    const requestId = selectedRequest.numericId;
    setFormSubmitting(true);
    try {
      await createTestLogAPI({
        requestId,
        message,
        level: testLogForm.level || 'INFO',
      });
      toast.success('Test log recorded.');
      setActiveForm(null);
      await refreshSelectedRequest(requestId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to add test log.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleQuoteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest) {
      return;
    }

    const amountValue = Number.parseFloat(quoteForm.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Please provide a valid quote amount greater than zero.');
      return;
    }

    const currencyValue = quoteForm.currency.trim().toUpperCase();
    if (!currencyValue) {
      toast.error('Currency is required.');
      return;
    }

    let expiryValue: number | undefined;
    if (quoteForm.expiryDays.trim()) {
      const parsed = Number.parseInt(quoteForm.expiryDays, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error('Expiry days must be a positive number.');
        return;
      }
      expiryValue = parsed;
    }

    setFormSubmitting(true);
    try {
      await sendTestingQuoteAPI(selectedRequest.numericId, {
        quotedPrice: Number(amountValue.toFixed(2)),
        currency: currencyValue,
        expiryDays: expiryValue,
        notes: quoteForm.notes.trim() || undefined,
      });
      toast.success('Quote sent to customer.');
      setActiveForm(null);
      await refreshSelectedRequest(selectedRequest.numericId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to send quote.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest) {
      return;
    }

    const requestId = selectedRequest.numericId;
    const newStatus = statusForm.status;
    if (!newStatus) {
      toast.error('Please select a status before updating.');
      return;
    }

    if (selectedRequest.status === newStatus) {
      toast.error('Request is already in this status.');
      return;
    }

    if (!statusOptionsForRequest.some((option) => option.code === newStatus)) {
      toast.error('Selected status is not available for this request.');
      return;
    }

    setFormSubmitting(true);
    try {
      await updateTestingRequestStatusAPI(requestId, newStatus);
      toast.success('Request status updated.');
      setActiveForm(null);
      await refreshSelectedRequest(requestId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update request status.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleMarkReadyForReview = async () => {
    if (!selectedRequest) {
      return;
    }
    setLifecycleLoading(true);
    try {
      await markReadyForReviewAPI(selectedRequest.numericId);
      toast.success('Request marked ready for customer review.');
      await refreshSelectedRequest(selectedRequest.numericId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update request status.');
    } finally {
      setLifecycleLoading(false);
    }
  };

  const handleBugReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest) {
      return;
    }

    const title = bugReportForm.title.trim();
    const description = bugReportForm.description.trim();

    if (!title || !description) {
      toast.error('Bug report title and description are required.');
      return;
    }

    const requestId = selectedRequest.numericId;
    setFormSubmitting(true);
    try {
      await createBugReportAPI({
        requestId,
        title,
        description,
        severity: bugReportForm.severity || 'MEDIUM',
        status: bugReportForm.status || 'OPEN',
        testerId: bugReportForm.testerId ? Number(bugReportForm.testerId) : undefined,
      });
      toast.success('Bug report created.');
      setActiveForm(null);
      await refreshSelectedRequest(requestId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create bug report.');
    } finally {
      setFormSubmitting(false);
    }
  };
  const itemsPerPage = 10;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef(false);

  const fetchAssignableTesters = useCallback(async () => {
    try {
      const testers = await getAssignableTestersAPI();
      if (abortRef.current) {
        return;
      }
      setTesterOptions(testers);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load tester directory.');
    }
  }, []);

  const fetchRequests = async (options: { silent?: boolean; suppressMessages?: boolean } = {}) => {
    const { silent = false, suppressMessages = false } = options;

    if (!silent && !abortRef.current) {
      setIsLoading(true);
    }

    try {
      const [requestDetails, bugReportsResult] = await Promise.all([
        getTestingRequestDetailsAPI(),
        getBugReportsAPI().catch((bugError) => {
          console.error(bugError);
          if (!suppressMessages) {
            toast.error('Unable to load bug reports. Priority information may be incomplete.');
          }
          return [];
        }),
      ]);

      if (abortRef.current) {
        return [];
      }

      const bugReports = bugReportsResult ?? [];
      const bugReportsByRequest = new Map<number, BugReport[]>();
      bugReports.forEach((report) => {
        const requestId = report.request?.id;
        if (!requestId) {
          return;
        }
        if (!bugReportsByRequest.has(requestId)) {
          bugReportsByRequest.set(requestId, []);
        }
        bugReportsByRequest.get(requestId)?.push(report);
      });

      const mappedRequests: RequestTableItem[] = requestDetails.map((detail) => {
        const associatedBugs = bugReportsByRequest.get(detail.id) ?? [];
        const statusMeta = getStatusMeta(detail.status);
        const statusCode = statusMeta.code;

        return {
          id: formatRequestId(detail.id),
          numericId: detail.id,
          projectName: detail.title ?? 'Untitled Request',
          testType: deriveTestType(detail.productType),
          status: statusCode,
          priority: derivePriority(associatedBugs),
          createdAt: detail.createdAt,
          deadline: computeDeadlineValue(detail, statusCode),
          description: detail.description ?? '',
          progress: computeProgressValue(detail),
          assignedTester: deriveAssignedTester(detail, associatedBugs),
          fileUrl: detail.attachmentDownloadUrl ?? detail.fileUrl ?? null,
          details: detail,
          bugReports: associatedBugs,
        };
      });

      if (!abortRef.current) {
        setRequests(mappedRequests);
      }

      return mappedRequests;
    } catch (error) {
      console.error(error);
      if (!suppressMessages) {
        toast.error('Unable to load testing requests.');
      }
      if (!abortRef.current) {
        setRequests([]);
      }
      return [];
    } finally {
      if (!silent && !abortRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (statusOptions.length > 0) {
      void fetchRequests({ silent: true, suppressMessages: true });
    }
  }, [statusOptions]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    abortRef.current = false;
    fetchRequests();
    return () => {
      abortRef.current = true;
    };
  }, []);

  // Realtime refresh when relevant notifications arrive
  useEffect(() => {
    // Only refresh on relevant testing request events
    const relevantTypes = new Set([
      'TESTING_REQUEST',
      'TESTING_UPDATE',
      'TEST_LOG',
      'BUG_REPORT',
      'BUG_COMMENT',
    ]);
    const since = lastSyncRef.current;
    const hasRelevant = notifications.some((n) => {
      if (!n || !n.type) return false;
      if (!relevantTypes.has(n.type)) return false;
      const ts = new Date(n.createdAt).getTime();
      return Number.isFinite(ts) && ts > since;
    });
    if (hasRelevant) {
      void fetchRequests({ silent: true, suppressMessages: true });
      lastSyncRef.current = Date.now();
    }
  }, [notifications]);

  useEffect(() => {
    if (!selectedRequest) {
      setActiveForm(null);
      setFormSubmitting(false);
      setActionLoading(false);
    }
  }, [selectedRequest]);

  useEffect(() => {
    if ((activeForm === 'assign' || activeForm === 'bugReport') && testerOptions.length === 0) {
      fetchAssignableTesters();
    }

    if (activeForm !== 'assign') {
      setAssignForm({ ...ASSIGN_FORM_INITIAL });
    }

    if (activeForm !== 'testLog') {
      setTestLogForm({ ...TEST_LOG_FORM_INITIAL });
    }

    if (activeForm !== 'bugReport') {
      setBugReportForm({ ...BUG_REPORT_FORM_INITIAL });
    }

    if (activeForm !== 'quote') {
      setQuoteForm({ ...QUOTE_FORM_INITIAL });
    }

    if (activeForm === 'status') {
      const allowed = selectedRequest ? STATUS_TRANSITIONS[selectedRequest.status] ?? [] : [];
      setStatusForm({ status: allowed[0] ?? '' });
    } else {
      setStatusForm({ ...STATUS_FORM_INITIAL });
    }
  }, [activeForm, testerOptions.length, fetchAssignableTesters, selectedRequest]);

  useEffect(() => {
    if (!selectedRequest) {
      document.body.style.overflow = '';
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedRequest]);

  useEffect(() => {
    let filtered = [...requests];

    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (trimmedSearch) {
      filtered = filtered.filter((request) => {
        return (
          request.id.toLowerCase().includes(trimmedSearch) ||
          request.projectName.toLowerCase().includes(trimmedSearch) ||
          request.testType.toLowerCase().includes(trimmedSearch) ||
          request.description.toLowerCase().includes(trimmedSearch) ||
          request.assignedTester.toLowerCase().includes(trimmedSearch)
        );
      });
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((request) => request.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter((request) => request.priority === filters.priority);
    }

    if (filters.testType !== 'all') {
      filtered = filtered.filter((request) => request.testType === filters.testType);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const daysAgo = {
        '7days': 7,
        '30days': 30,
        '90days': 90,
      }[filters.dateRange];

      if (daysAgo) {
        const cutoff = new Date(now.getTime());
        cutoff.setDate(cutoff.getDate() - daysAgo);
        filtered = filtered.filter((request) => {
          const createdDate = new Date(request.createdAt);
          return !Number.isNaN(createdDate.getTime()) && createdDate >= cutoff;
        });
      }
    }

    filtered.sort((a, b) => {
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'deadline') {
        const aValue = new Date(a[sortConfig.key]);
        const bValue = new Date(b[sortConfig.key]);
        return sortConfig.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      }

      if (sortConfig.key === 'id') {
        return sortConfig.direction === 'asc' ? a.numericId - b.numericId : b.numericId - a.numericId;
      }

      const key = sortConfig.key;
      const aValue = a[key] as string;
      const bValue = b[key] as string;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [requests, searchTerm, filters, sortConfig]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredRequests.length, currentPage, itemsPerPage]);

  const totalRecords = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  const displayStart = totalRecords === 0 ? 0 : startIndex + 1;
  const displayEnd = totalRecords === 0 ? 0 : Math.min(startIndex + itemsPerPage, totalRecords);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleViewDetails = (request: RequestTableItem) => {
    setSelectedRequest(request);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  const getStatusIcon = (status: RequestStatus) => {
    const code = (status ?? '').toUpperCase();
    switch (code) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-emerald-300" />;
      case 'READY_FOR_REVIEW':
        return <Eye className="w-4 h-4 text-purple-300" />;
      case 'IN_PROGRESS':
        return <Loader2 className="w-4 h-4 text-cyan-300" />;
      case 'WAITING_CUSTOMER':
        return <AlertCircle className="w-4 h-4 text-amber-300" />;
      case 'CANCELLED':
      case 'EXPIRED':
        return <XCircle className="w-4 h-4 text-rose-300" />;
      case 'NEW':
      case 'PENDING':
        return <Clock className="w-4 h-4 text-sky-300" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-300" />;
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    const code = (status ?? '').toUpperCase();
    switch (code) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
      case 'READY_FOR_REVIEW':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'IN_PROGRESS':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'WAITING_CUSTOMER':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'NEW':
      case 'PENDING':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/25';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/25';
    }
  };

  const getPriorityColor = (priority: RequestPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <Joyride
        key={tourKey}
        steps={currentTourSteps}
        run={tourRun && currentTourSteps.length > 0}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        disableOverlayClose
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#06b6d4',
            backgroundColor: '#020617',
            textColor: '#f8fafc',
            zIndex: 10000,
          },
          tooltipContainer: {
            borderRadius: '1rem',
          },
        }}
        locale={{
          next: 'Next',
          back: 'Back',
          last: 'Finish',
          skip: 'Skip tour',
        }}
      />
      {/* Dynamic Background */}
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`,
        }}
      />

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div
          id="testing-tour-header"
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <h1 className="text-4xl font-light text-white mb-2">
              Testing Request <span className="text-cyan-400">Management</span>
            </h1>
            <p className="text-gray-300 font-light">Manage and track all testing requests efficiently</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleStartTour}
              disabled={isLoading || requests.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition-colors duration-200 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start guided tour
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8" ref={containerRef}>
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative" id="testing-tour-search">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search requests by ID, project, type, or description..."
              className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 font-light"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between" id="testing-tour-filter-toggle">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="text-sm text-gray-400">
              Showing {filteredRequests.length} of {requests.length} requests
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div
              id="testing-tour-filters"
              className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-900/30 border border-gray-800/50 rounded-lg backdrop-blur-sm"
            >
              <div>
                <label className="block text-sm font-light text-gray-300 mb-2">Status</label>
                <select
                  className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm font-light focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as FiltersState['status'] }))}
                >
                  <option value="all">All Status</option>
                  {statusOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-light text-gray-300 mb-2">Priority</label>
                <select
                  className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm font-light focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  value={filters.priority}
                  onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value as FiltersState['priority'] }))}
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-light text-gray-300 mb-2">Test Type</label>
                <select
                  className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm font-light focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  value={filters.testType}
                  onChange={(e) => setFilters((prev) => ({ ...prev, testType: e.target.value as FiltersState['testType'] }))}
                >
                  <option value="all">All Types</option>
                  <option value="functional">Functional</option>
                  <option value="performance">Performance</option>
                  <option value="security">Security</option>
                  <option value="usability">Usability</option>
                  <option value="compatibility">Compatibility</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-light text-gray-300 mb-2">Date Range</label>
                <select
                  className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm font-light focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  value={filters.dateRange}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value as FiltersState['dateRange'] }))}
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Requests Table */}
        <div
          id="testing-tour-table"
          className="bg-gray-900/30 border border-gray-800/50 rounded-lg backdrop-blur-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left whitespace-nowrap">
                    <button
                      onClick={() => handleSort('id')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Request ID
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left whitespace-nowrap">
                    <button
                      onClick={() => handleSort('projectName')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Project
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left whitespace-nowrap">
                    <button
                      onClick={() => handleSort('testType')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Test Type
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left whitespace-nowrap">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Status
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left whitespace-nowrap">
                    <button
                      onClick={() => handleSort('priority')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Priority
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left whitespace-nowrap">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Created
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('deadline')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Deadline
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left font-light text-gray-300 whitespace-nowrap">Progress</th>
                  <th className="px-6 py-4 text-left font-light text-gray-300 whitespace-nowrap">Actions</th>
              </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-400 font-light">
                      Loading requests...
                    </td>
                  </tr>
                ) : currentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-400 font-light">
                      No requests found with the current filters.
                    </td>
                  </tr>
                ) : (
                  currentRequests.map((request, index) => (
                    <tr
                      key={request.id}
                      className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-all duration-300"
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      <td className="px-6 py-4 align-top">
                        <span className="font-light text-cyan-400 block truncate" title={request.id}>{request.id}</span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="min-w-0">
                          <div className="font-light text-white truncate" title={request.projectName}>{request.projectName}</div>
                          <div className="text-sm text-gray-400 mt-1 truncate" title={request.assignedTester}>{request.assignedTester}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="capitalize font-light text-gray-300 block truncate" title={request.testType}>{request.testType}</span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {formatStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border capitalize ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="font-light text-gray-300 block truncate" title={formatDate(request.createdAt)}>{formatDate(request.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="font-light text-gray-300 block truncate" title={formatDate(request.deadline)}>{formatDate(request.deadline)}</span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="w-full bg-gray-800/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${request.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{request.progress}%</span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div
                          className="flex items-center gap-2"
                          id={index === 0 ? 'testing-tour-row-actions' : undefined}
                        >
                          <button
                            type="button"
                            onClick={() => handleViewDetails(request)}
                            className="p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-300 hover:scale-105"
                          >
                            <Eye className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
                          </button>
                          {request.fileUrl ? (
                            <a
                              href={request.fileUrl}
                              className="p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-300 hover:scale-105"
                              target="_blank"
                              rel="noreferrer"
                              download={request.details.attachmentFileName ?? undefined}
                            >
                              <Download className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="p-2 rounded-lg border border-gray-800/60 bg-gray-900/40 text-gray-500 cursor-not-allowed"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8" id="testing-tour-pagination">
          <div className="text-sm text-gray-400 font-light">
            Showing {displayStart} to {displayEnd} of {totalRecords} requests
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isVisible =
                page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);

              if (!isVisible) {
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg font-light transition-all duration-300 ${currentPage === page
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25'
                    : 'bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50'
                    }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-7xl h-[90vh] rounded-2xl border border-gray-800/60 bg-gray-950/95 shadow-2xl overflow-hidden flex">
            {/* Left Sidebar - Main Info & Actions */}
            <div
              className="w-80 border-r border-gray-800/60 bg-gray-900/40 p-6 overflow-y-auto"
              id="testing-tour-detail-sidebar"
            >
              <button
                type="button"
                onClick={handleCloseDetails}
                className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-light text-white">{selectedRequest.projectName}</h2>
                <p className="mt-2 text-sm font-light text-gray-300">
                  {selectedRequest.description || 'No description provided for this request.'}
                </p>
                <button
                  type="button"
                  onClick={handleStartDetailTour}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors duration-200 hover:bg-cyan-500/10"
                >
                  Launch detail guide
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Request ID</div>
                  <div className="mt-1 text-lg font-light text-cyan-400">{selectedRequest.id}</div>
                </div>

                <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      {formatStatusLabel(selectedRequest.status)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Priority</div>
                  <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs border capitalize ${getPriorityColor(selectedRequest.priority)}`}>
                    {selectedRequest.priority}
                  </span>
                </div>

                {typeof selectedRequest.details.requestedTokenFee === 'number' && (
                  <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Scoping Token Fee</div>
                    <div className="mt-1 text-lg font-light text-cyan-300">
                      {selectedRequest.details.requestedTokenFee} token{selectedRequest.details.requestedTokenFee === 1 ? '' : 's'}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Tokens collected to cover discovery work before sending a detailed quote.
                    </p>
                    {selectedRequest.details.testingScope?.length ? (
                      <div className="mt-3 space-y-1 text-xs text-gray-400">
                        {selectedRequest.details.testingScope.map((scope) => (
                          <div key={`${scope.type}-${scope.tokens}`} className="flex items-center justify-between rounded-md border border-gray-800/60 bg-gray-900/40 px-2 py-1">
                            <span className="text-gray-300">{scope.type}</span>
                            <span className="text-cyan-300">{scope.tokens}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {selectedRequest.details.userCouponCode && (
                  <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Customer Coupon</div>
                    <div className="mt-1 text-lg font-light text-emerald-300">
                      {selectedRequest.details.userCouponCode}
                    </div>
                    {formatCouponDiscount(selectedRequest.details.userCouponDiscountAmount) && (
                      <div className="mt-2 text-sm text-gray-400">
                        Discount applied:{' '}
                        <span className="text-emerald-200">
                          {formatCouponDiscount(selectedRequest.details.userCouponDiscountAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Quote Details</div>
                  {selectedRequest.details.quotedPrice != null ? (
                    <>
                      <div className="mt-1 text-lg font-light text-cyan-300">
                        {formatCurrencyAmount(selectedRequest.details.quotedPrice, selectedRequest.details.quoteCurrency)}
                      </div>
                      {selectedRequest.details.quoteNotes ? (
                        <p className="mt-2 text-sm font-light text-gray-300">
                          {selectedRequest.details.quoteNotes}
                        </p>
                      ) : null}
                      <div className="mt-3 space-y-1 text-xs text-gray-400">
                        {selectedRequest.details.quoteSentAt && (
                          <div>Sent {formatDateTime(selectedRequest.details.quoteSentAt)}</div>
                        )}
                        {selectedRequest.details.quoteExpiry && (
                          <div>Expires {formatDateTime(selectedRequest.details.quoteExpiry)}</div>
                        )}
                        {selectedRequest.details.quoteAcceptedAt && (
                          <div className="text-cyan-300">
                            Accepted {formatDateTime(selectedRequest.details.quoteAcceptedAt)}
                          </div>
                        )}
                        {selectedRequest.details.quoteCustomerNotes && (
                          <div className="italic text-gray-300">
                            Customer note: {selectedRequest.details.quoteCustomerNotes}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 text-sm font-light text-gray-400">
                      No quote sent yet. Prepare pricing once the scope is approved.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Assigned Tester</div>
                  <div className="mt-1 text-sm font-light text-gray-300">{selectedRequest.assignedTester}</div>
                </div>

                <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                    <Calendar className="w-3 h-3" />
                    Created
                  </div>
                  <div className="mt-1 text-sm font-light text-gray-300">{formatDateTime(selectedRequest.details.createdAt)}</div>
                </div>

                <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                    <Calendar className="w-3 h-3" />
                    Deadline
                  </div>
                  <div className="mt-1 text-sm font-light text-gray-300">{formatDateTime(selectedRequest.deadline)}</div>
                </div>
              </div>

              <div className="space-y-3" id="testing-tour-action-buttons">
                {user && (
                  <button
                    type="button"
                    onClick={handleClaimRequest}
                    disabled={
                      actionLoading ||
                      selectedRequest.assignedTester !== 'Unassigned' ||
                      selectedStatusIsTerminal ||
                      detailTourActive
                    }
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {selectedStatusIsTerminal
                      ? 'Request Completed'
                      : selectedRequest.assignedTester === 'Unassigned'
                        ? 'Claim Request'
                        : 'Already Claimed'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleForm('quote')}
                  disabled={!canSendQuote || selectedStatusIsTerminal || detailTourActive}
                  title={!canSendQuote || selectedStatusIsTerminal ? 'Need to set status to Pending' : detailTourActive ? 'Finish the detail tour to use actions' : undefined}
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-light transition-colors duration-200 ${activeForm === 'quote'
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
                    : 'border-gray-800/60 bg-gray-900/40 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-200'
                    } ${!canSendQuote || selectedStatusIsTerminal ? 'opacity-60 cursor-not-allowed hover:border-gray-800/60 hover:text-gray-300' : ''}`}
                >
                  Send Quote
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleForm('assign')}
                  disabled={selectedStatusIsTerminal || detailTourActive}
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-light transition-colors duration-200 ${activeForm === 'assign'
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
                    : 'border-gray-800/60 bg-gray-900/40 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-200'
                    } ${selectedStatusIsTerminal ? 'opacity-60 cursor-not-allowed hover:border-gray-800/60 hover:text-gray-300' : ''}`}
                >
                  Assign Tester
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleForm('status')}
                  disabled={selectedStatusIsTerminal || statusOptionsForRequest.length === 0 || detailTourActive}
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-light transition-colors duration-200 ${activeForm === 'status'
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
                    : 'border-gray-800/60 bg-gray-900/40 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-200'
                    } ${selectedStatusIsTerminal || statusOptionsForRequest.length === 0 ? 'opacity-60 cursor-not-allowed hover:border-gray-800/60 hover:text-gray-300' : ''}`}
                >
                  Update Status
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleForm('testLog')}
                  disabled={selectedStatusIsTerminal || selectedRequest?.status !== 'IN_PROGRESS' || detailTourActive}
                  title={
                    selectedStatusIsTerminal || selectedRequest?.status !== 'IN_PROGRESS'
                      ? 'Available when status is IN_PROGRESS'
                      : detailTourActive
                        ? 'Finish the detail tour to use actions'
                        : undefined
                  }
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-light transition-colors duration-200 ${activeForm === 'testLog'
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
                    : 'border-gray-800/60 bg-gray-900/40 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-200'
                    } ${(selectedStatusIsTerminal || selectedRequest?.status !== 'IN_PROGRESS') ? 'opacity-60 cursor-not-allowed hover:border-gray-800/60 hover:text-gray-300' : ''}`}
                >
                  Add Test Log
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleForm('bugReport')}
                  disabled={selectedStatusIsTerminal || selectedRequest?.status !== 'IN_PROGRESS' || detailTourActive}
                  title={
                    selectedStatusIsTerminal || selectedRequest?.status !== 'IN_PROGRESS'
                      ? 'Available when status is IN_PROGRESS'
                      : detailTourActive
                        ? 'Finish the detail tour to use actions'
                        : undefined
                  }
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-light transition-colors duration-200 ${activeForm === 'bugReport'
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
                    : 'border-gray-800/60 bg-gray-900/40 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-200'
                    } ${(selectedStatusIsTerminal || selectedRequest?.status !== 'IN_PROGRESS') ? 'opacity-60 cursor-not-allowed hover:border-gray-800/60 hover:text-gray-300' : ''}`}
                >
                  Add Bug Report
                </button>

                <button
                  type="button"
                  onClick={handleMarkReadyForReview}
                  disabled={!canMarkReadyForReview || lifecycleLoading || detailTourActive}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {lifecycleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Mark Ready For Review
                </button>
              </div>
            </div>

            {/* Right Content Area - Forms & Details */}
            <div className="flex-1 overflow-y-auto p-6" id="testing-tour-detail-forms">
              {/* Forms Section */}
              {activeForm === 'assign' && (
                <AssignTesterForm
                  assignForm={assignForm}
                  assignStatusOptions={ASSIGN_STATUS_OPTIONS}
                  testerOptions={testerOptions}
                  formSubmitting={formSubmitting}
                  onSubmit={handleAssignSubmit}
                  onCancel={() => setActiveForm(null)}
                  setAssignForm={setAssignForm}
                  formatStatusLabel={formatStatusLabel}
                />
              )}

              {activeForm === 'quote' && (
                <QuoteForm
                  quoteForm={quoteForm}
                  setQuoteForm={setQuoteForm}
                  formSubmitting={formSubmitting}
                  onSubmit={handleQuoteSubmit}
                  onCancel={() => setActiveForm(null)}
                />
              )}

              {activeForm === 'status' && (
                <StatusUpdateForm
                  statusForm={statusForm}
                  statusOptions={statusOptionsForRequest}
                  formSubmitting={formSubmitting}
                  onSubmit={handleStatusSubmit}
                  onCancel={() => setActiveForm(null)}
                  setStatusForm={setStatusForm}
                  formatStatusLabel={formatStatusLabel}
                />
              )}

              {activeForm === 'testLog' && (
                <TestLogForm
                  testLogForm={testLogForm}
                  logLevels={TEST_LOG_LEVELS}
                  formSubmitting={formSubmitting}
                  onSubmit={handleTestLogSubmit}
                  onCancel={() => setActiveForm(null)}
                  setTestLogForm={setTestLogForm}
                />
              )}

              {activeForm === 'bugReport' && (
                <BugReportForm
                  bugReportForm={bugReportForm}
                  formSubmitting={formSubmitting}
                  severityOptions={BUG_SEVERITY_OPTIONS}
                  statusOptions={BUG_STATUS_OPTIONS}
                  testerOptions={testerOptions}
                  onSubmit={handleBugReportSubmit}
                  onCancel={() => setActiveForm(null)}
                  setBugReportForm={setBugReportForm}
                  formatStatusLabel={humanizeStatus}
                />
              )}

              {/* Content Grid - 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progress Updates */}
                <div
                  className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-5"
                  id="testing-tour-progress-updates"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-light text-white">Progress Updates</h3>
                    <span className="text-xs font-light text-gray-500">{selectedRequest.details.updates.length} entries</span>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {selectedRequest.details.updates.length === 0 && (
                      <div className="rounded-lg border border-gray-800/50 bg-gray-900/30 p-4 text-sm font-light text-gray-400">
                        No updates recorded yet.
                      </div>
                    )}
                    {selectedRequest.details.updates.map((update) => {
                      const statusMeta = getStatusMeta(update.status);
                      const statusCode = statusMeta.code;
                      return (
                        <div key={update.id} className="rounded-lg border border-gray-800/50 bg-gray-900/30 p-4 transition-all duration-300 hover:border-cyan-500/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-light text-white">{buildTesterName(update.tester)}</span>
                            <span className="text-xs font-light text-gray-500">{formatDateTime(update.createdAt)}</span>
                          </div>
                          <div className="mt-2 text-sm font-light text-gray-300">{update.updateNote}</div>
                          <span className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${getStatusColor(statusCode)}`}>
                            {getStatusIcon(statusCode)}
                            {formatStatusLabel(statusCode)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Test Logs */}
                <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-light text-white">Recent Test Logs</h3>
                    <span className="text-xs font-light text-gray-500">{selectedRequest.details.logs.length} entries</span>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {selectedRequest.details.logs.length === 0 && (
                      <div className="rounded-lg border border-gray-800/50 bg-gray-900/30 p-4 text-sm font-light text-gray-400">
                        No test logs recorded yet.
                      </div>
                    )}
                    {selectedRequest.details.logs.slice(0, 6).map((log) => (
                      <div key={log.id} className="rounded-lg border border-gray-800/50 bg-gray-900/30 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wide text-gray-500">{log.logLevel}</span>
                          <span className="text-xs font-light text-gray-500">{formatDateTime(log.createdAt)}</span>
                        </div>
                        <div className="mt-2 text-sm font-light text-gray-300">{log.logMessage}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bug Reports - Full Width */}
              <div
                className="mt-6 rounded-xl border border-gray-800/60 bg-gray-900/40 p-5"
                id="testing-tour-bug-reports"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-light text-white">Bug Reports</h3>
                  <span className="text-xs font-light text-gray-500">{selectedRequest.bugReports.length} items</span>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {selectedRequest.bugReports.length === 0 && (
                    <div className="rounded-lg border border-gray-800/50 bg-gray-900/30 p-4 text-sm font-light text-gray-400">
                      No bug reports linked to this request.
                    </div>
                  )}
                  {selectedRequest.bugReports.map((bug) => (
                    <div key={bug.id} className="rounded-lg border border-gray-800/50 bg-gray-900/30 p-4 transition-all duration-300 hover:border-cyan-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-light text-white">{bug.title}</div>
                          <div className="text-xs font-light text-gray-500 mt-1">{formatDateTime(bug.createdAt)}</div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border capitalize ${getPriorityColor(severityPriorityMap[bug.severity?.toUpperCase() ?? ''] ?? DEFAULT_PRIORITY)}`}>
                          {bug.severity?.toLowerCase() ?? 'unknown'}
                        </span>
                      </div>
                      <div className="mt-3 text-sm font-light text-gray-300">{bug.description}</div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>Status: {humanizeStatus(bug.status ?? 'unknown')}</span>
                        <span>Tester: {buildTesterName(bug.tester)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

        html, body {
          background-color: #020617;
        }
      `}</style>
    </div>
  );
};

export default TestRequestManagement;

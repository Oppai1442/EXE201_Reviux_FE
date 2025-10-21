import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
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

import {
  getBugReportsAPI,
  getTestingRequestDetailsAPI,
  createTestingUpdateAPI,
  createTestLogAPI,
  createBugReportAPI,
  getAssignableTestersAPI,
  type BugReport,
  type TestingRequestDetails,
  type TestingUpdateInfo,
  type AssignableTester,
} from './services/testingRequestService';

type RequestStatus = 'pending' | 'in-progress' | 'completed' | 'failed';
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

const statusDictionary: Record<string, { status: RequestStatus; progress: number }> = {
  NEW: { status: 'pending', progress: 15 },
  QUEUED: { status: 'pending', progress: 20 },
  PENDING_REVIEW: { status: 'in-progress', progress: 55 },
  WAITING_CUSTOMER: { status: 'in-progress', progress: 45 },
  IN_PROGRESS: { status: 'in-progress', progress: 65 },
  READY_FOR_REVIEW: { status: 'in-progress', progress: 85 },
  COMPLETED: { status: 'completed', progress: 100 },
  BLOCKED: { status: 'failed', progress: 35 },
  FAILED: { status: 'failed', progress: 25 },
  CANCELLED: { status: 'failed', progress: 20 },
};

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

const normalizeStatus = (value?: string | null): { status: RequestStatus; progress: number } => {
  if (!value) {
    return { status: 'pending', progress: 20 };
  }
  const normalized = statusDictionary[value.toUpperCase()];
  if (normalized) {
    return normalized;
  }
  return { status: 'pending', progress: 20 };
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

const computeDeadline = (detail: TestingRequestDetails, status: RequestStatus): string => {
  const base = detail.updatedAt ?? detail.createdAt;
  const baseDate = base ? new Date(base) : new Date();

  const statusOffsets: Record<RequestStatus, number> = {
    pending: 10,
    'in-progress': 14,
    completed: 0,
    failed: 5,
  };

  const deadline = new Date(baseDate.getTime());
  const offsetDays = statusOffsets[status] ?? 10;
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

const ASSIGN_STATUS_OPTIONS = ['IN_PROGRESS', 'READY_FOR_REVIEW', 'WAITING_CUSTOMER', 'COMPLETED'];
const TEST_LOG_LEVELS = ['INFO', 'WARN', 'ERROR'];
const BUG_SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const BUG_STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const ASSIGN_FORM_INITIAL = { testerId: '', status: 'IN_PROGRESS', note: '' };
const TEST_LOG_FORM_INITIAL = { level: 'INFO', message: '' };
const BUG_REPORT_FORM_INITIAL = { title: '', description: '', severity: 'MEDIUM', status: 'OPEN', testerId: '' };

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
  const [activeForm, setActiveForm] = useState<'assign' | 'testLog' | 'bugReport' | null>(null);
  const [testerOptions, setTesterOptions] = useState<AssignableTester[]>([]);
  const [assignForm, setAssignForm] = useState(() => ({ ...ASSIGN_FORM_INITIAL }));
  const [testLogForm, setTestLogForm] = useState(() => ({ ...TEST_LOG_FORM_INITIAL }));
  const [bugReportForm, setBugReportForm] = useState(() => ({ ...BUG_REPORT_FORM_INITIAL }));
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const refreshSelectedRequest = async (requestId: number) => {
    const updated = await fetchRequests({ silent: true, suppressMessages: true });
    const refreshed = updated.find((item) => item.numericId === requestId);
    setSelectedRequest(refreshed ?? null);
  };

  const handleToggleForm = (form: 'assign' | 'testLog' | 'bugReport') => {
    setFormSubmitting(false);
    setActiveForm((prev) => (prev === form ? null : form));
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
        const normalizedStatus = normalizeStatus(detail.status);

        return {
          id: formatRequestId(detail.id),
          numericId: detail.id,
          projectName: detail.title ?? 'Untitled Request',
          testType: deriveTestType(detail.productType),
          status: normalizedStatus.status,
          priority: derivePriority(associatedBugs),
          createdAt: detail.createdAt,
          deadline: computeDeadline(detail, normalizedStatus.status),
          description: detail.description ?? '',
          progress: computeProgress(detail),
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
  }, [activeForm, testerOptions.length, fetchAssignableTesters]);

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
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-cyan-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'in-progress':
        return 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20';
      case 'failed':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
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
        <h1 className="text-4xl font-light text-white mb-2">
          Testing Request <span className="text-cyan-400">Management</span>
        </h1>
        <p className="text-gray-300 font-light">Manage and track all testing requests efficiently</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8" ref={containerRef}>
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
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
          <div className="flex items-center justify-between">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-900/30 border border-gray-800/50 rounded-lg backdrop-blur-sm">
              <div>
                <label className="block text-sm font-light text-gray-300 mb-2">Status</label>
                <select
                  className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm font-light focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as FiltersState['status'] }))}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
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
        <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('id')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Request ID
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('projectName')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Project
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('testType')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Test Type
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Status
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('priority')}
                      className="flex items-center gap-2 font-light text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                    >
                      Priority
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
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
                  <th className="px-6 py-4 text-left font-light text-gray-300">Progress</th>
                  <th className="px-6 py-4 text-left font-light text-gray-300">Actions</th>
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
                      <td className="px-6 py-4">
                        <span className="font-light text-cyan-400">{request.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-light text-white">{request.projectName}</div>
                          <div className="text-sm text-gray-400 mt-1">{request.assignedTester}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize font-light text-gray-300">{request.testType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border capitalize ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-light text-gray-300">{formatDate(request.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-light text-gray-300">{formatDate(request.deadline)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-800/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${request.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{request.progress}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
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
        <div className="flex items-center justify-between mt-8">
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
            <div className="w-80 border-r border-gray-800/60 bg-gray-900/40 p-6 overflow-y-auto">
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
                      {selectedRequest.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Priority</div>
                  <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs border capitalize ${getPriorityColor(selectedRequest.priority)}`}>
                    {selectedRequest.priority}
                  </span>
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

              <div className="space-y-3">
                {user && (
                  <button
                    type="button"
                    onClick={handleClaimRequest}
                    disabled={actionLoading || selectedRequest.assignedTester !== 'Unassigned'}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {selectedRequest.assignedTester === 'Unassigned' ? 'Claim Request' : 'Already Claimed'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleForm('assign')}
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-light transition-colors duration-200 ${activeForm === 'assign'
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
                      : 'border-gray-800/60 bg-gray-900/40 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-200'
                    }`}
                >
                  Assign Tester
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleForm('testLog')}
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-light transition-colors duration-200 ${activeForm === 'testLog'
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
                      : 'border-gray-800/60 bg-gray-900/40 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-200'
                    }`}
                >
                  Add Test Log
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleForm('bugReport')}
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-light transition-colors duration-200 ${activeForm === 'bugReport'
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
                      : 'border-gray-800/60 bg-gray-900/40 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-200'
                    }`}
                >
                  Add Bug Report
                </button>
              </div>
            </div>

            {/* Right Content Area - Forms & Details */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Forms Section */}
              {activeForm === 'assign' && (
                <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-5">
                  <h3 className="text-lg font-light text-white mb-4">Assign Tester</h3>
                  <form onSubmit={handleAssignSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-gray-300">Tester</label>
                        <select
                          value={assignForm.testerId}
                          onChange={(event) => setAssignForm((prev) => ({ ...prev, testerId: event.target.value }))}
                          className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          required
                        >
                          <option value="">Select tester</option>
                          {testerOptions.map((tester) => (
                            <option key={tester.id} value={tester.id}>
                              {tester.fullName || tester.email || `User ${tester.id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-gray-300">Status</label>
                        <select
                          value={assignForm.status}
                          onChange={(event) => setAssignForm((prev) => ({ ...prev, status: event.target.value }))}
                          className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        >
                          {ASSIGN_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {humanizeStatus(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-gray-300">Note (optional)</label>
                      <textarea
                        value={assignForm.note}
                        onChange={(event) => setAssignForm((prev) => ({ ...prev, note: event.target.value }))}
                        rows={3}
                        placeholder="Optional message for this assignment"
                        className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveForm(null)}
                        className="rounded-lg border border-gray-800/60 px-4 py-2 text-sm text-gray-300 transition-colors duration-200 hover:border-gray-700 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Assign
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeForm === 'testLog' && (
                <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-5">
                  <h3 className="text-lg font-light text-white mb-4">Add Test Log</h3>
                  <form onSubmit={handleTestLogSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-gray-300">Log Level</label>
                        <select
                          value={testLogForm.level}
                          onChange={(event) => setTestLogForm((prev) => ({ ...prev, level: event.target.value }))}
                          className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        >
                          {TEST_LOG_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-gray-300">Message</label>
                      <textarea
                        value={testLogForm.message}
                        onChange={(event) => setTestLogForm((prev) => ({ ...prev, message: event.target.value }))}
                        rows={4}
                        placeholder="Describe the outcome or error observed during testing"
                        className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveForm(null)}
                        className="rounded-lg border border-gray-800/60 px-4 py-2 text-sm text-gray-300 transition-colors duration-200 hover:border-gray-700 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Save Log
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeForm === 'bugReport' && (
                <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-5">
                  <h3 className="text-lg font-light text-white mb-4">Add Bug Report</h3>
                  <form onSubmit={handleBugReportSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-gray-300">Severity</label>
                        <select
                          value={bugReportForm.severity}
                          onChange={(event) => setBugReportForm((prev) => ({ ...prev, severity: event.target.value }))}
                          className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        >
                          {BUG_SEVERITY_OPTIONS.map((severity) => (
                            <option key={severity} value={severity}>
                              {severity}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-gray-300">Status</label>
                        <select
                          value={bugReportForm.status}
                          onChange={(event) => setBugReportForm((prev) => ({ ...prev, status: event.target.value }))}
                          className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        >
                          {BUG_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {humanizeStatus(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-gray-300">Assign Tester (optional)</label>
                        <select
                          value={bugReportForm.testerId}
                          onChange={(event) => setBugReportForm((prev) => ({ ...prev, testerId: event.target.value }))}
                          className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        >
                          <option value="">Unassigned</option>
                          {testerOptions.map((tester) => (
                            <option key={tester.id} value={tester.id}>
                              {tester.fullName || tester.email || `User ${tester.id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-gray-300">Title</label>
                      <input
                        type="text"
                        value={bugReportForm.title}
                        onChange={(event) => setBugReportForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Short summary of the issue"
                        className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-gray-300">Description</label>
                      <textarea
                        value={bugReportForm.description}
                        onChange={(event) => setBugReportForm((prev) => ({ ...prev, description: event.target.value }))}
                        rows={4}
                        placeholder="Detailed steps to reproduce, expected vs actual behavior."
                        className="w-full rounded-lg border border-gray-800/60 bg-gray-900/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveForm(null)}
                        className="rounded-lg border border-gray-800/60 px-4 py-2 text-sm text-gray-300 transition-colors duration-200 hover:border-gray-700 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Create Bug Report
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Content Grid - 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progress Updates */}
                <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-5">
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
                      const normalized = normalizeStatus(update.status);
                      return (
                        <div key={update.id} className="rounded-lg border border-gray-800/50 bg-gray-900/30 p-4 transition-all duration-300 hover:border-cyan-500/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-light text-white">{buildTesterName(update.tester)}</span>
                            <span className="text-xs font-light text-gray-500">{formatDateTime(update.createdAt)}</span>
                          </div>
                          <div className="mt-2 text-sm font-light text-gray-300">{update.updateNote}</div>
                          <span className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${getStatusColor(normalized.status)}`}>
                            {getStatusIcon(normalized.status)}
                            {humanizeStatus(update.status)}
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
              <div className="mt-6 rounded-xl border border-gray-800/60 bg-gray-900/40 p-5">
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
    </div>
  );
};

export default TestRequestManagement;

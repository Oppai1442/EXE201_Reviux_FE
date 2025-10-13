import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
  getBugReportsAPI,
  getTestingRequestDetailsAPI,
  type BugReport,
  type TestingRequestDetails,
  type TestingUpdateInfo,
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
    return '—';
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

const TestRequestManagement = () => {
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

  const itemsPerPage = 10;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const requestDetails = await getTestingRequestDetailsAPI();

        let bugReports: BugReport[] = [];
        try {
          bugReports = await getBugReportsAPI();
        } catch (bugError) {
          console.error(bugError);
          toast.error('Unable to load bug reports. Priority information may be incomplete.');
        }

        if (!isMounted) {
          return;
        }

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
            fileUrl: detail.fileUrl ?? null,
            details: detail,
            bugReports: associatedBugs,
          };
        });

        setRequests(mappedRequests);
      } catch (error) {
        console.error(error);
        toast.error('Unable to load testing requests.');
        setRequests([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleDownload = (request: RequestTableItem) => {
    if (!request.fileUrl) {
      toast.error('No attachment available for this request.');
      return;
    }
    try {
      window.open(request.fileUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(error);
      toast.error('Unable to open the attachment link.');
    }
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
                          <button
                            type="button"
                            onClick={() => handleDownload(request)}
                            className="p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-300 hover:scale-105"
                          >
                            <Download className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
                          </button>
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
                  className={`px-3 py-2 rounded-lg font-light transition-all duration-300 ${
                    currentPage === page
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
          <div className="relative w-full max-w-4xl rounded-2xl border border-gray-800/60 bg-gray-950/95 p-6 shadow-2xl">
            <button
              type="button"
              onClick={handleCloseDetails}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-light text-white">{selectedRequest.projectName}</h2>
              <p className="mt-2 text-sm font-light text-gray-300">
                {selectedRequest.description || 'No description provided for this request.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Request ID</div>
                <div className="mt-1 text-lg font-light text-cyan-400">{selectedRequest.id}</div>
              </div>
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
                <div className="mt-1 inline-flex items-center gap-2">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Priority</div>
                <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs border capitalize ${getPriorityColor(selectedRequest.priority)}`}>
                  {selectedRequest.priority}
                </span>
              </div>
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Assigned Tester</div>
                <div className="mt-1 text-sm font-light text-gray-300">{selectedRequest.assignedTester}</div>
              </div>
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Created
                </div>
                <div className="mt-1 text-sm font-light text-gray-300">{formatDateTime(selectedRequest.details.createdAt)}</div>
              </div>
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Deadline
                </div>
                <div className="mt-1 text-sm font-light text-gray-300">{formatDateTime(selectedRequest.deadline)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-light text-white">Progress Updates</h3>
                  <span className="text-xs font-light text-gray-500">{selectedRequest.details.updates.length} entries</span>
                </div>
                <div className="space-y-3">
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

              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-light text-white">Recent Test Logs</h3>
                  <span className="text-xs font-light text-gray-500">{selectedRequest.details.logs.length} entries</span>
                </div>
                <div className="space-y-3">
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

            <div className="mt-6 rounded-xl border border-gray-800/60 bg-gray-900/40 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-light text-white">Bug Reports</h3>
                <span className="text-xs font-light text-gray-500">{selectedRequest.bugReports.length} items</span>
              </div>
              <div className="space-y-3">
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
      )}
    </div>
  );
};

export default TestRequestManagement;

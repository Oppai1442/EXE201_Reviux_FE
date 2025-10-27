import { getData, postData, patchData } from '@/services/api/apiService';

export interface ApiUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface TestingUpdateInfo {
  id: number;
  updateNote: string;
  status: string;
  createdAt: string;
  tester: ApiUser | null;
}

export interface TestLogInfo {
  id: number;
  logMessage: string;
  logLevel: string;
  createdAt: string;
}

export interface TestingScopeItem {
  type: string;
  tokens: number;
}

export interface TestingRequestDetails {
  id: number;
  title: string;
  description: string;
  fileUrl: string | null;
  referenceUrl?: string | null;
  productType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: ApiUser | null;
  updates: TestingUpdateInfo[];
  logs: TestLogInfo[];
  testingTypes?: string[] | null;
  testingScope?: TestingScopeItem[] | null;
  requestedTokenFee?: number | null;
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
  desiredDeadline?: string | null;
  attachmentDownloadUrl?: string | null;
  attachmentFileName?: string | null;
}

export interface TestingRequestStatusOption {
  code: string;
  label: string;
  description: string;
  progress: number;
  terminal: boolean;
}

export interface BugComment {
  id: number;
  comment: string;
  createdAt: string;
  commenter: ApiUser | null;
}

export interface BugReport {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tester: ApiUser | null;
  request: { id: number } | null;
  comments?: BugComment[];
}

export const getTestingRequestDetailsAPI = async () => {
  const response = await getData<TestingRequestDetails[]>('/testing-requests/details');
  return response.data;
};

export const getBugReportsAPI = async () => {
  const response = await getData<BugReport[]>('/bug-reports');
  return response.data;
};

export interface SubmitTestingRequestPayload {
  title: string;
  description: string;
  testingTypes: string[];
  testingScope?: TestingScopeItem[];
  requestedTokenFee?: number;
  deadline?: string;
  referenceUrl?: string;
  archive?: File | null;
}

export const submitTestingRequestAPI = async (payload: SubmitTestingRequestPayload) => {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);

  payload.testingTypes.forEach((type) => {
    formData.append('testingTypes', type);
  });

  if (payload.testingScope?.length) {
    formData.append('testingScope', JSON.stringify(payload.testingScope));
  }

  if (typeof payload.requestedTokenFee === 'number') {
    formData.append('requestedTokenFee', String(payload.requestedTokenFee));
  }

  if (payload.deadline) {
    formData.append('deadline', payload.deadline);
  }

  if (payload.referenceUrl) {
    formData.append('referenceUrl', payload.referenceUrl);
  }

  if (payload.archive) {
    formData.append('archive', payload.archive);
  }

  const response = await postData<TestingRequestDetails>('/testing-requests/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export interface CreateTestingUpdatePayload {
  requestId: number;
  testerId?: number | null;
  status?: string;
  note?: string;
}

export const createTestingUpdateAPI = async (payload: CreateTestingUpdatePayload) => {
  const body = {
    updateNote: payload.note ?? '',
    status: payload.status ?? 'IN_PROGRESS',
    request: { id: payload.requestId },
    tester: payload.testerId ? { id: payload.testerId } : null,
  };

  const response = await postData<TestingUpdateInfo>('/testing-updates', body);
  return response.data;
};

export interface CreateTestLogPayload {
  requestId: number;
  message: string;
  level: string;
}

export const createTestLogAPI = async (payload: CreateTestLogPayload) => {
  const body = {
    logMessage: payload.message,
    logLevel: payload.level,
    request: { id: payload.requestId },
  };

  const response = await postData<TestLogInfo>('/test-logs', body);
  return response.data;
};

export interface CreateBugReportPayload {
  requestId: number;
  title: string;
  description: string;
  severity: string;
  status?: string;
  testerId?: number | null;
}

export const createBugReportAPI = async (payload: CreateBugReportPayload) => {
  const body = {
    title: payload.title,
    description: payload.description,
    severity: payload.severity,
    status: payload.status ?? 'OPEN',
    request: { id: payload.requestId },
    tester: payload.testerId ? { id: payload.testerId } : null,
  };

  const response = await postData<BugReport>('/bug-reports', body);
  return response.data;
};

export interface AssignableTester {
  id: number;
  fullName?: string;
  email?: string;
  avatarURL?: string | null;
}

export interface SendTestingQuotePayload {
  quotedPrice: number;
  currency: string;
  expiryDays?: number;
  notes?: string;
}

export interface LifecycleDecisionPayload {
  note?: string;
}

export const getAssignableTestersAPI = async () => {
  const response = await getData<AssignableTester[]>('/users/staff-and-admins');
  return response.data;
};

export const updateTestingRequestStatusAPI = async (requestId: number, status: string) => {
  await patchData(`/testing-requests/${requestId}/status`, { status });
};

export const getTestingRequestStatusesAPI = async () => {
  const response = await getData<TestingRequestStatusOption[]>('/testing-requests/status-options');
  return response.data;
};

export const sendTestingQuoteAPI = async (requestId: number, payload: SendTestingQuotePayload) => {
  await postData(`/testing-requests/${requestId}/quote`, {
    quotedPrice: payload.quotedPrice,
    currency: payload.currency,
    expiryDays: payload.expiryDays,
    notes: payload.notes ?? undefined,
  });
};

export const acceptTestingQuoteAPI = async (requestId: number, payload?: LifecycleDecisionPayload) => {
  await postData(`/testing-requests/${requestId}/quote/accept`, payload ?? {});
};

export const markReadyForReviewAPI = async (requestId: number, payload?: LifecycleDecisionPayload) => {
  await postData(`/testing-requests/${requestId}/ready-for-review`, payload ?? {});
};

export const confirmTestingCompletionAPI = async (requestId: number, payload?: LifecycleDecisionPayload) => {
  await postData(`/testing-requests/${requestId}/complete`, payload ?? {});
};

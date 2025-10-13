import { getData } from '@/services/api/apiService';

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

export interface TestingRequestDetails {
  id: number;
  title: string;
  description: string;
  fileUrl: string | null;
  productType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: ApiUser | null;
  updates: TestingUpdateInfo[];
  logs: TestLogInfo[];
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

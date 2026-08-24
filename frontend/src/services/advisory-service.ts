import { isAxiosError } from 'axios';

import { api } from '@/services/api';
import type {
  AdvisoryNotice,
  AdvisoryNoticeInput,
  AdvisoryReportOverview,
  AssistanceRequest,
  AssistanceRequestCategory,
  AssistanceRequestPriority,
  AssistanceRequestStatus,
  OfficerProfile,
  OfficerProfileInput,
  OfficialResponseType,
  QualityGuideline,
  QualityGuidelineInput,
  ReportedListing,
  SurplusAdvisory,
  SurplusAdvisoryInput,
} from '@/types/advisory';

export async function getOfficerProfile() {
  try {
    const response = await api.get<{ profile: OfficerProfile }>('/advisory/officer-profile');
    return response.data.profile;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function createOfficerProfile(input: OfficerProfileInput) {
  const response = await api.post<{ message: string; profile: OfficerProfile }>(
    '/advisory/officer-profile',
    input,
  );
  return response.data.profile;
}

export async function updateOfficerProfile(input: Partial<OfficerProfileInput>) {
  const response = await api.patch<{ message: string; profile: OfficerProfile }>(
    '/advisory/officer-profile',
    input,
  );
  return response.data.profile;
}

export async function getAssistanceRequests(filters: {
  category?: AssistanceRequestCategory;
  district?: string;
  priority?: AssistanceRequestPriority;
  status?: AssistanceRequestStatus;
} = {}) {
  const response = await api.get<{ requests: AssistanceRequest[] }>('/advisory/requests', {
    params: filters,
  });
  return response.data.requests;
}

export async function getAssistanceRequest(requestId: string) {
  const response = await api.get<{ request: AssistanceRequest }>(
    `/advisory/requests/${requestId}`,
  );
  return response.data.request;
}

export async function reviewAssistanceRequest(
  requestId: string,
  input: {
    status?: AssistanceRequestStatus;
    priority?: AssistanceRequestPriority;
    internalNotes?: string;
  },
) {
  const response = await api.patch<{ message: string; request: AssistanceRequest }>(
    `/advisory/requests/${requestId}/review`,
    input,
  );
  return response.data.request;
}

export async function respondToAssistanceRequest(
  requestId: string,
  input: {
    type: OfficialResponseType;
    message: string;
    scheduledVisitAt?: string;
  },
) {
  const response = await api.post<{ message: string; request: AssistanceRequest }>(
    `/advisory/requests/${requestId}/responses`,
    input,
  );
  return response.data.request;
}

export async function getOfficerNotices(status?: AdvisoryNotice['status']) {
  const response = await api.get<{ notices: AdvisoryNotice[] }>('/advisory/notices', {
    params: { status },
  });
  return response.data.notices;
}

export async function createNotice(input: AdvisoryNoticeInput) {
  const response = await api.post<{ message: string; notice: AdvisoryNotice }>(
    '/advisory/notices',
    input,
  );
  return response.data.notice;
}

export async function publishNotice(noticeId: string) {
  const response = await api.post<{ message: string; notice: AdvisoryNotice }>(
    `/advisory/notices/${noticeId}/publish`,
  );
  return response.data.notice;
}

export async function archiveNotice(noticeId: string) {
  const response = await api.post<{ message: string; notice: AdvisoryNotice }>(
    `/advisory/notices/${noticeId}/archive`,
  );
  return response.data.notice;
}

export async function getQualityGuidelines(status?: QualityGuideline['status']) {
  const response = await api.get<{ guidelines: QualityGuideline[] }>(
    '/advisory/quality-guidelines',
    { params: { status } },
  );
  return response.data.guidelines;
}

export async function createQualityGuideline(input: QualityGuidelineInput) {
  const response = await api.post<{ guideline: QualityGuideline; message: string }>(
    '/advisory/quality-guidelines',
    input,
  );
  return response.data.guideline;
}

export async function archiveQualityGuideline(guidelineId: string) {
  const response = await api.post<{ guideline: QualityGuideline; message: string }>(
    `/advisory/quality-guidelines/${guidelineId}/archive`,
  );
  return response.data.guideline;
}

export async function getSurplusAdvisories(status?: SurplusAdvisory['status']) {
  const response = await api.get<{ advisories: SurplusAdvisory[] }>(
    '/advisory/surplus-advisories',
    { params: { status } },
  );
  return response.data.advisories;
}

export async function createSurplusAdvisory(input: SurplusAdvisoryInput) {
  const response = await api.post<{ advisory: SurplusAdvisory; message: string }>(
    '/advisory/surplus-advisories',
    input,
  );
  return response.data.advisory;
}

export async function resolveSurplusAdvisory(advisoryId: string) {
  const response = await api.post<{ advisory: SurplusAdvisory; message: string }>(
    `/advisory/surplus-advisories/${advisoryId}/resolve`,
  );
  return response.data.advisory;
}

export async function getReportedListings(filters: {
  risk?: ReportedListing['risk'];
  status?: ReportedListing['status'];
} = {}) {
  const response = await api.get<{ reports: ReportedListing[] }>(
    '/advisory/reported-listings',
    { params: filters },
  );
  return response.data.reports;
}

export async function reviewReportedListing(
  reportId: string,
  input: {
    action: 'review' | 'suspend' | 'dismiss' | 'resolve';
    reviewNote?: string;
    risk?: ReportedListing['risk'];
  },
) {
  const response = await api.patch<{ message: string; report: ReportedListing }>(
    `/advisory/reported-listings/${reportId}/review`,
    input,
  );
  return response.data.report;
}

export async function getAdvisoryReportOverview() {
  const response = await api.get<AdvisoryReportOverview>('/advisory/reports/overview');
  return response.data;
}

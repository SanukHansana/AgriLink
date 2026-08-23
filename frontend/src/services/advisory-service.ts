import { isAxiosError } from 'axios';

import { api } from '@/services/api';
import type {
  AdvisoryNotice,
  AdvisoryNoticeInput,
  AssistanceRequest,
  AssistanceRequestCategory,
  AssistanceRequestPriority,
  AssistanceRequestStatus,
  OfficerProfile,
  OfficialResponseType,
  QualityGuideline,
  QualityGuidelineInput,
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

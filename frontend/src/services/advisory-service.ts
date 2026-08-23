import { isAxiosError } from 'axios';

import { api } from '@/services/api';
import type {
  AdvisoryNotice,
  AssistanceRequest,
  AssistanceRequestCategory,
  AssistanceRequestPriority,
  AssistanceRequestStatus,
  OfficerProfile,
  OfficialResponseType,
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

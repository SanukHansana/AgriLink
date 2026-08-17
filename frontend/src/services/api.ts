import { create, isAxiosError } from 'axios';

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');

  if (!configuredUrl) {
    return 'http://localhost:5001/api';
  }

  return configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`;
}

export const api = create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export function getApiErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'Unable to connect to AgriLink. Please try again.';
  }

  return 'Something went wrong. Please try again.';
}

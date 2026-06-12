import { apiFetch } from './client';
import { UserHistoryResponse } from './types';

export async function getUserHistory(
  days = 30,
  traceLimit = 10
): Promise<UserHistoryResponse> {
  const params = new URLSearchParams({
    days: String(days),
    trace_limit: String(traceLimit),
  });
  return apiFetch<UserHistoryResponse>(`/api/v1/users/me/history?${params.toString()}`);
}

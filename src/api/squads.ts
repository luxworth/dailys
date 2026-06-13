import { apiFetch } from './client';
import {
  MySquadResponse,
  SquadCreatedResponse,
  SquadLeaderboardResponse,
  PercentileResponse,
} from './types';

export async function createSquad(name: string): Promise<SquadCreatedResponse> {
  return apiFetch<SquadCreatedResponse>('/api/v1/squads', {
    method: 'POST',
    body: { name },
  });
}

export async function joinSquad(inviteCode: string): Promise<MySquadResponse> {
  return apiFetch<MySquadResponse>('/api/v1/squads/join', {
    method: 'POST',
    body: { invite_code: inviteCode },
  });
}

export async function getMySquad(): Promise<MySquadResponse | null> {
  return apiFetch<MySquadResponse | null>('/api/v1/users/me/squad');
}

export async function leaveSquad(): Promise<void> {
  await apiFetch<void>('/api/v1/users/me/squad', { method: 'DELETE' });
}

export async function getSquadLeaderboard(squadId: string): Promise<SquadLeaderboardResponse> {
  return apiFetch<SquadLeaderboardResponse>(`/api/v1/squads/${squadId}/leaderboard`);
}

export async function getPercentile(): Promise<number | null> {
  const result = await apiFetch<PercentileResponse>('/api/v1/users/me/percentile');
  return result.percentile;
}

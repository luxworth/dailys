import { apiFetch } from './client';
import { ChallengeToday, FeedPage, StreakResponse, UserItemsResponse } from './types';

export async function getTodayChallenge(): Promise<ChallengeToday> {
  return apiFetch<ChallengeToday>('/api/v1/challenges/today');
}

export async function getTodayFeed(cursor?: string): Promise<FeedPage> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set('cursor', cursor);
  }
  const query = params.toString();
  return apiFetch<FeedPage>(`/api/v1/challenges/today/feed${query ? `?${query}` : ''}`);
}

export async function getStreak(): Promise<number> {
  const result = await apiFetch<StreakResponse>('/api/v1/users/me/streak');
  return result.streak;
}

export async function getUserItems(): Promise<UserItemsResponse> {
  return apiFetch<UserItemsResponse>('/api/v1/users/me/items');
}

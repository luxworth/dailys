import { apiFetch } from './client';

export async function updatePushToken(expoPushToken: string): Promise<void> {
  await apiFetch<void>('/api/v1/users/me/push-token', {
    method: 'PUT',
    body: { expo_push_token: expoPushToken },
  });
}

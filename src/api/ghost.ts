import { apiFetch } from './client';
import { GhostDeployResponse, TransactionalResponse } from './types';

export async function deployGhost(
  challengeId: string
): Promise<TransactionalResponse<GhostDeployResponse>> {
  return apiFetch<TransactionalResponse<GhostDeployResponse>>('/api/v1/ghost/deploy', {
    method: 'POST',
    body: { challenge_id: challengeId },
  });
}
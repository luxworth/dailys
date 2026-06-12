import { apiFetch } from './client';
import { ApiReactionType } from './types';

export async function upsertReaction(
  submissionId: string,
  reactionType: ApiReactionType
): Promise<void> {
  await apiFetch(`/api/v1/submissions/${submissionId}/reaction`, {
    method: 'PUT',
    body: { reaction_type: reactionType },
  });
}

export async function deleteReaction(submissionId: string): Promise<void> {
  await apiFetch(`/api/v1/submissions/${submissionId}/reaction`, {
    method: 'DELETE',
  });
}

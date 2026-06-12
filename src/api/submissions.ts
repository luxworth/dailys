import { apiFetch } from './client';
import { SubmissionPayload, SubmissionResponse, TransactionalResponse, UploadResponse } from './types';

export async function createSubmission(
  payload: SubmissionPayload
): Promise<TransactionalResponse<SubmissionResponse>> {
  return apiFetch<TransactionalResponse<SubmissionResponse>>('/api/v1/submissions', {
    method: 'POST',
    body: payload,
  });
}
export async function uploadImage(localUri: string): Promise<string> {
  const form = new FormData();
  const filename = localUri.split('/').pop() ?? 'proof.jpg';
  const extension = filename.split('.').pop()?.toLowerCase();
  const mimeType =
    extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

  form.append('file', {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  const result = await apiFetch<UploadResponse>('/api/v1/uploads', {
    method: 'POST',
    body: form,
  });
  return result.image_url;
}

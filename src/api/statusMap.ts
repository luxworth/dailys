import { CompletionStatus } from '../types';
import { ApiHistoryDayStatus, ApiSubmissionStatus, ChallengeToday } from './types';

export function mapChallengeToUiStatus(challenge: ChallengeToday, now = Date.now()): CompletionStatus {
  const closesAt = new Date(challenge.closes_at).getTime();
  const submission = challenge.submission;

  if (!submission) {
    return now >= closesAt ? 'FAILED' : 'PENDING';
  }

  if (submission.status === 'SUCCESS') {
    return 'SUBMITTED';
  }

  if (submission.status === 'FAILED') {
    return 'FAILED';
  }

  return 'PENDING';
}

export function getSubmissionPreview(challenge: ChallengeToday): string | undefined {
  const submission = challenge.submission;
  if (!submission) {
    return undefined;
  }

  if (submission.is_ghost) {
    return '[GHOST MODE DEPLOYED]';
  }

  if (submission.text_value) {
    return submission.text_value;
  }

  if (submission.number_value !== null && submission.number_value !== undefined) {
    return String(submission.number_value);
  }

  if (submission.image_url) {
    return submission.image_url;
  }

  return undefined;
}

export function isVerifying(challenge: ChallengeToday): boolean {
  return challenge.submission?.status === 'PENDING';
}

export function mapSubmissionStatusToUi(
  status: ApiSubmissionStatus | null | undefined
): CompletionStatus {
  if (status === 'SUCCESS') {
    return 'SUBMITTED';
  }
  if (status === 'FAILED') {
    return 'FAILED';
  }
  return 'PENDING';
}

export function mapHistoryDayStatus(
  status: ApiHistoryDayStatus
): CompletionStatus | 'NONE' {
  if (status === 'SUCCESS') {
    return 'SUBMITTED';
  }
  if (status === 'FAILED') {
    return 'FAILED';
  }
  if (status === 'PENDING') {
    return 'PENDING';
  }
  return 'NONE';
}

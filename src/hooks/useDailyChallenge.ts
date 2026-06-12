import { useChallenge } from '../context/ChallengeContext';
import { CompletionStatus, DayEntry, Task } from '../types';

interface DailyChallengeState {
  loading: boolean;
  today: string;
  task: Task;
  entry: DayEntry;
  status: CompletionStatus;
  streak: number;
  ghostsRemaining: number;
  isVerifying: boolean;
  error: string | null;
  sequenceNumber: number;
  closesAt: string | null;
  refresh: () => Promise<void>;
  submit: (value: string) => Promise<boolean>;
  deployGhost: () => Promise<boolean>;
}

export function useDailyChallenge(): DailyChallengeState {
  const {
    loading,
    today,
    task,
    status,
    streak,
    ghostsRemaining,
    isVerifying,
    error,
    sequenceNumber,
    closesAt,
    submissionPreview,
    challenge,
    refresh,
    submit,
    deployGhost,
  } = useChallenge();

  const entry: DayEntry = {
    date: today,
    taskId: task.id,
    status,
    submission: submissionPreview,
    submittedAt: challenge?.submission?.submitted_at ?? undefined,
  };

  return {
    loading,
    today,
    task,
    entry,
    status,
    streak,
    ghostsRemaining,
    isVerifying,
    error,
    sequenceNumber,
    closesAt,
    refresh,
    submit,
    deployGhost,
  };
}

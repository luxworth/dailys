import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getTodayChallenge, getStreak, getUserItems } from '../api/challenges';
import { deployGhost as apiDeployGhost } from '../api/ghost';
import { createSubmission, uploadImage } from '../api/submissions';
import { getSubmissionPreview, mapChallengeToUiStatus } from '../api/statusMap';
import { ApiRequestError } from '../api/client';
import { ChallengeToday } from '../api/types';
import { InteractionEngine } from '../interaction/InteractionEngine';
import { CompletionStatus, Task, TaskType } from '../types';
import { getLocalDateString } from '../utils/dateUtils';
import { useAuth } from './AuthContext';

interface ChallengeContextValue {
  loading: boolean;
  error: string | null;
  today: string;
  challenge: ChallengeToday | null;
  challengeId: string | null;
  sequenceNumber: number;
  task: Task;
  closesAt: string | null;
  status: CompletionStatus;
  submissionPreview: string | undefined;
  isGhost: boolean;
  isVerifying: boolean;
  streak: number;
  ghostsRemaining: number;
  refresh: () => Promise<void>;
  submit: (value: string) => Promise<boolean>;
  deployGhost: () => Promise<boolean>;
}

const ChallengeContext = createContext<ChallengeContextValue | null>(null);

const EMPTY_TASK: Task = {
  id: '0',
  title: 'No active challenge',
  type: 'TEXT',
  placeholder: '',
};

function mapTask(challenge: ChallengeToday | null, sequenceNumber: number): Task {
  if (!challenge) {
    return EMPTY_TASK;
  }

  return {
    id: String(sequenceNumber).padStart(3, '0'),
    title: challenge.task.title,
    type: challenge.task.task_type as TaskType,
    placeholder: challenge.task.placeholder ?? undefined,
  };
}

async function pollUntilVerified(): Promise<ChallengeToday> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const next = await getTodayChallenge();
    const status = next.submission?.status;
    if (status === 'SUCCESS' || status === 'FAILED') {
      return next;
    }
  }
  return getTodayChallenge();
}

export function ChallengeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<ChallengeToday | null>(null);
  const [streak, setStreak] = useState(0);
  const [ghostsRemaining, setGhostsRemaining] = useState(0);
  const today = getLocalDateString();

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setChallenge(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [todayChallenge, streakValue, items] = await Promise.all([
        getTodayChallenge(),
        getStreak(),
        getUserItems(),
      ]);
      setChallenge(todayChallenge);
      setStreak(streakValue);
      setGhostsRemaining(items.ghost);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load challenge';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(
    async (value: string): Promise<boolean> => {
      if (!challenge) {
        return false;
      }

      const trimmed = value.trim();
      try {
        let payload: { number_value?: string; text_value?: string; image_url?: string };

        if (challenge.task.task_type === 'NUMBER') {
          payload = { number_value: trimmed };
        } else if (challenge.task.task_type === 'TEXT') {
          payload = { text_value: trimmed };
        } else {
          const imageUrl = await uploadImage(trimmed);
          payload = { image_url: imageUrl };
        }

        const response = await createSubmission(payload);
        void InteractionEngine.fire(response.interaction);
        const verified = await pollUntilVerified();
        setChallenge(verified);
        const [streakValue, items] = await Promise.all([getStreak(), getUserItems()]);
        setStreak(streakValue);
        setGhostsRemaining(items.ghost);
        return true;
      } catch (err) {
        const message =
          err instanceof ApiRequestError ? err.message : 'Submission failed';
        setError(message);
        return false;
      }
    },
    [challenge]
  );

  const deployGhost = useCallback(async (): Promise<boolean> => {
    if (!challenge) {
      return false;
    }

    try {
      const result = await apiDeployGhost(challenge.challenge_id);
      void InteractionEngine.fire(result.interaction);
      const [todayChallenge, streakValue] = await Promise.all([
        getTodayChallenge(),
        getStreak(),
      ]);
      setChallenge(todayChallenge);
      setStreak(streakValue);
      setGhostsRemaining(result.data.ghosts_remaining);
      return true;
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : 'Ghost deploy failed';
      setError(message);
      return false;
    }
  }, [challenge]);

  const sequenceNumber = challenge?.sequence_number ?? 0;
  const status = challenge ? mapChallengeToUiStatus(challenge) : 'PENDING';
  const submissionPreview = challenge ? getSubmissionPreview(challenge) : undefined;
  const isGhost = challenge?.submission?.is_ghost ?? false;
  const isVerifyingSubmission =
    challenge?.submission?.status === 'PENDING' && status === 'PENDING';

  const value = useMemo(
    () => ({
      loading,
      error,
      today,
      challenge,
      challengeId: challenge?.challenge_id ?? null,
      sequenceNumber,
      task: mapTask(challenge, sequenceNumber),
      closesAt: challenge?.closes_at ?? null,
      status,
      submissionPreview,
      isGhost,
      isVerifying: isVerifyingSubmission,
      streak,
      ghostsRemaining,
      refresh: load,
      submit,
      deployGhost,
    }),
    [
      loading,
      error,
      today,
      challenge,
      sequenceNumber,
      status,
      submissionPreview,
      isGhost,
      isVerifyingSubmission,
      streak,
      ghostsRemaining,
      load,
      submit,
      deployGhost,
    ]
  );

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
}

export function useChallenge(): ChallengeContextValue {
  const ctx = useContext(ChallengeContext);
  if (!ctx) {
    throw new Error('useChallenge must be used within ChallengeProvider');
  }
  return ctx;
}

/** Flame tiers align with backend streak milestones (7 → STREAK_7, 30 → STREAK_30). */

export interface FlameTier {
  tier: number;
  name: string;
  minStreak: number;
  color: string;
  borderColor: string;
  glowColor: string;
}

export const FLAME_TIERS: readonly FlameTier[] = [
  {
    tier: 1,
    name: 'Spark',
    minStreak: 0,
    color: '#9CA3AF',
    borderColor: 'rgba(156,163,175,0.35)',
    glowColor: 'rgba(156,163,175,0.12)',
  },
  {
    tier: 2,
    name: 'Ember',
    minStreak: 3,
    color: '#F59E0B',
    borderColor: 'rgba(245,158,11,0.4)',
    glowColor: 'rgba(245,158,11,0.15)',
  },
  {
    tier: 3,
    name: 'Arc',
    minStreak: 7,
    color: '#22D3EE',
    borderColor: 'rgba(34,211,238,0.4)',
    glowColor: 'rgba(34,211,238,0.18)',
  },
  {
    tier: 4,
    name: 'Plasma',
    minStreak: 30,
    color: '#60A5FA',
    borderColor: 'rgba(96,165,250,0.4)',
    glowColor: 'rgba(96,165,250,0.22)',
  },
] as const;

export interface FlameEvolutionState {
  current: FlameTier;
  label: string;
  nextTier: FlameTier | null;
  daysToNext: number | null;
  progressLabel: string | null;
}

export function getFlameEvolution(streak: number): FlameEvolutionState {
  const safeStreak = Math.max(0, Math.floor(streak));
  let current = FLAME_TIERS[0];

  for (const tier of FLAME_TIERS) {
    if (safeStreak >= tier.minStreak) {
      current = tier;
    }
  }

  const currentIndex = FLAME_TIERS.findIndex((tier) => tier.tier === current.tier);
  const nextTier = currentIndex < FLAME_TIERS.length - 1 ? FLAME_TIERS[currentIndex + 1] : null;
  const daysToNext = nextTier ? Math.max(0, nextTier.minStreak - safeStreak) : null;

  let progressLabel: string | null = null;
  if (nextTier && daysToNext !== null && daysToNext > 0) {
    const dayWord = daysToNext === 1 ? 'day' : 'days';
    progressLabel = `${daysToNext} ${dayWord} to ${nextTier.name}`;
  } else if (!nextTier) {
    progressLabel = 'Max tier reached';
  }

  return {
    current,
    label: `Tier ${current.tier}: ${current.name}`,
    nextTier,
    daysToNext,
    progressLabel,
  };
}

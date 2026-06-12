import { useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CountdownTimer } from '../components/CountdownTimer';
import { StatusBadge } from '../components/StatusBadge';
import { SubmissionForm } from '../components/SubmissionForm';
import { useDailyChallenge } from '../hooks/useDailyChallenge';
import { colors } from '../theme/colors';
import { formatDisplayDate } from '../utils/dateUtils';

export function DailyChallengeScreen() {
  const { loading, today, task, entry, status, streak, refresh, submit } =
    useDailyChallenge();

  const handleMidnight = useCallback(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const isLocked = status !== 'PENDING';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>dailys</Text>
          <View style={styles.streakPill}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>
        </View>

        <Text style={styles.date}>{formatDisplayDate(today)}</Text>

        <View style={styles.card}>
          <StatusBadge status={status} />

          <Text style={styles.taskLabel}>Today's challenge</Text>
          <Text style={styles.taskTitle}>{task.title}</Text>

          <View style={styles.divider} />

          <SubmissionForm
            task={task}
            onSubmit={submit}
            disabled={isLocked}
            existingSubmission={entry.submission}
          />
        </View>

        <View style={styles.countdownCard}>
          <CountdownTimer onMidnight={handleMidnight} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  scroll: {
    gap: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  streakPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    color: colors.textMuted,
    fontSize: 15,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 24,
  },
  taskLabel: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  taskTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 4,
  },
  countdownCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 24,
  },
});

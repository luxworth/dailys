import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarGrid } from '../components/CalendarGrid';
import { useHistory } from '../hooks/useHistory';
import { colors } from '../theme/colors';
import { CompletionStatus } from '../types';

const STATUS_LABELS: Record<CompletionStatus | 'NONE', string> = {
  SUBMITTED: 'Completed',
  FAILED: 'Missed',
  PENDING: 'In progress',
  NONE: 'No data',
};

export function HistoryScreen() {
  const { loading, streak, days } = useHistory();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const recentDays = [...days].reverse().slice(0, 14);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your last 30 days at a glance</Text>

        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>

        <View style={styles.section}>
          <CalendarGrid days={days} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent days</Text>
          <View style={styles.list}>
            {recentDays.map((day) => (
              <View key={day.date} style={styles.listItem}>
                <Text style={styles.listDate}>
                  {new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View
                  style={[
                    styles.listBadge,
                    day.status === 'SUBMITTED' && styles.badgeGreen,
                    day.status === 'FAILED' && styles.badgeRed,
                    day.status === 'PENDING' && styles.badgeYellow,
                    day.status === 'NONE' && styles.badgeGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.listBadgeText,
                      day.status === 'SUBMITTED' && styles.textGreen,
                      day.status === 'FAILED' && styles.textRed,
                      day.status === 'PENDING' && styles.textYellow,
                    ]}
                  >
                    {STATUS_LABELS[day.status]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
    gap: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: -16,
  },
  streakCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 4,
    paddingVertical: 32,
  },
  streakNumber: {
    color: colors.accent,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
  },
  streakLabel: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  list: {
    gap: 0,
  },
  listItem: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  listDate: {
    color: colors.text,
    fontSize: 15,
  },
  listBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  badgeRed: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  badgeYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  badgeGray: {
    backgroundColor: colors.surfaceElevated,
  },
  listBadgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  textGreen: {
    color: colors.success,
  },
  textRed: {
    color: colors.danger,
  },
  textYellow: {
    color: colors.warning,
  },
});

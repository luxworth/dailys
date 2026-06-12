import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CountdownTimer } from '../components/CountdownTimer';
import { SubmissionForm } from '../components/SubmissionForm';
import { useDailyChallenge } from '../hooks/useDailyChallenge';
import { useScreenLayout } from '../hooks/useScreenLayout';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';

function createStyles(theme: Theme, layout: ReturnType<typeof useScreenLayout>) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    loading: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    flex: {
      flex: 1,
    },
    header: {
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      flexShrink: 0,
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: layout.header.paddingVertical,
    },
    brand: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 14,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    headerRight: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 16,
    },
    ghostBadge: {
      position: 'relative',
    },
    ghostCount: {
      alignItems: 'center',
      backgroundColor: theme.colors.text,
      borderRadius: 4,
      height: 14,
      justifyContent: 'center',
      position: 'absolute',
      right: -4,
      top: -4,
      width: 14,
    },
    ghostCountText: {
      color: theme.colors.buttonText,
      fontFamily: theme.fonts.mono,
      fontSize: 8,
      fontWeight: '700',
    },
    streakRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    streakLabel: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
    },
    streakPill: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    streakText: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
    },
    taskSection: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 24,
      paddingTop: layout.task.paddingTop,
    },
    taskBadge: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 6,
      marginBottom: layout.task.badgeMarginBottom,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    taskBadgeText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    taskTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.display,
      fontSize: layout.task.titleFontSize,
      letterSpacing: -0.5,
      lineHeight: layout.task.titleLineHeight,
      marginBottom: 4,
    },
  });
}

function statusAccentColor(
  status: 'PENDING' | 'SUBMITTED' | 'FAILED',
  theme: Theme
): string {
  if (status === 'SUBMITTED') return theme.colors.success;
  if (status === 'FAILED') return theme.colors.danger;
  return theme.colors.accent;
}

export function DailyChallengeScreen() {
  const { theme } = useTheme();
  const layout = useScreenLayout();
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const {
    loading,
    task,
    entry,
    status,
    streak,
    ghostsRemaining,
    sequenceNumber,
    closesAt,
    isVerifying,
    refresh,
    submit,
    deployGhost,
  } = useDailyChallenge();

  const handleDeadline = useCallback(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const accent = statusAccentColor(status, theme);
  const needsScroll = task.type === 'TEXT' && status === 'PENDING';

  const content = (
    <View style={styles.taskSection}>
      <View style={styles.taskBadge}>
        <Feather name="crosshair" size={10} color={accent} />
        <Text style={styles.taskBadgeText}>
          DAY {String(sequenceNumber).padStart(3, '0')} — {task.type}
        </Text>
      </View>

      <Text style={styles.taskTitle} numberOfLines={layout.tight ? 3 : 4}>
        {task.title}
      </Text>

      <SubmissionForm
        task={task}
        status={status}
        onSubmit={submit}
        onDeployGhost={deployGhost}
        ghostsRemaining={ghostsRemaining}
        disabled={status !== 'PENDING' || isVerifying}
        existingSubmission={entry.submission}
        layout={layout}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>dailys.</Text>
          <View style={styles.headerRight}>
            <View style={styles.streakRow}>
              <Text style={styles.streakLabel}>STREAK</Text>
              <View style={styles.streakPill}>
                <MaterialCommunityIcons
                  name="fire"
                  size={12}
                  color={theme.colors.accent}
                />
                <Text style={styles.streakText}>{streak}</Text>
              </View>
            </View>
          </View>
        </View>

        <CountdownTimer closesAt={closesAt} onDeadline={handleDeadline} layout={layout} />

        {needsScroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

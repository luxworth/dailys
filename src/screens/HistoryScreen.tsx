import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CalendarGrid } from '../components/CalendarGrid';
import { TrophyRoom } from '../components/TrophyRoom';
import { useHistory } from '../hooks/useHistory';
import { ScreenLayoutMetrics, useScreenLayout } from '../hooks/useScreenLayout';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';
import { formatMonthDay, formatMonthDayYear, parseDateString } from '../utils/dateUtils';
import { formatSubmissionPreview } from '../utils/traceUtils';

function createStyles(theme: Theme, layout: ScreenLayoutMetrics) {
  const { hero, section, trace } = layout;

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
      minHeight: 0,
    },
    hero: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexShrink: 0,
      paddingHorizontal: section.padding,
      paddingVertical: hero.paddingVertical,
    },
    streakNumber: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: hero.streakFontSize,
      fontWeight: '500',
      letterSpacing: -2,
      lineHeight: hero.streakLineHeight,
      marginBottom: 4,
    },
    streakLabel: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.sans,
      fontSize: hero.subtitleFontSize,
      letterSpacing: hero.subtitleLetterSpacing,
      textTransform: 'uppercase',
    },
    calendarSection: {
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexShrink: 0,
      padding: section.padding,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: section.headerMarginBottom,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    sectionRange: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
    },
    traceScroll: {
      flex: 1,
    },
    traceScrollContent: {
      padding: section.padding,
      paddingBottom: 16,
    },
    traceList: {
      gap: trace.cardGap,
    },
    traceCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      gap: trace.cardGap,
      padding: trace.cardPadding,
    },
    traceTop: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    traceDate: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    traceType: {
      borderColor: theme.colors.border,
      borderWidth: 1,
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 9,
      letterSpacing: 2,
      paddingHorizontal: 6,
      paddingVertical: 2,
      textTransform: 'uppercase',
    },
    traceTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.sans,
      fontSize: trace.titleFontSize,
      lineHeight: trace.titleLineHeight,
    },
    traceProof: {
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      borderTopWidth: 1,
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
      marginTop: 4,
      paddingTop: 10,
    },
    traceProofValue: {
      color: theme.colors.text,
    },
    emptyTrace: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.sans,
      fontSize: trace.titleFontSize,
      lineHeight: trace.titleLineHeight,
    },
    localBanner: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 1,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
  });
}

function formatShortDate(dateStr: string): string {
  return formatMonthDay(parseDateString(dateStr));
}

export function HistoryScreen() {
  const { theme } = useTheme();
  const layout = useScreenLayout();
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const { loading, streak, days, trace } = useHistory();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const rangeStart = days[0]?.date;
  const rangeEnd = days[days.length - 1]?.date;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.flex}>
        <View style={styles.hero}>
          <MaterialCommunityIcons
            name="fire"
            size={layout.hero.iconSize}
            color={theme.colors.accent}
            style={{ marginBottom: layout.hero.iconMarginBottom, opacity: 0.8 }}
          />
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>

        <View style={styles.calendarSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>30-Day Activity</Text>
            {rangeStart && rangeEnd && (
              <Text style={styles.sectionRange}>
                {formatShortDate(rangeStart)} — {formatShortDate(rangeEnd)}
              </Text>
            )}
          </View>
          <CalendarGrid days={days} layout={layout} />
        </View>

        <TrophyRoom layout={layout} />

        <ScrollView
          style={styles.traceScroll}
          contentContainerStyle={styles.traceScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { marginBottom: layout.section.titleMarginBottom }]}>
            Proof Trace
          </Text>

          {trace.length === 0 ? (
            <Text style={styles.emptyTrace}>
              No signal yet. Complete a daily to populate your trace.
            </Text>
          ) : (
            <View style={styles.traceList}>
              {trace.map((item, index) => (
                <View key={`${item.date}-${index}`} style={styles.traceCard}>
                  <View style={styles.traceTop}>
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
                      <Feather name="crosshair" size={10} color={theme.colors.success} />
                      <Text style={styles.traceDate}>
                        {formatMonthDayYear(parseDateString(item.date))}
                      </Text>
                    </View>
                    <Text style={styles.traceType}>{item.type}</Text>
                  </View>
                  <Text style={styles.traceTitle}>{item.title}</Text>
                  <Text style={styles.traceProof}>
                    Proof:{' '}
                    <Text style={styles.traceProofValue}>
                      {formatSubmissionPreview(item.type, item.submission)}
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

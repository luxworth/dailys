import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenLayoutMetrics } from '../hooks/useScreenLayout';
import { useScreenLayout } from '../hooks/useScreenLayout';
import { CompletionStatus } from '../types';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';
import { parseDateString } from '../utils/dateUtils';

interface CalendarDay {
  date: string;
  status: CompletionStatus | 'NONE';
}

interface CalendarGridProps {
  days: CalendarDay[];
  layout?: ScreenLayoutMetrics;
}

function mapStatus(
  status: CompletionStatus | 'NONE'
): 'completed' | 'failed' | 'empty' {
  if (status === 'SUBMITTED') return 'completed';
  if (status === 'FAILED') return 'failed';
  return 'empty';
}

function createStyles(theme: Theme, layout: ScreenLayoutMetrics) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: layout.trace.gridGap,
    },
    cell: {
      alignItems: 'center',
      aspectRatio: 1,
      borderWidth: 1,
      justifyContent: 'center',
      width: '13%',
    },
    cellCompleted: {
      backgroundColor: `${theme.colors.success}1A`,
      borderColor: `${theme.colors.success}4D`,
    },
    cellFailed: {
      backgroundColor: `${theme.colors.danger}0D`,
      borderColor: `${theme.colors.danger}33`,
    },
    cellEmpty: {
      backgroundColor: 'transparent',
      borderColor: `${theme.colors.border}80`,
    },
    dayNumber: {
      fontFamily: theme.fonts.mono,
      fontSize: layout.trace.cellFontSize,
    },
    dayCompleted: {
      color: theme.colors.success,
    },
    dayFailed: {
      color: `${theme.colors.danger}80`,
    },
    dayEmpty: {
      color: `${theme.colors.textMuted}4D`,
    },
  });
}

export function CalendarGrid({ days, layout: layoutProp }: CalendarGridProps) {
  const { theme } = useTheme();
  const defaultLayout = useScreenLayout();
  const layout = layoutProp ?? defaultLayout;
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);

  return (
    <View style={styles.grid}>
      {days.map((day) => {
        const visual = mapStatus(day.status);
        const dayNum = parseDateString(day.date).getDate();

        return (
          <View
            key={day.date}
            style={[
              styles.cell,
              visual === 'completed' && styles.cellCompleted,
              visual === 'failed' && styles.cellFailed,
              visual === 'empty' && styles.cellEmpty,
            ]}
          >
            <Text
              style={[
                styles.dayNumber,
                visual === 'completed' && styles.dayCompleted,
                visual === 'failed' && styles.dayFailed,
                visual === 'empty' && styles.dayEmpty,
              ]}
            >
              {dayNum}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

import { StyleSheet, Text, View } from 'react-native';
import { CompletionStatus } from '../types';
import { colors } from '../theme/colors';
import { getLocalDateString, parseDateString } from '../utils/dateUtils';

interface CalendarDay {
  date: string;
  status: CompletionStatus | 'NONE';
}

interface CalendarGridProps {
  days: CalendarDay[];
}

const STATUS_COLORS: Record<CompletionStatus | 'NONE' | 'TODAY', string> = {
  SUBMITTED: colors.success,
  FAILED: colors.danger,
  PENDING: colors.warning,
  NONE: colors.border,
  TODAY: colors.accent,
};

function getDayStatus(
  date: string,
  status: CompletionStatus | 'NONE',
  today: string
): CompletionStatus | 'NONE' | 'TODAY' {
  if (date === today) {
    return 'TODAY';
  }
  return status;
}

export function CalendarGrid({ days }: CalendarGridProps) {
  const today = getLocalDateString();
  const firstDate = days[0]?.date;
  const monthLabel = firstDate
    ? parseDateString(firstDate).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : '';

  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const firstWeekday = firstDate ? parseDateString(firstDate).getDay() : 0;
  const padding = Array.from({ length: firstWeekday }, (_, i) => i);

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {padding.map((key) => (
          <View key={`pad-${key}`} style={styles.cell} />
        ))}
        {days.map((day) => {
          const dayNum = parseDateString(day.date).getDate();
          const visualStatus = getDayStatus(day.date, day.status, today);
          const isToday = day.date === today;

          return (
            <View key={day.date} style={styles.cell}>
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor:
                      visualStatus === 'TODAY'
                        ? 'transparent'
                        : day.status === 'NONE'
                          ? colors.surfaceElevated
                          : `${STATUS_COLORS[day.status]}22`,
                    borderColor: isToday ? colors.accent : 'transparent',
                    borderWidth: isToday ? 2 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && { color: colors.accent },
                    day.status === 'SUBMITTED' && { color: colors.success },
                    day.status === 'FAILED' && { color: colors.danger },
                  ]}
                >
                  {dayNum}
                </Text>
                {day.status !== 'NONE' && day.status !== 'PENDING' && (
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_COLORS[day.status] },
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.success} label="Completed" />
        <LegendItem color={colors.danger} label="Missed" />
        <LegendItem color={colors.accent} label="Today" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  monthLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    width: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: '14.28%',
  },
  dayCircle: {
    alignItems: 'center',
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  dayNumber: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  statusDot: {
    borderRadius: 3,
    bottom: 4,
    height: 5,
    position: 'absolute',
    width: 5,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

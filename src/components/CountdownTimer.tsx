import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenLayoutMetrics, useScreenLayout } from '../hooks/useScreenLayout';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';
import { formatCountdown } from '../utils/dateUtils';

interface CountdownTimerProps {
  closesAt?: string | null;
  onDeadline?: () => void;
  layout?: ScreenLayoutMetrics;
}

function createStyles(theme: Theme, layout: ScreenLayoutMetrics) {
  const { countdown } = layout;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexShrink: 0,
      paddingHorizontal: 24,
      paddingVertical: countdown.paddingVertical,
    },
    label: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: countdown.labelFontSize,
      letterSpacing: 3,
      marginBottom: countdown.labelMarginBottom,
      textTransform: 'uppercase',
    },
    timer: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: countdown.timerFontSize,
      fontWeight: '500',
      letterSpacing: -1,
      lineHeight: countdown.timerFontSize + 4,
    },
    dateLine: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: countdown.dateFontSize,
      letterSpacing: 2,
      marginTop: countdown.dateMarginTop,
      textTransform: 'uppercase',
    },
  });
}

function getMsUntil(iso: string): number {
  return Math.max(0, new Date(iso).getTime() - Date.now());
}

export function CountdownTimer({ closesAt, onDeadline, layout: layoutProp }: CountdownTimerProps) {
  const { theme } = useTheme();
  const defaultLayout = useScreenLayout();
  const layout = layoutProp ?? defaultLayout;
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const [remaining, setRemaining] = useState(() =>
    closesAt ? getMsUntil(closesAt) : 0
  );
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (!closesAt) {
      return;
    }

    const tick = () => {
      const ms = getMsUntil(closesAt);
      setRemaining(ms);
      if (ms <= 1000 && !fired) {
        setFired(true);
        onDeadline?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [closesAt, fired, onDeadline]);

  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
  const monthDay = now
    .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    .toUpperCase();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>TIME REMAINING</Text>
      <Text style={styles.timer}>{closesAt ? formatCountdown(remaining) : '--:--:--'}</Text>
      <Text style={styles.dateLine}>
        {weekday} › {monthDay}
      </Text>
    </View>
  );
}

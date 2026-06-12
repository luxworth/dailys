import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { formatCountdown, getMsUntilMidnight } from '../utils/dateUtils';

interface CountdownTimerProps {
  onMidnight?: () => void;
}

export function CountdownTimer({ onMidnight }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(getMsUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = getMsUntilMidnight();
      setRemaining(ms);
      if (ms <= 1000) {
        onMidnight?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onMidnight]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Next challenge in</Text>
      <Text style={styles.timer}>{formatCountdown(remaining)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timer: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
});

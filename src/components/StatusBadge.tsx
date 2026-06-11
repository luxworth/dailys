import { StyleSheet, Text, View } from 'react-native';
import { CompletionStatus } from '../types';
import { colors } from '../theme/colors';

const STATUS_CONFIG: Record<
  CompletionStatus,
  { label: string; color: string; background: string }
> = {
  PENDING: {
    label: 'Pending',
    color: colors.warning,
    background: 'rgba(251, 191, 36, 0.15)',
  },
  SUBMITTED: {
    label: 'Submitted',
    color: colors.success,
    background: 'rgba(52, 211, 153, 0.15)',
  },
  FAILED: {
    label: 'Failed',
    color: colors.danger,
    background: 'rgba(248, 113, 113, 0.15)',
  },
};

interface StatusBadgeProps {
  status: CompletionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.background }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

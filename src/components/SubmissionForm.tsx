import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CompletionStatus, Task } from '../types';
import { GHOST_SUBMISSION } from '../types/prefs';
import { ScreenLayoutMetrics, useScreenLayout } from '../hooks/useScreenLayout';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';
import { ImageSubmission } from './ImageSubmission';
import { NumberSubmission } from './NumberSubmission';
import { TextSubmission } from './TextSubmission';

interface SubmissionFormProps {
  task: Task;
  status: CompletionStatus;
  onSubmit: (value: string) => Promise<boolean>;
  onDeployGhost?: () => Promise<boolean>;
  ghostsRemaining?: number;
  disabled?: boolean;
  existingSubmission?: string;
  layout?: ScreenLayoutMetrics;
}

function createStyles(theme: Theme, layout: ScreenLayoutMetrics) {
  const { submission } = layout;

  return StyleSheet.create({
    container: {
      flex: 1,
      gap: 0,
      justifyContent: 'flex-end',
      minHeight: 0,
      paddingBottom: 8,
      paddingTop: submission.paddingTop,
      width: '100%',
    },
    lockedContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 24,
    },
    iconCircle: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 48,
      borderWidth: 1,
      height: layout.tight ? 72 : 88,
      justifyContent: 'center',
      marginBottom: layout.tight ? 16 : 20,
      width: layout.tight ? 72 : 88,
    },
    iconCircleFailed: {
      backgroundColor: theme.colors.background,
    },
    statusLabel: {
      fontFamily: theme.fonts.mono,
      fontSize: 12,
      letterSpacing: 3,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    statusHint: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      textAlign: 'center',
    },
    proofBox: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      borderWidth: 1,
      marginTop: layout.tight ? 20 : 28,
      minWidth: 200,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    proofText: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: layout.tight ? 22 : 26,
      opacity: 0.7,
      textAlign: 'center',
    },
    proofImage: {
      height: submission.imageMaxHeight,
      width: '100%',
    },
    submitButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.text,
      marginTop: submission.submitMarginTop,
      paddingVertical: layout.tight ? 16 : 18,
    },
    submitButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    submitButtonDisabled: {
      opacity: 0.3,
    },
    submitText: {
      color: theme.colors.buttonText,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 3.2,
      textTransform: 'uppercase',
    },
    ghostButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      marginTop: layout.tight ? 20 : 28,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    ghostButtonText: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  });
}

export function SubmissionForm({
  task,
  status,
  onSubmit,
  onDeployGhost,
  ghostsRemaining = 0,
  disabled = false,
  existingSubmission,
  layout: layoutProp,
}: SubmissionFormProps) {
  const { theme } = useTheme();
  const defaultLayout = useScreenLayout();
  const layout = layoutProp ?? defaultLayout;
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const [value, setValue] = useState(existingSubmission ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [ghosting, setGhosting] = useState(false);
  const isGhostSubmission = existingSubmission === GHOST_SUBMISSION;

  const handleSubmit = async () => {
    if (disabled || submitting) {
      return;
    }

    const trimmed = value.trim();
    if (!trimmed && task.type !== 'IMAGE') {
      Alert.alert('Almost there', 'Please complete your submission before submitting.');
      return;
    }

    if (task.type === 'IMAGE' && !trimmed) {
      Alert.alert('Almost there', 'Please capture or upload a photo first.');
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit(trimmed);
      if (!success) {
        Alert.alert('Submission failed', 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeployGhost = async () => {
    if (!onDeployGhost || ghosting) {
      return;
    }

    Alert.alert(
      'Deploy Ghost Mode?',
      'This consumes one ghost token and saves your streak for this challenge.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deploy',
          style: 'destructive',
          onPress: async () => {
            setGhosting(true);
            try {
              const success = await onDeployGhost();
              if (!success) {
                Alert.alert('Ghost unavailable', 'Unable to deploy ghost mode.');
              }
            } finally {
              setGhosting(false);
            }
          },
        },
      ]
    );
  };

  if (status === 'SUBMITTED') {
    return (
      <View style={styles.lockedContainer}>
        <View style={styles.iconCircle}>
          {isGhostSubmission ? (
            <Feather name="moon" size={32} color={theme.colors.success} />
          ) : (
            <Feather name="lock" size={32} color={theme.colors.success} />
          )}
        </View>
        <Text style={[styles.statusLabel, { color: theme.colors.success }]}>
          {isGhostSubmission ? 'Streak Saved' : 'Proof Recorded'}
        </Text>
        <Text style={styles.statusHint}>
          {isGhostSubmission
            ? 'The ghost walks in your place. Return tomorrow.'
            : 'Day secured. Return tomorrow.'}
        </Text>
        <View style={styles.proofBox}>
          {task.type === 'IMAGE' && existingSubmission && !isGhostSubmission ? (
            <Image source={{ uri: existingSubmission }} style={styles.proofImage} />
          ) : (
            <Text style={styles.proofText}>{existingSubmission}</Text>
          )}
        </View>
      </View>
    );
  }

  if (status === 'FAILED') {
    return (
      <View style={styles.lockedContainer}>
        <View style={[styles.iconCircle, styles.iconCircleFailed]}>
          <Feather name="x-circle" size={32} color={theme.colors.danger} />
        </View>
        <Text style={[styles.statusLabel, { color: theme.colors.danger }]}>
          Deadline Missed
        </Text>
        <Text style={styles.statusHint}>The day is lost. Try again tomorrow.</Text>
        {ghostsRemaining > 0 && onDeployGhost && (
          <Pressable
            style={styles.ghostButton}
            onPress={handleDeployGhost}
            disabled={ghosting}
          >
            {ghosting ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : (
              <>
                <Feather name="moon" size={14} color={theme.colors.text} />
                <Text style={styles.ghostButtonText}>Deploy Ghost Mode</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    );
  }

  const canSubmit = task.type === 'IMAGE' ? Boolean(value.trim()) : Boolean(value.trim());

  return (
    <View style={styles.container}>
      {task.type === 'IMAGE' && (
        <ImageSubmission
          value={value}
          placeholder={task.placeholder}
          onChange={setValue}
          disabled={disabled}
          maxHeight={layout.submission.imageMaxHeight}
        />
      )}
      {task.type === 'NUMBER' && (
        <NumberSubmission
          value={value}
          placeholder="0"
          onChange={setValue}
          disabled={disabled}
          fontSize={layout.submission.numberFontSize}
        />
      )}
      {task.type === 'TEXT' && (
        <TextSubmission
          value={value}
          placeholder={task.placeholder}
          onChange={setValue}
          disabled={disabled}
          minHeight={layout.submission.textMinHeight}
        />
      )}

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.submitButtonPressed,
          (!canSubmit || submitting) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit || submitting}
      >
        {submitting ? (
          <ActivityIndicator color={theme.colors.buttonText} />
        ) : (
          <Text style={styles.submitText}>Submit Proof</Text>
        )}
      </Pressable>
    </View>
  );
}

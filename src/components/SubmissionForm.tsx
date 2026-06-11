import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Task } from '../types';
import { colors } from '../theme/colors';
import { ImageSubmission } from './ImageSubmission';
import { NumberSubmission } from './NumberSubmission';
import { TextSubmission } from './TextSubmission';

interface SubmissionFormProps {
  task: Task;
  onSubmit: (value: string) => Promise<boolean>;
  disabled?: boolean;
  existingSubmission?: string;
}

export function SubmissionForm({
  task,
  onSubmit,
  disabled = false,
  existingSubmission,
}: SubmissionFormProps) {
  const [value, setValue] = useState(existingSubmission ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (disabled || submitting) {
      return;
    }

    if (!value.trim()) {
      Alert.alert('Almost there', 'Please complete your submission before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit(value);
      if (!success) {
        Alert.alert('Submission failed', 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = () => {
    switch (task.type) {
      case 'IMAGE':
        return (
          <ImageSubmission
            value={value}
            placeholder={task.placeholder}
            onChange={setValue}
            disabled={disabled}
          />
        );
      case 'NUMBER':
        return (
          <NumberSubmission
            value={value}
            placeholder={task.placeholder}
            onChange={setValue}
            disabled={disabled}
          />
        );
      case 'TEXT':
        return (
          <TextSubmission
            value={value}
            placeholder={task.placeholder}
            onChange={setValue}
            disabled={disabled}
          />
        );
    }
  };

  if (disabled && existingSubmission) {
    return (
      <View style={styles.container}>
        <Text style={styles.lockedLabel}>Your submission</Text>
        {task.type === 'IMAGE' ? (
          <ImageSubmission value={existingSubmission} onChange={() => {}} disabled />
        ) : (
          <View style={styles.submittedBox}>
            <Text style={styles.submittedText}>{existingSubmission}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderInput()}
      {!disabled && (
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitButtonPressed,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    width: '100%',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  lockedLabel: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  submittedBox: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  submittedText: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
  },
});

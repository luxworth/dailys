import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';

interface TextSubmissionProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minHeight?: number;
}

function createStyles(theme: Theme, minHeight: number) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    input: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
      borderWidth: 1,
      color: theme.colors.text,
      fontFamily: theme.fonts.sans,
      fontSize: 16,
      lineHeight: 22,
      minHeight,
      padding: 14,
      textAlignVertical: 'top',
    },
    disabled: {
      opacity: 0.5,
    },
  });
}

export function TextSubmission({
  value,
  placeholder = 'Type your response...',
  onChange,
  disabled = false,
  minHeight = 112,
}: TextSubmissionProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, minHeight), [theme, minHeight]);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, disabled && styles.disabled]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={`${theme.colors.textMuted}80`}
        multiline
        editable={!disabled}
        maxLength={500}
        textAlignVertical="top"
      />
    </View>
  );
}

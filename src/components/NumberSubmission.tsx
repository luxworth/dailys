import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';

interface NumberSubmissionProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fontSize?: number;
}

function createStyles(theme: Theme, fontSize: number) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    input: {
      backgroundColor: 'transparent',
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 2,
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize,
      lineHeight: fontSize + 6,
      paddingBottom: 12,
      textAlign: 'center',
    },
    inputFocused: {
      borderBottomColor: theme.colors.accent,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}

export function NumberSubmission({
  value,
  placeholder = '0',
  onChange,
  disabled = false,
  fontSize = 56,
}: NumberSubmissionProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, fontSize), [theme, fontSize]);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, disabled && styles.disabled]}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
        placeholderTextColor={`${theme.colors.textMuted}80`}
        keyboardType="number-pad"
        editable={!disabled}
        maxLength={10}
      />
    </View>
  );
}

import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

interface TextSubmissionProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TextSubmission({
  value,
  placeholder = 'Type your answer',
  onChange,
  disabled = false,
}: TextSubmissionProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, disabled && styles.disabled]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        editable={!disabled}
        maxLength={500}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 120,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});

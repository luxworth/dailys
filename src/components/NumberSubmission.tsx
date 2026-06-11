import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

interface NumberSubmissionProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function NumberSubmission({
  value,
  placeholder = 'Enter a number',
  onChange,
  disabled = false,
}: NumberSubmissionProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, disabled && styles.disabled]}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        editable={!disabled}
        maxLength={10}
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
    fontSize: 32,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingVertical: 18,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

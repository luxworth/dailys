import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';
import { Feather } from '@expo/vector-icons';

interface ImageSubmissionProps {
  value: string;
  placeholder?: string;
  onChange: (uri: string) => void;
  disabled?: boolean;
  maxHeight?: number;
}

function createStyles(theme: Theme, maxHeight: number) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    placeholder: {
      alignItems: 'center',
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      borderWidth: 2,
      gap: 12,
      height: maxHeight,
      justifyContent: 'center',
      width: '100%',
    },
    disabled: {
      opacity: 0.5,
    },
    placeholderText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    preview: {
      height: maxHeight,
      width: '100%',
    },
    changeText: {
      color: theme.colors.accent,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 2,
      marginTop: 10,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
  });
}

export function ImageSubmission({
  value,
  onChange,
  disabled = false,
  maxHeight = 180,
}: ImageSubmissionProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, maxHeight), [theme, maxHeight]);
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (disabled) {
      return;
    }

    setLoading(true);
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          useCamera
            ? 'Camera access is required to take proof photos.'
            : 'Photo library access is required to upload proof.'
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          });

      if (!result.canceled && result.assets[0]?.uri) {
        onChange(result.assets[0].uri);
      }
    } finally {
      setLoading(false);
    }
  };

  const showOptions = () => {
    Alert.alert('Add proof', 'Choose how to submit your photo', [
      { text: 'Take Photo', onPress: () => pickImage(true) },
      { text: 'Choose from Library', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      {value ? (
        <Pressable onPress={showOptions} disabled={disabled}>
          <Image source={{ uri: value }} style={styles.preview} />
          {!disabled && <Text style={styles.changeText}>Tap to change photo</Text>}
        </Pressable>
      ) : (
        <Pressable
          style={[styles.placeholder, disabled && styles.disabled]}
          onPress={showOptions}
          disabled={disabled || loading}
        >
          <Feather name="camera" size={32} color={theme.colors.textMuted} />
          <Text style={styles.placeholderText}>
            {loading ? 'Opening...' : 'Tap to capture'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

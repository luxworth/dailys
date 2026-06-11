import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

interface ImageSubmissionProps {
  value: string;
  placeholder?: string;
  onChange: (uri: string) => void;
  disabled?: boolean;
}

export function ImageSubmission({
  value,
  placeholder = 'Tap to capture or upload',
  onChange,
  disabled = false,
}: ImageSubmissionProps) {
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
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.placeholderText}>
            {loading ? 'Opening...' : placeholder}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: 8,
    justifyContent: 'center',
    minHeight: 180,
    padding: 24,
  },
  disabled: {
    opacity: 0.5,
  },
  cameraIcon: {
    fontSize: 32,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  preview: {
    borderRadius: 16,
    height: 220,
    width: '100%',
  },
  changeText: {
    color: colors.accent,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});

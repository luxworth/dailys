import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    name: 'dailys',
    slug: 'dailys',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      backgroundColor: '#050505',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dailys.app',
      infoPlist: {
        NSCameraUsageDescription:
          'dailys needs camera access to submit photo proof for daily challenges.',
        NSPhotoLibraryUsageDescription:
          'dailys needs photo library access to upload proof for daily challenges.',
      },
    },
    android: {
      package: 'com.dailys.app',
      adaptiveIcon: {
        backgroundColor: '#050505',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE'],
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-audio',
      'expo-localization',
      'expo-secure-store',
      'expo-notifications',
      [
        'expo-image-picker',
        {
          photosPermission:
            'dailys needs photo library access to upload proof for daily challenges.',
          cameraPermission:
            'dailys needs camera access to submit photo proof for daily challenges.',
        },
      ],
      '@sentry/react-native',
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
      // Set after running: npx eas init
      eas: {
        projectId:
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? 'a3dced09-9139-45fa-b746-65e0ef482ba3',
      },
    },
  }) as ExpoConfig;

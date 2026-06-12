import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  RobotoMono_400Regular,
  RobotoMono_500Medium,
} from '@expo-google-fonts/roboto-mono';
import {
  Lora_400Regular,
  Lora_600SemiBold,
} from '@expo-google-fonts/lora';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  CrimsonText_400Regular,
  CrimsonText_600SemiBold,
} from '@expo-google-fonts/crimson-text';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { useUserPrefs } from './src/hooks/useUserPrefs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChallengeProvider } from './src/context/ChallengeContext';
import { InteractionEngine } from './src/interaction/InteractionEngine';
import { initSentry, wrapWithSentry } from './src/sentry';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

initSentry();

function AppContent() {
  const { theme, ready: themeReady } = useTheme();
  const { prefs, ready: prefsReady, finishOnboarding } = useUserPrefs();
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (!themeReady || !prefsReady || authLoading) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.background,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style={theme.light ? 'dark' : 'light'} />
        <OnboardingScreen
          startAtAuth={prefs?.onboarded ?? false}
          onComplete={finishOnboarding}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme.light ? 'dark' : 'light'} />
      <ChallengeProvider>
        <AppNavigator />
      </ChallengeProvider>
    </>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    RobotoMono_400Regular,
    RobotoMono_500Medium,
    Lora_400Regular,
    Lora_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_700Bold,
    CrimsonText_400Regular,
    CrimsonText_600SemiBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    ArchivoBlack_400Regular,
  });

  useEffect(() => {
    void InteractionEngine.preload();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default wrapWithSentry(App);

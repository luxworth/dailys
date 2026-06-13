import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import { ApiRequestError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useScreenLayout } from '../hooks/useScreenLayout';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';

const STORY_DURATION_MS = 8000;
const TOTAL_SLIDES = 5;

interface OnboardingScreenProps {
  onComplete: () => void;
  startAtAuth?: boolean;
}

const SLIDES = [
  {
    id: 1,
    headline: 'DIRECTIVE 01: THE PROTOCOL',
    body: 'Every day at 00:00, a single, cryptic task is issued globally. You have until midnight to execute and submit proof — text, a number, or a photo.',
  },
  {
    id: 2,
    headline: 'DIRECTIVE 02: EARN YOUR FEED',
    body: 'The global network is dark by default. Submit your daily proof to decrypt the feed and witness how the rest of the world executed the protocol.',
  },
  {
    id: 3,
    headline: 'DIRECTIVE 03: ZERO TOLERANCE',
    body: "Missing a day terminates your streak. Your only defense is Ghost Mode — rare tokens that shield your history when deployment is impossible.",
  },
  {
    id: 4,
    headline: 'DIRECTIVE 04: THE TRACE',
    body: "You do not operate alone. Compete in micro-leaderboards (Squads), rise through flame tiers, and archive proof in your Trace.",
  },
  {
    id: 5,
    headline: 'INITIALIZE ACCESS',
    body: 'Establish your secure connection to the network.',
  },
];

function createStyles(theme: Theme, layout: ReturnType<typeof useScreenLayout>) {
  const pad = layout.section.padding;

  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    progressRow: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: pad,
      paddingTop: layout.tight ? 12 : 20,
    },
    progressTrack: {
      backgroundColor: `${theme.colors.border}66`,
      flex: 1,
      height: 4,
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: theme.colors.text,
      height: '100%',
    },
    content: {
      flexGrow: 1,
      justifyContent: 'space-between',
      padding: pad,
    },
    slideLabel: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 3,
      marginBottom: 16,
      textTransform: 'uppercase',
    },
    slideLabelAccent: {
      color: theme.colors.accent,
    },
    headline: {
      color: theme.colors.text,
      fontFamily: theme.fonts.display,
      fontSize: layout.tight ? 24 : 28,
      letterSpacing: -0.5,
      lineHeight: layout.tight ? 28 : 34,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    body: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      lineHeight: 22,
    },
    visualBox: {
      alignItems: 'center',
      backgroundColor: theme.colors.overlay,
      borderColor: theme.colors.border,
      borderWidth: 2,
      justifyContent: 'center',
      marginVertical: layout.tight ? 16 : 24,
      minHeight: layout.tight ? 160 : 200,
      padding: 16,
      width: '100%',
    },
    visualCountdown: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: layout.tight ? 36 : 44,
      fontWeight: '700',
      marginBottom: 16,
    },
    visualLabel: {
      color: theme.colors.accent,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 3,
      marginBottom: 8,
    },
    visualMission: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      width: '100%',
    },
    visualMissionText: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 11,
      textAlign: 'center',
    },
    lockTitle: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 2,
      marginTop: 12,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    squadAvatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderColor: 'rgba(96,165,250,0.4)',
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    squadPreviewRow: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      opacity: 0.7,
      padding: 8,
      width: '100%',
    },
    form: {
      gap: 12,
      marginTop: 8,
    },
    fieldLabel: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: theme.colors.overlay,
      borderColor: theme.colors.border,
      borderWidth: 2,
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.text,
      marginTop: 8,
      paddingVertical: 18,
    },
    primaryButtonText: {
      color: theme.colors.buttonText,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: theme.colors.border,
      borderWidth: 2,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      paddingVertical: 14,
      width: '100%',
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 11,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    errorText: {
      color: theme.colors.danger,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
    },
    toggleText: {
      color: theme.colors.accent,
      fontFamily: theme.fonts.mono,
      fontSize: 11,
      letterSpacing: 1,
      marginTop: 8,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    dividerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      marginVertical: 8,
    },
    dividerLine: {
      backgroundColor: theme.colors.border,
      flex: 1,
      height: 1,
    },
    dividerText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 2,
    },
    footer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'flex-end',
      padding: pad,
    },
    skipButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    skipText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    nextButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
  });
}

export function OnboardingScreen({ onComplete, startAtAuth = false }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const layout = useScreenLayout();
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const { register, login } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(startAtAuth ? TOTAL_SLIDES - 1 : 0);
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState(startAtAuth);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const pausedRef = useRef(false);
  const startRef = useRef(Date.now());

  const timezone = Localization.getCalendars()[0]?.timeZone ?? 'UTC';

  const handleAuth = useCallback(async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (loginMode) {
        await login({ email: email.trim().toLowerCase(), password });
      } else {
        if (!username.trim()) {
          setAuthError('Username is required.');
          return;
        }
        await register({
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password,
          timezone,
        });
      }
      onComplete();
    } catch (err) {
      setAuthError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Authentication failed.'
      );
    } finally {
      setAuthLoading(false);
    }
  }, [email, username, password, loginMode, login, register, timezone, onComplete]);

  const goNext = useCallback(() => {
    setCurrentSlide((slide) => Math.min(slide + 1, TOTAL_SLIDES - 1));
    setProgress(0);
    startRef.current = Date.now();
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide((slide) => Math.max(slide - 1, 0));
    setProgress(0);
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (currentSlide === TOTAL_SLIDES - 1) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      if (pausedRef.current) {
        return;
      }
      const elapsed = Date.now() - startRef.current;
      const next = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(next);
      if (next >= 100) {
        goNext();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentSlide, goNext]);

  const slide = SLIDES[currentSlide];
  const isAuthSlide = currentSlide === TOTAL_SLIDES - 1;

  const renderVisual = () => {
    if (currentSlide === 0) {
      return (
        <View style={styles.visualBox}>
          <Feather
            name="terminal"
            size={20}
            color={theme.colors.textMuted}
            style={{ alignSelf: 'flex-start', marginBottom: 12 }}
          />
          <Text style={styles.visualLabel}>COUNTDOWN</Text>
          <Text style={styles.visualCountdown}>14:59:59</Text>
          <View style={styles.visualMission}>
            <Text style={styles.visualMissionText}>████████ MISSION ████████</Text>
          </View>
        </View>
      );
    }

    if (currentSlide === 1) {
      return (
        <View style={styles.visualBox}>
          <Feather name="lock" size={40} color={theme.colors.textMuted} />
          <Text style={styles.lockTitle}>
            LOCKED{'\n'}AWAITING DATA SUBMISSION
          </Text>
        </View>
      );
    }

    if (currentSlide === 2) {
      return (
        <View style={styles.visualBox}>
          <Text style={styles.visualLabel}>CURRENT STREAK</Text>
          <Text style={styles.visualCountdown}>42</Text>
          <View style={styles.secondaryButton}>
            <Feather name="shield" size={14} color={theme.colors.accent} />
            <Text style={styles.secondaryButtonText}>Deploy Ghost Token</Text>
          </View>
        </View>
      );
    }

    if (currentSlide === 3) {
      return (
        <View style={[styles.visualBox, { alignItems: 'stretch' }]}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={styles.squadAvatar}>
              <Feather name="award" size={22} color="#60A5FA" />
            </View>
            <View>
              <Text style={{ color: '#60A5FA', fontFamily: theme.fonts.mono, fontSize: 11 }}>
                PLASMA FLAME TIER
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.mono, fontSize: 10 }}>
                TOP 3%
              </Text>
            </View>
          </View>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.squadPreviewRow}>
              <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.mono, fontSize: 11 }}>
                USER_00{i}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.mono, fontSize: 10 }}>
                {50 - i * 5} DAYS
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressRow}>
        {SLIDES.map((item, index) => (
          <View key={item.id} style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    index < currentSlide ? '100%' : index === currentSlide ? `${progress}%` : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      <Pressable
        style={{ flex: 1 }}
        onPress={(event) => {
          if (isAuthSlide) return;
          const x = event.nativeEvent.locationX;
          if (x < 180) goPrev();
          else goNext();
        }}
        onPressIn={() => {
          pausedRef.current = true;
        }}
        onPressOut={() => {
          pausedRef.current = false;
          startRef.current = Date.now() - (progress / 100) * STORY_DURATION_MS;
        }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View>
            <Text style={[styles.slideLabel, isAuthSlide && styles.slideLabelAccent]}>
              {isAuthSlide
                ? 'SECURE TERMINAL'
                : `INIT SEQUENCE [${currentSlide + 1}/${TOTAL_SLIDES - 1}]`}
            </Text>
            <Text style={styles.headline}>{slide.headline}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>

          {isAuthSlide ? (
            <View style={styles.form}>
              {!loginMode && (
                <>
                  <Text style={styles.fieldLabel}>Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="OPERATOR_ID"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                  />
                </>
              )}
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="OPERATOR@NETWORK"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Text style={styles.fieldLabel}>Passphrase</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
              <Pressable
                style={styles.primaryButton}
                onPress={handleAuth}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color={theme.colors.buttonText} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {loginMode ? 'Sign In' : 'Initialize'}
                  </Text>
                )}
              </Pressable>
              <Pressable onPress={() => setLoginMode((mode) => !mode)}>
                <Text style={styles.toggleText}>
                  {loginMode ? 'Create new account' : 'Already registered? Sign in'}
                </Text>
              </Pressable>
            </View>
          ) : (
            renderVisual()
          )}
        </ScrollView>
      </Pressable>

      {!isAuthSlide && (
        <View style={styles.footer}>
          {currentSlide < TOTAL_SLIDES - 2 && (
            <Pressable
              style={styles.skipButton}
              onPress={() => setCurrentSlide(TOTAL_SLIDES - 1)}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
          <Pressable style={styles.nextButton} onPress={goNext}>
            <Feather name="chevron-right" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

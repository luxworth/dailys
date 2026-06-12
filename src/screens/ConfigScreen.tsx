import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { ScreenLayoutMetrics, useScreenLayout } from '../hooks/useScreenLayout';
import { Theme, ThemeId, THEMES } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';

function createStyles(theme: Theme, layout: ScreenLayoutMetrics) {
  const { hero, section, settings } = layout;

  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    hero: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexShrink: 0,
      paddingHorizontal: section.padding,
      paddingVertical: hero.paddingVertical,
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.display,
      fontSize: hero.titleFontSize,
      fontWeight: '500',
      marginBottom: 6,
    },
    heroSubtitle: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.sans,
      fontSize: hero.subtitleFontSize,
      letterSpacing: hero.subtitleLetterSpacing,
      textTransform: 'uppercase',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: section.padding,
      paddingBottom: 16,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
      letterSpacing: 3,
      marginBottom: section.titleMarginBottom,
      textTransform: 'uppercase',
    },
    themeList: {
      gap: settings.themeListGap,
    },
    themeButton: {
      alignItems: 'center',
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: settings.themeButtonPadding,
    },
    themeButtonActive: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.accent,
    },
    themeButtonInactive: {
      borderColor: `${theme.colors.border}80`,
    },
    themeName: {
      fontFamily: theme.fonts.display,
      fontSize: settings.themeNameSize,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    themeDesc: {
      fontFamily: theme.fonts.sans,
      fontSize: settings.themeDescSize,
      marginTop: 4,
      opacity: 0.7,
    },
    themeTextActive: {
      color: theme.colors.text,
    },
    themeTextInactive: {
      color: theme.colors.textMuted,
    },
    logoutButton: {
      alignItems: 'center',
      borderColor: theme.colors.danger,
      borderWidth: 1,
      marginTop: 32,
      paddingVertical: 14,
    },
    logoutText: {
      color: theme.colors.danger,
      fontFamily: theme.fonts.mono,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  });
}

const THEME_OPTIONS: ThemeId[] = [
  'typewriter-ritual',
  'arcade-ledger',
  'field-notes',
  'analog-static',
  'industrial',
];

export function ConfigScreen() {
  const { theme, themeId, setTheme, ready } = useTheme();
  const { user, logout } = useAuth();
  const layout = useScreenLayout();
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);

  const handleLogout = () => {
    Alert.alert('Sign out?', 'You will need to authenticate again to access the network.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.flex}>
        <View style={styles.hero}>
          <Feather
            name="sliders"
            size={layout.hero.iconSize}
            color={theme.colors.accent}
            style={{ marginBottom: layout.hero.iconMarginBottom, opacity: 0.8 }}
          />
          <Text style={styles.heroTitle}>Config</Text>
          <Text style={styles.heroSubtitle}>System Prefs</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Themes</Text>
          <View style={styles.themeList}>
            {THEME_OPTIONS.map((id) => {
              const option = THEMES[id];
              const active = themeId === id;

              return (
                <Pressable
                  key={id}
                  onPress={() => setTheme(id)}
                  style={[
                    styles.themeButton,
                    active ? styles.themeButtonActive : styles.themeButtonInactive,
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.themeName,
                        active ? styles.themeTextActive : styles.themeTextInactive,
                      ]}
                    >
                      {option.name}
                    </Text>
                    <Text
                      style={[
                        styles.themeDesc,
                        active ? styles.themeTextActive : styles.themeTextInactive,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  {active && <Feather name="check" size={18} color={theme.colors.accent} />}
                </Pressable>
              );
            })}
          </View>

          {user ? (
            <Text
              style={{
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.mono,
                fontSize: 11,
                marginTop: 24,
                textTransform: 'uppercase',
              }}
            >
              Signed in as {user.username}
            </Text>
          ) : null}

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

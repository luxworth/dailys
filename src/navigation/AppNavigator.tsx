import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme, Theme as NavThemeBase } from '@react-navigation/native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DailyChallengeScreen } from '../screens/DailyChallengeScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { SquadsScreen } from '../screens/SquadsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ConfigScreen } from '../screens/ConfigScreen';
import { useScreenLayout } from '../hooks/useScreenLayout';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme/themes';

export type RootTabParamList = {
  Daily: undefined;
  Feed: undefined;
  Squads: undefined;
  Trace: undefined;
  Config: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function createStyles(theme: Theme, layout: ReturnType<typeof useScreenLayout>) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      height: layout.tabBar.height,
      paddingBottom: 8,
      paddingTop: 6,
    },
    tabLabel: {
      fontFamily: theme.fonts.mono,
      fontSize: layout.tabBar.labelFontSize,
      letterSpacing: 1.5,
      marginTop: 2,
      textTransform: 'uppercase',
    },
  });
}

function TabIcon({
  name,
  focused,
  theme,
  size,
}: {
  name: 'crosshair' | 'globe' | 'users' | 'activity' | 'sliders';
  focused: boolean;
  theme: Theme;
  size: number;
}) {
  const color = focused ? theme.colors.text : theme.colors.tabInactive;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={name} size={size} color={color} />
    </View>
  );
}

function NavigatorContent() {
  const { theme } = useTheme();
  const layout = useScreenLayout();
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Daily"
        component={DailyChallengeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="crosshair"
              focused={focused}
              theme={theme}
              size={layout.tabBar.iconSize}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="globe"
              focused={focused}
              theme={theme}
              size={layout.tabBar.iconSize}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Squads"
        component={SquadsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="users"
              focused={focused}
              theme={theme}
              size={layout.tabBar.iconSize}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Trace"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="activity"
              focused={focused}
              theme={theme}
              size={layout.tabBar.iconSize}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Config"
        component={ConfigScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="sliders"
              focused={focused}
              theme={theme}
              size={layout.tabBar.iconSize}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { theme } = useTheme();

  const navTheme: NavThemeBase = useMemo(
    () => ({
      ...DarkTheme,
      dark: !theme.light,
      colors: {
        ...DarkTheme.colors,
        background: theme.colors.background,
        card: theme.colors.background,
        border: theme.colors.border,
        primary: theme.colors.accent,
        text: theme.colors.text,
      },
    }),
    [theme]
  );

  return (
    <NavigationContainer theme={navTheme}>
      <NavigatorContent />
    </NavigationContainer>
  );
}

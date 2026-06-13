import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CrtText } from './CrtText';
import { ScreenLayoutMetrics } from '../hooks/useScreenLayout';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';

interface TrophyTileProps {
  label: string;
  topColor: string;
  sideColor: string;
  frontColor: string;
  size?: number;
}

function TrophyTile({
  label,
  topColor,
  sideColor,
  frontColor,
  size = 72,
  monoFont,
}: TrophyTileProps & { monoFont: string }) {
  return (
    <View style={{ alignItems: 'center', height: size + 16, justifyContent: 'center', width: size + 16 }}>
      <View style={{ height: size, position: 'relative', width: size }}>
        <View
          style={{
            backgroundColor: frontColor,
            borderColor: 'rgba(255,255,255,0.35)',
            borderWidth: 1,
            height: size,
            width: size,
          }}
        />
        <View
          style={{
            backgroundColor: topColor,
            height: 8,
            left: 0,
            position: 'absolute',
            top: -4,
            transform: [{ skewX: '-35deg' }],
            width: size,
          }}
        />
        <View
          style={{
            backgroundColor: sideColor,
            height: size,
            position: 'absolute',
            right: -6,
            top: 4,
            width: 8,
          }}
        />
        <Text
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontFamily: monoFont,
            fontSize: 10,
            left: 0,
            position: 'absolute',
            right: 0,
            textAlign: 'center',
            top: size / 2 - 7,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme: Theme, layout: ScreenLayoutMetrics) {
  return StyleSheet.create({
    section: {
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      padding: layout.section.padding,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: layout.section.headerMarginBottom,
    },
    title: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    subtitle: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
    },
    grid: {
      flexDirection: 'row',
      gap: layout.tight ? 16 : 24,
      justifyContent: 'center',
      paddingBottom: layout.tight ? 8 : 16,
      paddingTop: 8,
    },
  });
}

export function TrophyRoom({ layout }: { layout: ScreenLayoutMetrics }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const tileSize = layout.tight ? 56 : layout.compact ? 64 : 72;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <CrtText style={styles.title}>Trophy Room</CrtText>
        <Text style={styles.subtitle}>DIGITAL TOYS</Text>
      </View>
      <View style={styles.grid}>
        <TrophyTile
          label="042"
          topColor="#F9D423"
          sideColor="#DA8F15"
          frontColor="#FF4E50"
          size={tileSize}
          monoFont={theme.fonts.mono}
        />
        <TrophyTile
          label="030"
          topColor="#E2E2E2"
          sideColor="#AAAAAA"
          frontColor="#999999"
          size={tileSize}
          monoFont={theme.fonts.mono}
        />
      </View>
    </View>
  );
}

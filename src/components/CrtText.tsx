import MaskedView from '@react-native-masked-view/masked-view';
import { useMemo } from 'react';
import { StyleSheet, Text, TextProps, TextStyle, View, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { crtAccentGlow, crtTextGlow } from '../theme/themeEffects';

type CrtTextProps = TextProps & {
  /** Use cyan CRT glow + stripes for accent-colored text. */
  accent?: boolean;
  /** Skip CRT stripes on secondary/muted copy. */
  muted?: boolean;
};

function ScanlineStripes({ gap }: { gap: number }) {
  const stripes = useMemo(
    () => Array.from({ length: Math.ceil(240 / gap) }, (_, index) => index * gap),
    [gap]
  );

  return (
    <>
      {stripes.map((top) => (
        <View
          key={top}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.38)',
            height: 1,
            left: 0,
            position: 'absolute',
            right: 0,
            top,
          }}
        />
      ))}
    </>
  );
}

function stripeGapForStyle(style: StyleProp<TextStyle>): number {
  const flat = StyleSheet.flatten(style) ?? {};
  const fontSize = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  return Math.max(2, Math.round(fontSize / 7));
}

export function CrtText({ style, children, accent = false, muted = false, ...rest }: CrtTextProps) {
  const { theme, themeId } = useTheme();

  if (themeId !== 'arcade-ledger' || muted) {
    return (
      <Text style={style} {...rest}>
        {children}
      </Text>
    );
  }

  const flat = StyleSheet.flatten(style) ?? {};
  const glow = accent ? crtAccentGlow(theme) : crtTextGlow(theme);
  const textColor = (flat.color as string | undefined) ?? theme.colors.text;
  const gap = stripeGapForStyle(style);
  const textStyle = [style, glow, { color: textColor }];

  return (
    <View style={styles.wrapper}>
      <Text style={textStyle} {...rest}>
        {children}
      </Text>
      <View pointerEvents="none" style={styles.stripesLayer}>
        <MaskedView
          style={styles.mask}
          maskElement={
            <View style={styles.maskContainer}>
              <Text style={[style, styles.maskText]} {...rest}>
                {children}
              </Text>
            </View>
          }
        >
          <View style={[styles.stripeFill, { backgroundColor: textColor }]}>
            <ScanlineStripes gap={gap} />
          </View>
        </MaskedView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  stripesLayer: {
    ...StyleSheet.absoluteFill,
  },
  mask: {
    flex: 1,
  },
  maskContainer: {
    backgroundColor: 'transparent',
  },
  maskText: {
    color: '#000000',
  },
  stripeFill: {
    flex: 1,
  },
});

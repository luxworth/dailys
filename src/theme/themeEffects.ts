import { TextStyle } from 'react-native';
import { Theme } from './themes';

export function crtTextGlow(theme: Theme): TextStyle {
  return theme.glow?.text ?? {};
}

export function crtAccentGlow(theme: Theme): TextStyle {
  return theme.glow?.accent ?? {};
}

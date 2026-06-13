import { TextStyle } from 'react-native';

export type ThemeId =
  | 'typewriter-ritual'
  | 'arcade-ledger'
  | 'field-notes'
  | 'analog-static'
  | 'industrial';

export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  textMuted: string;
  accent: string;
  success: string;
  danger: string;
  warning: string;
  text: string;
  tabInactive: string;
  surfaceElevated: string;
  overlay: string;
  buttonText: string;
}

export interface ThemeFonts {
  display: string;
  sans: string;
  mono: string;
}

export interface ThemeGlow {
  text: TextStyle;
  accent: TextStyle;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  light: boolean;
  glow?: ThemeGlow;
}

const ARCADE_CRT_TEXT_GLOW: TextStyle = {
  textShadowColor: 'rgba(69, 255, 106, 0.55)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 10,
};

const ARCADE_CRT_ACCENT_GLOW: TextStyle = {
  textShadowColor: 'rgba(0, 229, 255, 0.5)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 8,
};

export const THEMES: Record<ThemeId, Theme> = {
  'typewriter-ritual': {
    id: 'typewriter-ritual',
    name: 'Typewriter Ritual',
    description: 'Focus and permanence of typed print.',
    light: true,
    colors: {
      background: '#EAE6DB',
      surface: '#DFD7CA',
      border: '#9B9484',
      textMuted: '#646464',
      accent: '#9A2A2A',
      success: '#5F6B43',
      danger: '#9A2A2A',
      warning: '#9A2A2A',
      text: '#2A2A2A',
      tabInactive: '#646464',
      surfaceElevated: '#DFD7CA',
      overlay: 'rgba(42, 42, 42, 0.08)',
      buttonText: '#EAE6DB',
    },
    fonts: {
      display: 'Lora_600SemiBold',
      sans: 'RobotoMono_400Regular',
      mono: 'RobotoMono_500Medium',
    },
  },
  'arcade-ledger': {
    id: 'arcade-ledger',
    name: 'Arcade Ledger',
    description: 'Structured challenge and status of classic arcade interfaces.',
    light: false,
    colors: {
      background: '#090909',
      surface: '#111111',
      border: '#1A3020',
      textMuted: '#2A4050',
      accent: '#00E5FF',
      success: '#45FF6A',
      danger: '#FA2A2A',
      warning: '#00E5FF',
      text: '#45FF6A',
      tabInactive: '#2A4050',
      surfaceElevated: '#111111',
      overlay: 'rgba(0, 0, 0, 0.35)',
      buttonText: '#090909',
    },
    fonts: {
      display: 'IBMPlexMono_700Bold',
      sans: 'IBMPlexMono_400Regular',
      mono: 'IBMPlexMono_500Medium',
    },
    glow: {
      text: ARCADE_CRT_TEXT_GLOW,
      accent: ARCADE_CRT_ACCENT_GLOW,
    },
  },
  'field-notes': {
    id: 'field-notes',
    name: 'Field Notes',
    description: 'Observation and cataloging, like a personal fieldwork journal.',
    light: true,
    colors: {
      background: '#E3D9C6',
      surface: '#D5C9B3',
      border: '#B5A88E',
      textMuted: '#5A6046',
      accent: '#3E4B31',
      success: '#3E4B31',
      danger: '#8C3A3A',
      warning: '#3E4B31',
      text: '#2F2F2F',
      tabInactive: '#5A6046',
      surfaceElevated: '#D5C9B3',
      overlay: 'rgba(47, 47, 47, 0.06)',
      buttonText: '#E3D9C6',
    },
    fonts: {
      display: 'CrimsonText_600SemiBold',
      sans: 'SpaceMono_400Regular',
      mono: 'SpaceMono_400Regular',
    },
  },
  'analog-static': {
    id: 'analog-static',
    name: 'Analog Static',
    description: 'Intentional signal from the noise, like a shortwave radio.',
    light: false,
    colors: {
      background: '#141414',
      surface: '#1E1E1E',
      border: '#3A3A3A',
      textMuted: '#7E7E7E',
      accent: '#FF5500',
      success: '#4A90E2',
      danger: '#E02020',
      warning: '#FF5500',
      text: '#F0F0F0',
      tabInactive: '#7E7E7E',
      surfaceElevated: '#1E1E1E',
      overlay: 'rgba(0, 0, 0, 0.3)',
      buttonText: '#141414',
    },
    fonts: {
      display: 'ArchivoBlack_400Regular',
      sans: 'Inter_400Regular',
      mono: 'Inter_400Regular',
    },
  },
  industrial: {
    id: 'industrial',
    name: 'Industrial',
    description: 'Utilitarian and sharp, concrete greys with vibrant orange.',
    light: false,
    colors: {
      background: '#050505',
      surface: '#111111',
      border: '#222222',
      textMuted: '#666666',
      accent: '#FF4400',
      success: '#00D364',
      danger: '#FA2A2A',
      warning: '#FBBF24',
      text: '#FAFAFA',
      tabInactive: '#666666',
      surfaceElevated: '#111111',
      overlay: 'rgba(0, 0, 0, 0.3)',
      buttonText: '#050505',
    },
    fonts: {
      display: 'SpaceGrotesk_700Bold',
      sans: 'Inter_400Regular',
      mono: 'JetBrainsMono_500Medium',
    },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export function isThemeId(value: string): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function resolveThemeId(value: string | null): ThemeId {
  if (value && isThemeId(value)) {
    return value;
  }
  return 'industrial';
}

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export interface ScreenLayoutMetrics {
  compact: boolean;
  tight: boolean;
  header: {
    paddingVertical: number;
  };
  countdown: {
    paddingVertical: number;
    timerFontSize: number;
    labelFontSize: number;
    dateFontSize: number;
    labelMarginBottom: number;
    dateMarginTop: number;
  };
  task: {
    paddingTop: number;
    titleFontSize: number;
    titleLineHeight: number;
    badgeMarginBottom: number;
  };
  submission: {
    paddingTop: number;
    submitMarginTop: number;
    textMinHeight: number;
    imageMaxHeight: number;
    numberFontSize: number;
  };
  hero: {
    paddingVertical: number;
    iconSize: number;
    iconMarginBottom: number;
    titleFontSize: number;
    subtitleFontSize: number;
    subtitleLetterSpacing: number;
    streakFontSize: number;
    streakLineHeight: number;
  };
  section: {
    padding: number;
    titleMarginBottom: number;
    headerMarginBottom: number;
  };
  trace: {
    cardPadding: number;
    cardGap: number;
    titleFontSize: number;
    titleLineHeight: number;
    gridGap: number;
    cellFontSize: number;
  };
  settings: {
    themeButtonPadding: number;
    themeListGap: number;
    themeNameSize: number;
    themeDescSize: number;
  };
  tabBar: {
    height: number;
    iconSize: number;
    labelFontSize: number;
  };
}

/** @deprecated Use ScreenLayoutMetrics */
export type DailyLayoutMetrics = ScreenLayoutMetrics;

function buildLayout(height: number): ScreenLayoutMetrics {
  const tight = height < 640;
  const compact = height < 740;

  return {
    compact,
    tight,
    header: {
      paddingVertical: tight ? 12 : compact ? 16 : 20,
    },
    countdown: {
      paddingVertical: tight ? 8 : compact ? 12 : 18,
      timerFontSize: tight ? 30 : compact ? 38 : 44,
      labelFontSize: tight ? 9 : 10,
      dateFontSize: tight ? 10 : 11,
      labelMarginBottom: tight ? 4 : compact ? 6 : 8,
      dateMarginTop: tight ? 6 : compact ? 8 : 12,
    },
    task: {
      paddingTop: tight ? 10 : compact ? 14 : 18,
      titleFontSize: tight ? 26 : compact ? 30 : 34,
      titleLineHeight: tight ? 30 : compact ? 34 : 38,
      badgeMarginBottom: tight ? 10 : compact ? 14 : 18,
    },
    submission: {
      paddingTop: tight ? 8 : compact ? 12 : 16,
      submitMarginTop: tight ? 14 : compact ? 20 : 24,
      textMinHeight: tight ? 72 : compact ? 96 : 112,
      imageMaxHeight: tight ? 120 : compact ? 150 : 180,
      numberFontSize: tight ? 44 : compact ? 50 : 56,
    },
    hero: {
      paddingVertical: tight ? 20 : compact ? 28 : 36,
      iconSize: tight ? 32 : compact ? 40 : 44,
      iconMarginBottom: tight ? 10 : compact ? 12 : 14,
      titleFontSize: tight ? 28 : compact ? 32 : 36,
      subtitleFontSize: tight ? 11 : compact ? 12 : 14,
      subtitleLetterSpacing: tight ? 2 : 3,
      streakFontSize: tight ? 52 : compact ? 64 : 72,
      streakLineHeight: tight ? 52 : compact ? 64 : 72,
    },
    section: {
      padding: tight ? 16 : compact ? 20 : 24,
      titleMarginBottom: tight ? 14 : compact ? 18 : 22,
      headerMarginBottom: tight ? 14 : compact ? 18 : 22,
    },
    trace: {
      cardPadding: tight ? 12 : compact ? 14 : 16,
      cardGap: tight ? 10 : compact ? 12 : 16,
      titleFontSize: tight ? 13 : 14,
      titleLineHeight: tight ? 18 : 22,
      gridGap: tight ? 5 : compact ? 6 : 8,
      cellFontSize: tight ? 9 : 10,
    },
    settings: {
      themeButtonPadding: tight ? 12 : compact ? 14 : 16,
      themeListGap: tight ? 8 : compact ? 10 : 12,
      themeNameSize: tight ? 12 : 14,
      themeDescSize: tight ? 11 : 12,
    },
    tabBar: {
      height: tight ? 58 : compact ? 62 : 64,
      iconSize: tight ? 18 : 20,
      labelFontSize: tight ? 7 : 8,
    },
  };
}

export function useScreenLayout(): ScreenLayoutMetrics {
  const { height } = useWindowDimensions();
  return useMemo(() => buildLayout(height), [height]);
}

/** @deprecated Use useScreenLayout */
export function useDailyLayout(): ScreenLayoutMetrics {
  return useScreenLayout();
}

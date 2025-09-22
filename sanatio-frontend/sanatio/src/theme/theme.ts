import { Platform } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, configureFonts, MD3Theme } from 'react-native-paper';

// Design tokens
export const Colors = {
  primary: '#1E7FEF', // bleu médical vibrant
  primarySoft: '#E7F1FF',
  success: '#22C55E', // vert médical doux
  successSoft: '#E7F9EE',
  white: '#FFFFFF',
  text: '#1F2933',
  textMuted: '#60708A',
  background: '#F3F7FF',
  outline: '#C7D6ED',
  warning: '#F59E0B',
  error: '#EF4444',
  errorSoft: '#FDEDED',
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
} as const;

export const Spacing = {
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
} as const;

export const Shadows = {
  xs: { elevation: 0.5, shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  sm: { elevation: 1, shadowColor: '#000000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  md: { elevation: 3, shadowColor: '#000000', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  lg: { elevation: 6, shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 16 } },
} as const;

// Typography – proche SF/Inter
export const PlatformFonts = {
  regular: Platform.select({ ios: 'System', default: 'sans-serif' }),
  medium: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  semiBold: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
};

const fontConfig = {
  displaySmall: { fontFamily: PlatformFonts.semiBold, fontSize: 34, lineHeight: 40, fontWeight: '600' },
  headlineMedium: { fontFamily: PlatformFonts.semiBold, fontSize: 26, lineHeight: 32, fontWeight: '600' },
  titleMedium: { fontFamily: PlatformFonts.medium, fontSize: 18, lineHeight: 24, fontWeight: '500' },
  bodyLarge: { fontFamily: PlatformFonts.regular, fontSize: 18, lineHeight: 26 },
  bodyMedium: { fontFamily: PlatformFonts.regular, fontSize: 16, lineHeight: 22 },
  labelLarge: { fontFamily: PlatformFonts.medium, fontSize: 16, lineHeight: 20, fontWeight: '500' },
  labelSmall: { fontFamily: PlatformFonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
} as const;

export function createAppTheme(dark = false): MD3Theme {
  const base = dark ? MD3DarkTheme : MD3LightTheme;
  const baseFonts = configureFonts({
    config: {
      default: fontConfig,
    } as any,
  });

  const colors = dark
    ? {
        ...base.colors,
        primary: '#6CAEFF',
        secondary: Colors.success,
        background: '#0F172A',
        surface: '#111B2E',
        onSurface: '#E6EAF1',
        outline: '#334155',
        error: Colors.error,
      }
    : {
        ...base.colors,
        primary: Colors.primary,
        secondary: Colors.success,
        background: Colors.background,
        surface: Colors.white,
        onSurface: Colors.text,
        outline: Colors.outline,
        error: Colors.error,
      };

  return {
    ...base,
    colors,
    fonts: baseFonts,
    roundness: Radius.md,
  };
}

export type Tokens = typeof Colors & typeof Radius & typeof Spacing & typeof Shadows;
export const tokens = { ...Colors, ...Radius, ...Spacing, ...Shadows };

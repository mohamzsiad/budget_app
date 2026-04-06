import { COLORS } from './colors';

/**
 * Returns the full theme object for a given mode.
 * @param {'light' | 'dark'} mode
 */
export function getTheme(mode = 'light') {
  const isDark = mode === 'dark';
  const base = isDark ? COLORS.dark : COLORS.light;

  return {
    isDark,
    colors: {
      ...base,
      primary:      COLORS.primary,
      primaryLight: COLORS.primaryLight,
      primaryDark:  COLORS.primaryDark,
      success:      COLORS.success,
      warning:      COLORS.warning,
      danger:       COLORS.danger,
      info:         COLORS.info,
    },
    spacing: {
      xs:  4,
      sm:  8,
      md:  16,
      lg:  24,
      xl:  32,
      xxl: 48,
    },
    radius: {
      sm:   8,
      md:   12,
      lg:   16,
      xl:   20,
      full: 9999,
    },
    typography: {
      // Font sizes
      xs:   11,
      sm:   13,
      base: 15,
      md:   17,
      lg:   20,
      xl:   24,
      xxl:  32,
      hero: 40,
      // Font weights (as strings for RN)
      regular:   '400',
      medium:    '500',
      semibold:  '600',
      bold:      '700',
      extrabold: '800',
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
      },
      primary: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  };
}

export const lightTheme = getTheme('light');
export const darkTheme  = getTheme('dark');

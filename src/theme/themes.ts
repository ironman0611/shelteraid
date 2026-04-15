export type ThemeId = 'system' | 'light' | 'dark' | 'forest';

export type Theme = {
  id: Exclude<ThemeId, 'system'>;
  isDark: boolean;
  colors: {
    primary: string;
    primarySoft: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderLight: string;
    shadow: string;

    statusOpen: string;
    statusLimited: string;
    statusClosed: string;

    tagEmergency: { bg: string; text: string };
    tagTransitional: { bg: string; text: string };
    tagFood: { bg: string; text: string };
    tagMedical: { bg: string; text: string };
  };
  spacing: {
    screen: number;
    card: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
  typography: {
    body: number;
    small: number;
    xsmall: number;
    h2: number;
    h3: number;
  };
};

export const themes: Record<Theme['id'], Theme> = {
  light: {
    id: 'light',
    isDark: false,
    colors: {
      primary: '#2d6a4f',
      primarySoft: '#eaf5f0',
      background: '#f7f8fa',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      text: '#111827',
      textSecondary: '#475467',
      textTertiary: '#667085',
      border: '#e5e7eb',
      borderLight: '#f2f4f7',
      shadow: '#000000',

      statusOpen: '#067647',
      statusLimited: '#b54708',
      statusClosed: '#b42318',

      tagEmergency: { bg: '#fef3f2', text: '#b42318' },
      tagTransitional: { bg: '#eff8ff', text: '#175cd3' },
      tagFood: { bg: '#fef7ec', text: '#b54708' },
      tagMedical: { bg: '#f4f3ff', text: '#5925dc' },
    },
    spacing: { screen: 16, card: 14, xs: 6, sm: 10, md: 14, lg: 20 },
    radius: { sm: 10, md: 14, lg: 18, pill: 999 },
    typography: { body: 15, small: 13, xsmall: 12, h2: 20, h3: 16 },
  },
  dark: {
    id: 'dark',
    isDark: true,
    colors: {
      primary: '#4ad39a',
      primarySoft: '#0b2a1f',
      background: '#0b0f14',
      surface: '#101826',
      surfaceElevated: '#121c2c',
      text: '#e5e7eb',
      textSecondary: '#b4b8c0',
      textTertiary: '#8b93a1',
      border: '#1f2a37',
      borderLight: '#17202b',
      shadow: '#000000',

      statusOpen: '#34d399',
      statusLimited: '#f59e0b',
      statusClosed: '#fb7185',

      tagEmergency: { bg: '#3b0a0a', text: '#fecaca' },
      tagTransitional: { bg: '#0b1f3a', text: '#bfdbfe' },
      tagFood: { bg: '#2a1605', text: '#fed7aa' },
      tagMedical: { bg: '#1c1240', text: '#ddd6fe' },
    },
    spacing: { screen: 16, card: 14, xs: 6, sm: 10, md: 14, lg: 20 },
    radius: { sm: 10, md: 14, lg: 18, pill: 999 },
    typography: { body: 15, small: 13, xsmall: 12, h2: 20, h3: 16 },
  },
  forest: {
    id: 'forest',
    isDark: false,
    colors: {
      primary: '#1f7a5f',
      primarySoft: '#e5f4ef',
      background: '#f4faf8',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      text: '#0f172a',
      textSecondary: '#334155',
      textTertiary: '#475569',
      border: '#dde7e3',
      borderLight: '#edf3f1',
      shadow: '#000000',

      statusOpen: '#0f766e',
      statusLimited: '#a16207',
      statusClosed: '#be123c',

      tagEmergency: { bg: '#fff1f2', text: '#9f1239' },
      tagTransitional: { bg: '#ecfeff', text: '#155e75' },
      tagFood: { bg: '#fffbeb', text: '#92400e' },
      tagMedical: { bg: '#eef2ff', text: '#3730a3' },
    },
    spacing: { screen: 16, card: 14, xs: 6, sm: 10, md: 14, lg: 20 },
    radius: { sm: 10, md: 14, lg: 18, pill: 999 },
    typography: { body: 15, small: 13, xsmall: 12, h2: 20, h3: 16 },
  },
};


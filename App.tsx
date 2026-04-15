import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useThemeContext } from './src/theme/ThemeProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { theme } = useThemeContext();

  const fonts = {
    regular: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: '800' as const,
    },
  };

  const paperBaseTheme = theme.isDark ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = {
    ...paperBaseTheme,
    colors: {
      ...paperBaseTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      surface: theme.colors.surface,
      surfaceVariant: theme.colors.surfaceElevated,
      onSurface: theme.colors.text,
      onSurfaceVariant: theme.colors.textSecondary,
      outline: theme.colors.border,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer
        theme={{
          ...DefaultTheme,
          dark: theme.isDark,
          fonts,
          colors: {
            ...DefaultTheme.colors,
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.surfaceElevated,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.primary,
          },
        }}
      >
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

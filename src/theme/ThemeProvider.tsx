import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeId, themes } from './themes';

const STORAGE_KEY = 'shelteraid.theme';

type ThemeContextValue = {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(themeId: ThemeId, system: 'light' | 'dark' | null | undefined): Theme {
  if (themeId === 'system') {
    return system === 'dark' ? themes.dark : themes.light;
  }
  return themes[themeId];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<ThemeId>('system');
  const theme = useMemo(
    () => resolveTheme(themeId, systemScheme),
    [themeId, systemScheme],
  );

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!mounted || !value) return;
        if (value === 'system' || value === 'light' || value === 'dark' || value === 'forest') {
          setThemeIdState(value);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  const value = useMemo(() => ({ theme, themeId, setThemeId }), [theme, themeId, setThemeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}


import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getColors,
  type ColorPalette,
  type ThemeMode,
} from '../theme/colors';

const THEME_KEY = '@workout/theme_mode';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ColorPalette;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleLightMode: (enabled: boolean) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  }, []);

  const toggleLightMode = useCallback(
    (enabled: boolean) => {
      void setMode(enabled ? 'light' : 'dark');
    },
    [setMode],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: getColors(mode),
      isDark: mode === 'dark',
      setMode,
      toggleLightMode,
      ready,
    }),
    [mode, setMode, toggleLightMode, ready],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
  // Base
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceElevated: string;

  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentDark: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;

  // UI Elements
  border: string;
  borderLight: string;

  // States
  success: string;
  error: string;
  warning: string;
  overlay: string;
  transparent: string;

  // Gradient
  gradientStart: string;
  gradientEnd: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const THEME_STORAGE_KEY = "@app_theme_mode";

export const darkColors: ThemeColors = {
  background: "#090A10",
  surface: "#121322",
  surfaceLight: "#1A1C30",
  surfaceElevated: "#242745",
  primary: "#A78BFA",
  primaryDark: "#8B5CF6",
  primaryLight: "#C4B5FD",
  accent: "#38BDF8",
  accentDark: "#0284C7",
  text: "#FFFFFF",
  textSecondary: "#E2E8F0",
  textMuted: "#94A3B8",
  border: "#2E335A",
  borderLight: "#3B4276",
  success: "#34D399",
  error: "#F87171",
  warning: "#FBBF24",
  overlay: "rgba(9,10,16,0.85)",
  transparent: "transparent",
  gradientStart: "#8B5CF6",
  gradientEnd: "#06B6D4",
};

export const lightColors: ThemeColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceLight: "#F1F5F9",
  surfaceElevated: "#E2E8F0",
  primary: "#6D28D9",
  primaryDark: "#4C1D95",
  primaryLight: "#8B5CF6",
  accent: "#0284C7",
  accentDark: "#0369A1",
  text: "#0F172A",
  textSecondary: "#334155",
  textMuted: "#64748B",
  border: "#CBD5E1",
  borderLight: "#E2E8F0",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  overlay: "rgba(15,23,42,0.5)",
  transparent: "transparent",
  gradientStart: "#6D28D9",
  gradientEnd: "#0284C7",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored && ["light", "dark", "system"].includes(stored)) {
        setThemeModeState(stored as ThemeMode);
      }
      setIsLoaded(true);
    });
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === "system") {
      return systemColorScheme === "dark";
    }
    return themeMode === "dark";
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const value = useMemo(
    () => ({
      colors,
      themeMode,
      isDark,
      setThemeMode,
    }),
    [colors, themeMode, isDark, setThemeMode]
  );

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

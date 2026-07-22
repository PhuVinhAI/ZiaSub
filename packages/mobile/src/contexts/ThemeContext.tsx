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
  // Base surfaces (ascending elevation)
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceElevated: string;

  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;
  /** Soft translucent-looking primary tint for active/selected backgrounds. */
  primarySoft: string;
  accent: string;
  accentDark: string;
  /** Soft accent tint background. */
  accentSoft: string;

  // Text (all AA against `background`/`surface`)
  text: string;
  textSecondary: string;
  textMuted: string;

  // On-color text/icon colors (AA against their respective fills)
  onPrimary: string;
  onAccent: string;
  onSuccess: string;
  onError: string;
  onWarning: string;

  // UI elements
  border: string;
  borderLight: string;
  inputBackground: string;

  // Disabled state
  disabled: string;
  disabledText: string;

  // Semantic states — solid (text/border/icon) + soft (tinted background)
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  warning: string;
  warningBg: string;

  // Overlays
  /** Modal/dialog backdrop. */
  overlay: string;
  /** Media/thumbnail dimming (always dark regardless of theme). */
  scrim: string;
  /** Shadow color for elevation. */
  shadow: string;
  transparent: string;

  // Subtitle preview — simulates on-video overlay, intentionally dark in both modes.
  previewBg: string;
  previewText: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const THEME_STORAGE_KEY = "@app_theme_mode";

export const darkColors: ThemeColors = {
  // Surfaces
  background: "#0A0B12",
  surface: "#14162A",
  surfaceLight: "#1E2138",
  surfaceElevated: "#2A2E4A",

  // Brand (purple + cyan)
  primary: "#A78BFA",
  primaryDark: "#8B5CF6",
  primaryLight: "#C4B5FD",
  primarySoft: "#241F45",
  accent: "#38BDF8",
  accentDark: "#0EA5E9",
  accentSoft: "#0E2A3E",

  // Text — AA on background/surface
  text: "#F5F7FF",
  textSecondary: "#C7CEE6",
  textMuted: "#8B93B8",

  // On-color (dark text on light brand fills for AA)
  onPrimary: "#12081F",
  onAccent: "#04212F",
  onSuccess: "#052E1B",
  onError: "#3B0A0A",
  onWarning: "#2E1E00",

  // UI elements
  border: "#333863",
  borderLight: "#454B7E",
  inputBackground: "#1A1D33",

  // Disabled
  disabled: "#252842",
  disabledText: "#6E76A0",

  // Semantic states
  success: "#4ADE80",
  successBg: "#0E2E1E",
  error: "#F87171",
  errorBg: "#3A1516",
  warning: "#FBBF24",
  warningBg: "#3A2C08",

  // Overlays
  overlay: "rgba(6,7,14,0.82)",
  scrim: "rgba(0,0,0,0.65)",
  shadow: "#000000",
  transparent: "transparent",

  // Subtitle preview (always-dark video overlay)
  previewBg: "#14152A",
  previewText: "#FFFFFF",
};

export const lightColors: ThemeColors = {
  // Surfaces
  background: "#F6F7FB",
  surface: "#FFFFFF",
  surfaceLight: "#EEF1F7",
  surfaceElevated: "#E2E7F0",

  // Brand (deepened purple + cyan for AA on light)
  primary: "#6D28D9",
  primaryDark: "#5B21B6",
  primaryLight: "#7C3AED",
  primarySoft: "#EDE7FE",
  accent: "#0369A1",
  accentDark: "#075985",
  accentSoft: "#DBEEFB",

  // Text — AA on background/surface
  text: "#0D1220",
  textSecondary: "#3A4256",
  textMuted: "#5B6478",

  // On-color (white on saturated fills; dark on warning for AA)
  onPrimary: "#FFFFFF",
  onAccent: "#FFFFFF",
  onSuccess: "#FFFFFF",
  onError: "#FFFFFF",
  onWarning: "#FFFFFF",

  // UI elements
  border: "#C3CBD9",
  borderLight: "#D9DFEA",
  inputBackground: "#FFFFFF",

  // Disabled
  disabled: "#E5E9F0",
  disabledText: "#767E90",

  // Semantic states
  success: "#047857",
  successBg: "#DCFCE7",
  error: "#B91C1C",
  errorBg: "#FEE2E2",
  warning: "#B45309",
  warningBg: "#FEF3C7",

  // Overlays
  overlay: "rgba(15,23,42,0.45)",
  scrim: "rgba(0,0,0,0.6)",
  shadow: "#1E293B",
  transparent: "transparent",

  // Subtitle preview (always-dark video overlay)
  previewBg: "#14152A",
  previewText: "#FFFFFF",
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

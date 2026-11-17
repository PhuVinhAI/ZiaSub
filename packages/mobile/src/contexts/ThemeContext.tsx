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

// Layer 1: raw palette. Components must consume semantic tokens below.
const palette = {
  violet: {
    50: "#F7F5FC",
    100: "#EDE5FF",
    200: "#DDD1FD",
    300: "#C4B5FD",
    500: "#A78BFA",
    600: "#8B5CF6",
    700: "#7C3AED",
    800: "#6D28D9",
    900: "#5B21B6",
    950: "#2A1F45",
    ink: "#12081F",
  },
  cyan: {
    50: "#DBEEFB",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0369A1",
    700: "#075985",
    900: "#0D2A3A",
    ink: "#04212F",
  },
  lightNeutral: {
    background: "#F7F5FC",
    surface: "#FFFFFF",
    surfaceAlt: "#F0ECF8",
    surfaceElevated: "#E5DFF2",
    border: "#D7D0E4",
    borderSubtle: "#E7E2F0",
    text: "#17131F",
    textSecondary: "#4A4258",
    textMuted: "#6B6378",
    disabled: "#E5E9F0",
    disabledText: "#767E90",
    input: "#FFFFFF",
    shadow: "#2A1F45",
  },
  darkNeutral: {
    background: "#0B0912",
    surface: "#151020",
    surfaceAlt: "#1D1730",
    surfaceElevated: "#28203D",
    border: "#3B3252",
    borderSubtle: "#4E4268",
    text: "#F7F3FF",
    textSecondary: "#CFC6E4",
    textMuted: "#9C91B4",
    disabled: "#252842",
    disabledText: "#6E76A0",
    input: "#191327",
    shadow: "#000000",
  },
  green: {
    light: "#047857",
    lightSoft: "#DCFCE7",
    dark: "#4ADE80",
    darkSoft: "#0E2E1E",
    darkInk: "#052E1B",
  },
  red: {
    light: "#B91C1C",
    lightSoft: "#FEE2E2",
    dark: "#F87171",
    darkSoft: "#3A1516",
    darkInk: "#3B0A0A",
  },
  amber: {
    light: "#A94E08",
    lightSoft: "#FEF3C7",
    dark: "#FBBF24",
    darkSoft: "#3A2C08",
    darkInk: "#2E1E00",
  },
} as const;

// Layer 2: semantic tokens. Themes override this layer only.
export const darkColors: ThemeColors = {
  // Surfaces
  background: palette.darkNeutral.background,
  surface: palette.darkNeutral.surface,
  surfaceLight: palette.darkNeutral.surfaceAlt,
  surfaceElevated: palette.darkNeutral.surfaceElevated,

  // Brand (violet + cyan)
  primary: palette.violet[500],
  primaryDark: palette.violet[600],
  primaryLight: palette.violet[300],
  primarySoft: palette.violet[950],
  accent: palette.cyan[400],
  accentDark: palette.cyan[500],
  accentSoft: palette.cyan[900],

  // Text — AA on background/surface
  text: palette.darkNeutral.text,
  textSecondary: palette.darkNeutral.textSecondary,
  textMuted: palette.darkNeutral.textMuted,

  // On-color (dark text on light brand fills for AA)
  onPrimary: palette.violet.ink,
  onAccent: palette.cyan.ink,
  onSuccess: palette.green.darkInk,
  onError: palette.red.darkInk,
  onWarning: palette.amber.darkInk,

  // UI elements
  border: palette.darkNeutral.border,
  borderLight: palette.darkNeutral.borderSubtle,
  inputBackground: palette.darkNeutral.input,

  // Disabled
  disabled: palette.darkNeutral.disabled,
  disabledText: palette.darkNeutral.disabledText,

  // Semantic states
  success: palette.green.dark,
  successBg: palette.green.darkSoft,
  error: palette.red.dark,
  errorBg: palette.red.darkSoft,
  warning: palette.amber.dark,
  warningBg: palette.amber.darkSoft,

  // Overlays
  overlay: "rgba(6,4,10,0.82)",
  scrim: "rgba(0,0,0,0.65)",
  shadow: palette.darkNeutral.shadow,
  transparent: "transparent",

  // Subtitle preview (always-dark video overlay)
  previewBg: "#141026",
  previewText: "#FFFFFF",
};

export const lightColors: ThemeColors = {
  // Surfaces
  background: palette.lightNeutral.background,
  surface: palette.lightNeutral.surface,
  surfaceLight: palette.lightNeutral.surfaceAlt,
  surfaceElevated: palette.lightNeutral.surfaceElevated,

  // Brand (deep violet + cyan for AA on light)
  primary: palette.violet[800],
  primaryDark: palette.violet[900],
  primaryLight: palette.violet[700],
  primarySoft: palette.violet[100],
  accent: palette.cyan[600],
  accentDark: palette.cyan[700],
  accentSoft: palette.cyan[50],

  // Text — AA on background/surface
  text: palette.lightNeutral.text,
  textSecondary: palette.lightNeutral.textSecondary,
  textMuted: palette.lightNeutral.textMuted,

  // On-color (white on saturated fills; dark on warning for AA)
  onPrimary: "#FFFFFF",
  onAccent: "#FFFFFF",
  onSuccess: "#FFFFFF",
  onError: "#FFFFFF",
  onWarning: "#FFFFFF",

  // UI elements
  border: palette.lightNeutral.border,
  borderLight: palette.lightNeutral.borderSubtle,
  inputBackground: palette.lightNeutral.input,

  // Disabled
  disabled: palette.lightNeutral.disabled,
  disabledText: palette.lightNeutral.disabledText,

  // Semantic states
  success: palette.green.light,
  successBg: palette.green.lightSoft,
  error: palette.red.light,
  errorBg: palette.red.lightSoft,
  warning: palette.amber.light,
  warningBg: palette.amber.lightSoft,

  // Overlays
  overlay: "rgba(23,19,31,0.45)",
  scrim: "rgba(0,0,0,0.6)",
  shadow: palette.lightNeutral.shadow,
  transparent: "transparent",

  // Subtitle preview (always-dark video overlay)
  previewBg: "#141026",
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

import { useMemo } from "react";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";
import { useTheme, ThemeColors } from "@src/contexts";

type StyleFactory<T> = (colors: ThemeColors, isDark: boolean) => T;

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useThemedStyles<T extends NamedStyles<T>>(
  styleFactory: StyleFactory<T>
): T {
  const { colors, isDark } = useTheme();
  return useMemo(
    () => styleFactory(colors, isDark),
    [colors, isDark, styleFactory]
  );
}

export function createThemedStyles<T extends NamedStyles<T>>(
  styleFactory: StyleFactory<T>
): StyleFactory<T> {
  return styleFactory;
}

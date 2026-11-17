import {
  DEFAULT_SUBTITLE_SETTINGS,
  type SubtitleSettings,
} from "@ziasub/shared";

export type ThemeMode = "system" | "light" | "dark";
export type Language = "vi" | "en";

export interface ExtensionSettings {
  subtitle: SubtitleSettings;
  themeMode: ThemeMode;
  language: Language;
}

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  subtitle: { ...DEFAULT_SUBTITLE_SETTINGS },
  themeMode: "system",
  language: "vi",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "system" || value === "light" || value === "dark";

const isLanguage = (value: unknown): value is Language =>
  value === "vi" || value === "en";

export function normalizeExtensionSettings(raw: unknown): ExtensionSettings {
  const source = isRecord(raw) ? raw : {};
  const subtitleSource = isRecord(source.subtitle) ? source.subtitle : {};
  const overlaySource = isRecord(source.overlay) ? source.overlay : {};
  const subtitle: SubtitleSettings = { ...DEFAULT_SUBTITLE_SETTINGS };

  for (const key of Object.keys(
    DEFAULT_SUBTITLE_SETTINGS,
  ) as (keyof SubtitleSettings)[]) {
    if (subtitleSource[key] !== undefined) {
      (subtitle as unknown as Record<string, unknown>)[key] =
        subtitleSource[key];
    }
  }

  // Migrate the first extension settings shape.
  if (
    subtitleSource.portraitBottom === undefined &&
    typeof subtitleSource.bottomOffset === "number"
  ) {
    subtitle.portraitBottom = subtitleSource.bottomOffset;
  }
  if (
    subtitleSource.landscapeBottom === undefined &&
    typeof subtitleSource.bottomOffset === "number"
  ) {
    subtitle.landscapeBottom = subtitleSource.bottomOffset;
  }
  if (
    subtitleSource.backgroundOpacity === undefined &&
    typeof overlaySource.bgOpacity === "number"
  ) {
    subtitle.backgroundOpacity = overlaySource.bgOpacity;
  }
  if (
    subtitleSource.shadowEnabled === undefined &&
    typeof overlaySource.textShadow === "boolean"
  ) {
    subtitle.shadowEnabled = overlaySource.textShadow;
  }

  return {
    subtitle,
    themeMode: isThemeMode(source.themeMode) ? source.themeMode : "system",
    language: isLanguage(source.language) ? source.language : "vi",
  };
}

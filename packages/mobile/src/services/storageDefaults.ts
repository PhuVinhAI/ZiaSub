/**
 * Storage Defaults & Config Migration
 *
 * Tách từ storageService.ts — chỉ di chuyển code, không sửa đổi logic.
 */
import type { AppSettings, GeminiConfig } from "@src/types";
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_CHAT_SYSTEM_PROMPT,
  DEFAULT_CHAT_CONFIG_ID,
  DEFAULT_PRESUB_CONFIG_ID,
  DEFAULT_SYSTEM_PROMPT,
} from "@constants/defaults";

export function mergeWithDefaults(
  settings: Partial<AppSettings>
): AppSettings {
  return {
    subtitle: { ...DEFAULT_APP_SETTINGS.subtitle, ...settings.subtitle },
    batch: { ...DEFAULT_APP_SETTINGS.batch, ...settings.batch },
    apiKeys: { ...DEFAULT_APP_SETTINGS.apiKeys, ...settings.apiKeys },
    floatingUI: {
      ...DEFAULT_APP_SETTINGS.floatingUI,
      ...settings.floatingUI,
    },
    notification: {
      ...DEFAULT_APP_SETTINGS.notification,
      ...settings.notification,
    },
    debug: {
      ...DEFAULT_APP_SETTINGS.debug,
      ...settings.debug,
    },
  };
}

/**
 * Compute the config list with default chat/translation configs ensured and
 * outdated models migrated. Pure: returns the (possibly new) config array and
 * whether a save is required. The caller is responsible for persisting.
 */
export function computeEnsuredConfigs(
  existing: GeminiConfig[] | null
): { configs: GeminiConfig[]; needsSave: boolean } {
  let needsSave = false;
  let configs = existing || [];

  // Ensure default chat config
  const chatConfig = configs.find((c) => c.id === DEFAULT_CHAT_CONFIG_ID);
  if (!chatConfig) {
    configs = [
      {
        id: DEFAULT_CHAT_CONFIG_ID,
        name: "Chat",
        model: "models/gemini-flash-lite-latest",
        temperature: 1.0,
        systemPrompt: DEFAULT_CHAT_SYSTEM_PROMPT,
        mediaResolution: "MEDIA_RESOLUTION_HIGH",
        thinkingLevel: "HIGH",
      },
      ...configs,
    ];
    needsSave = true;
  }

  // Ensure at least one translation config
  if (
    !configs.some(
      (c) =>
        c.id !== DEFAULT_CHAT_CONFIG_ID && c.id !== DEFAULT_PRESUB_CONFIG_ID
    )
  ) {
    configs.push({
      id: Date.now().toString(),
      name: "Mặc định",
      model: "models/gemini-flash-latest",
      temperature: 0.7,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      mediaResolution: "MEDIA_RESOLUTION_HIGH",
      thinkingLevel: "HIGH",
    });
    needsSave = true;
  }

  // Migrate model IDs that are no longer available in the editor.
  for (const c of configs) {
    if (c.model === "models/gemini-2.5-pro") {
      c.model = "models/gemini-flash-latest";
      needsSave = true;
    }
  }

  return { configs, needsSave };
}

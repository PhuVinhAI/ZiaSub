import {
  DEFAULT_EXTENSION_SETTINGS,
  normalizeExtensionSettings,
  type ExtensionSettings,
} from "../types/settings";

const SETTINGS_KEY = "settings";

export async function loadExtensionSettings(): Promise<ExtensionSettings> {
  try {
    const result = await chrome.storage.sync.get(SETTINGS_KEY);
    return normalizeExtensionSettings(result[SETTINGS_KEY]);
  } catch {
    return {
      ...DEFAULT_EXTENSION_SETTINGS,
      subtitle: { ...DEFAULT_EXTENSION_SETTINGS.subtitle },
    };
  }
}

export async function saveExtensionSettings(
  settings: ExtensionSettings,
): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}

export async function notifyActiveYouTubeTab(
  settings: ExtensionSettings,
): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes("youtube.com")) return;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "SETTINGS_UPDATED",
      settings,
    });
  } catch {
    // Content script may not be ready yet; storage change still applies.
  }
}

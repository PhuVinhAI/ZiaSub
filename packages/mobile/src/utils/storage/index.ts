/**
 * Storage module - Re-exports all storage functions
 */

// Storage Service (primary)
export { storageService, STORAGE_KEYS } from "@services/storageService";

// Backup Service
export { backupService } from "@services/backupService";

// Settings
export {
  saveAppSettings,
  getAppSettings,
  saveSubtitleSettings,
  getSubtitleSettings,
  saveBatchSettings,
  getBatchSettings,
  saveApiKeys,
  getApiKeys,
  saveTTSSettings,
  getTTSSettings,
  saveFloatingUISettings,
  getFloatingUISettings,
  saveNotificationSettings,
  getNotificationSettings,
  setOnboardingCompleted,
  getOnboardingCompleted,
  clearSettingsCache,
} from "./settingsStorage";

// SRT
export { saveSRT, getSRT, removeSRT } from "./srtStorage";

// Translations
export {
  saveTranslation,
  savePartialTranslation,
  getPartialTranslation,
  getVideoTranslations,
  setActiveTranslation,
  deleteTranslation,
  getAllTranslatedVideoUrls,
  getFullyTranslatedVideoUrls,
  getPartialOnlyVideoUrls,
  hasTranslation,
  getActiveTranslation,
} from "./translationStorage";

// Gemini
export {
  createDefaultGeminiConfig,
  createDefaultChatConfig,
  createDefaultPresubConfig,
  DEFAULT_PRESUB_CONFIG_ID,
  saveGeminiConfigs,
  getGeminiConfigs,
  // Translation config
  saveActiveTranslationConfigId,
  getActiveTranslationConfigId,
  getActiveTranslationConfig,
  // Chat config
  saveActiveChatConfigId,
  getActiveChatConfigId,
  getActiveChatConfig,
  // Legacy aliases
  saveActiveGeminiConfigId,
  getActiveGeminiConfigId,
  getActiveGeminiConfig,
} from "./geminiStorage";

import { setLastCopiedVideoUrl, setLastHandledSrt, getLastHandledSrt } from "@ziasub/shared";
import {
  clearLastCopiedVideoUrlFromStorage,
  saveLastHandledSrtToStorage,
  getLastHandledSrtFromStorage,
  clearLastHandledSrtFromStorage,
} from "./systemInstructionStorage";

// Last Copied Video URL & Handled SRT Storage
export {
  saveLastCopiedVideoUrlToStorage,
  getLastCopiedVideoUrlFromStorage,
  clearLastCopiedVideoUrlFromStorage,
  LAST_COPIED_VIDEO_URL_KEY,
  saveLastHandledSrtToStorage,
  getLastHandledSrtFromStorage,
  clearLastHandledSrtFromStorage,
  LAST_HANDLED_SRT_KEY,
} from "./systemInstructionStorage";

export { setLastHandledSrt, getLastHandledSrt };

export const clearLastCopiedVideoUrl = async (): Promise<void> => {
  setLastCopiedVideoUrl("");
  await clearLastCopiedVideoUrlFromStorage();
};

export const setHandledSrt = async (srt: string): Promise<void> => {
  setLastHandledSrt(srt);
  await saveLastHandledSrtToStorage(srt);
};

export const clearHandledSrt = async (): Promise<void> => {
  setLastHandledSrt("");
  await clearLastHandledSrtFromStorage();
};


// Chat
export {
  getChatSessions,
  saveChatSessions,
  createChatSession,
  updateChatSession,
  deleteChatSession,
  getActiveChatSessionId,
  setActiveChatSessionId,
  getActiveChatSession,
  saveChatHistory,
  getChatHistory,
  clearChatHistory,
} from "./chatStorage";

// Re-export types from types module
export type {
  SubtitleSettings,
  BatchSettings,
  TTSSettings,
  ApiKeysSettings,
  AppSettings,
  SavedTranslation,
  VideoTranslations,
  GeminiConfig,
  ChatSession,
  ChatHistory,
  StoredChatMessage,
  FloatingUISettings,
  NotificationSettings,
} from "@src/types";

// Re-export defaults
export {
  DEFAULT_SUBTITLE_SETTINGS,
  DEFAULT_BATCH_SETTINGS,
  DEFAULT_TTS_SETTINGS,
  DEFAULT_API_KEYS_SETTINGS,
  DEFAULT_APP_SETTINGS,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_CHAT_CONFIG_ID,
  DEFAULT_FLOATING_UI_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "@constants/defaults";

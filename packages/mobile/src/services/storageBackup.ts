/**
 * Storage Bulk Operations (backup / restore / clear)
 *
 * Tách từ storageService.ts — chỉ di chuyển code, không sửa đổi logic.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AppSettings,
  GeminiConfig,
  ChatSession,
  VideoTranslations,
} from "@src/types";
import { DEFAULT_APP_SETTINGS } from "@constants/defaults";
import { KEYS } from "./storageKeys";
import { mergeWithDefaults } from "./storageDefaults";

export interface StorageCache {
  settings: AppSettings | null;
  geminiConfigs: GeminiConfig[] | null;
  chatSessions: ChatSession[] | null;
  translationIndex: Set<string>;
}

/**
 * Context passed by StorageService so bulk ops can reuse the instance's cache
 * and per-domain methods (including private helpers) without duplicating them.
 */
export interface BackupContext {
  getCache(): StorageCache;
  setCache(cache: StorageCache): void;
  getSettings(): AppSettings;
  getGeminiConfigs(): GeminiConfig[];
  getChatSessions(): ChatSession[];
  getTranslation(videoId: string): Promise<VideoTranslations | null>;
  getSrt(videoId: string): Promise<string | null>;
  setSrt(videoId: string, content: string): Promise<void>;
  getActiveTranslationConfigId(): Promise<string | null>;
  setActiveTranslationConfigId(id: string): Promise<void>;
  getActiveChatConfigId(): Promise<string | null>;
  setActiveChatConfigId(id: string): Promise<void>;
  getActiveChatSessionId(): Promise<string | null>;
  setActiveChatSessionId(id: string): Promise<void>;
  getBackupPath(): Promise<string | null>;
  setBackupPath(path: string): Promise<void>;
  getBackupType(): Promise<"local" | "saf">;
  setBackupType(type: "local" | "saf"): Promise<void>;
  isAutoBackupEnabled(): Promise<boolean>;
  setAutoBackupEnabled(enabled: boolean): Promise<void>;
  saveTranslationIndex(): Promise<void>;
  ensureDefaultConfigs(): Promise<void>;
}

/**
 * Export all data for backup
 */
export async function exportAllData(ctx: BackupContext): Promise<{
  settings: AppSettings;
  geminiConfigs: GeminiConfig[];
  chatSessions: ChatSession[];
  translations: Record<string, VideoTranslations>;
  srtFiles: Record<string, string>;
  activeTranslationConfigId: string | null;
  activeChatConfigId: string | null;
  activeChatSessionId: string | null;
  translationQueue: any[];
}> {
  const translations: Record<string, VideoTranslations> = {};
  const srtFiles: Record<string, string> = {};

  // Load all translations
  for (const videoId of ctx.getCache().translationIndex) {
    const data = await ctx.getTranslation(videoId);
    if (data) translations[videoId] = data;
  }

  // Load all SRT files (get all keys starting with SRT_PREFIX)
  const allKeys = await AsyncStorage.getAllKeys();
  const srtKeys = allKeys.filter((k) => k.startsWith(KEYS.SRT_PREFIX));
  for (const key of srtKeys) {
    const videoId = key.replace(KEYS.SRT_PREFIX, "");
    const content = await ctx.getSrt(videoId);
    if (content) srtFiles[videoId] = content;
  }

  // Load translation queue
  let translationQueue: any[] = [];
  try {
    const queueData = await AsyncStorage.getItem("@translation_queue");
    if (queueData) {
      translationQueue = JSON.parse(queueData);
    }
  } catch {}

  return {
    settings: ctx.getSettings(),
    geminiConfigs: ctx.getGeminiConfigs(),
    chatSessions: ctx.getChatSessions(),
    translations,
    srtFiles,
    activeTranslationConfigId: await ctx.getActiveTranslationConfigId(),
    activeChatConfigId: await ctx.getActiveChatConfigId(),
    activeChatSessionId: await ctx.getActiveChatSessionId(),
    translationQueue,
  };
}

/**
 * Import all data from backup
 */
export async function importAllData(
  ctx: BackupContext,
  data: {
    settings?: AppSettings;
    geminiConfigs?: GeminiConfig[];
    chatSessions?: ChatSession[];
    translations?: Record<string, VideoTranslations>;
    srtFiles?: Record<string, string>;
    activeTranslationConfigId?: string | null;
    activeChatConfigId?: string | null;
    activeChatSessionId?: string | null;
    translationQueue?: any[];
  }
): Promise<void> {
  const cache = ctx.getCache();

  // Import settings
  if (data.settings) {
    const merged = mergeWithDefaults(data.settings);
    cache.settings = merged;
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
  }

  // Import configs
  if (data.geminiConfigs) {
    cache.geminiConfigs = data.geminiConfigs;
    await AsyncStorage.setItem(
      KEYS.GEMINI_CONFIGS,
      JSON.stringify(data.geminiConfigs)
    );
  }

  // Import chat sessions
  if (data.chatSessions) {
    cache.chatSessions = data.chatSessions;
    await AsyncStorage.setItem(
      KEYS.CHAT_SESSIONS,
      JSON.stringify(data.chatSessions)
    );
  }

  // Import translations
  if (data.translations) {
    for (const [videoId, translation] of Object.entries(data.translations)) {
      await AsyncStorage.setItem(
        KEYS.TRANSLATION_PREFIX + videoId,
        JSON.stringify(translation)
      );
      cache.translationIndex.add(videoId);
    }
    await ctx.saveTranslationIndex();
  }

  // Import SRT files
  if (data.srtFiles) {
    for (const [videoId, content] of Object.entries(data.srtFiles)) {
      await ctx.setSrt(videoId, content);
    }
  }

  // Import active IDs
  if (data.activeTranslationConfigId) {
    await ctx.setActiveTranslationConfigId(data.activeTranslationConfigId);
  }
  if (data.activeChatConfigId) {
    await ctx.setActiveChatConfigId(data.activeChatConfigId);
  }
  if (data.activeChatSessionId) {
    await ctx.setActiveChatSessionId(data.activeChatSessionId);
  }

  // Import translation queue
  if (data.translationQueue && data.translationQueue.length > 0) {
    await AsyncStorage.setItem(
      "@translation_queue",
      JSON.stringify(data.translationQueue)
    );
  }

  // Reinitialize queueManager to load new data
  const { queueManager } = await import("./queueManager");
  // Use reset() for atomic state cleanup instead of accessing private fields
  await queueManager.reset();
  // Clear initialized flag so initialize() will reload from AsyncStorage
  (queueManager as any).initialized = false;
  await queueManager.initialize();
}

/**
 * Clear all app data (preserves backup configuration)
 */
export async function clearAllData(ctx: BackupContext): Promise<void> {
  // Preserve backup configuration before clearing
  const backupPath = await ctx.getBackupPath();
  const backupType = await ctx.getBackupType();
  const autoBackupEnabled = await ctx.isAutoBackupEnabled();

  const allKeys = await AsyncStorage.getAllKeys();
  // Include @ziasub_ keys and @translation_queue
  const appKeys = allKeys.filter(
    (k) => k.startsWith("@ziasub_") || k === "@translation_queue"
  );
  await AsyncStorage.multiRemove(appKeys);

  // Reset cache
  ctx.setCache({
    settings: { ...DEFAULT_APP_SETTINGS },
    geminiConfigs: [],
    chatSessions: [],
    translationIndex: new Set(),
  });

  // Re-ensure defaults
  await ctx.ensureDefaultConfigs();

  // Restore backup configuration
  if (backupPath) {
    await ctx.setBackupPath(backupPath);
    await ctx.setBackupType(backupType);
    await ctx.setAutoBackupEnabled(autoBackupEnabled);
  }

  // Reset queueManager in-memory state
  const { queueManager } = await import("./queueManager");
  await queueManager.reset();
}

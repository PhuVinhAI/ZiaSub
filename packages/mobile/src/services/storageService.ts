/**
 * Storage Service - Primary storage using AsyncStorage
 * All app data is stored here. File system is only used for backup/restore.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AppSettings,
  GeminiConfig,
  ChatSession,
  VideoTranslations,
} from "@src/types";
import { DEFAULT_APP_SETTINGS } from "@constants/defaults";
import { logger } from "./loggerService";
import { KEYS } from "./storageKeys";
import { mergeWithDefaults, computeEnsuredConfigs } from "./storageDefaults";
import {
  exportAllData,
  importAllData,
  clearAllData,
  type StorageCache,
  type BackupContext,
} from "./storageBackup";

class StorageService {
  private static instance: StorageService;
  private initialized = false;

  // In-memory cache for frequently accessed data
  private cache: StorageCache = {
    settings: null,
    geminiConfigs: null,
    chatSessions: null,
    translationIndex: new Set(),
  };

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Build the context object bulk operations use to reach this instance's
   * cache + per-domain methods (including private helpers).
   */
  private getBackupContext(): BackupContext {
    return {
      getCache: () => this.cache,
      setCache: (cache) => {
        this.cache = cache;
      },
      getSettings: () => this.getSettings(),
      getGeminiConfigs: () => this.getGeminiConfigs(),
      getChatSessions: () => this.getChatSessions(),
      getTranslation: (videoId) => this.getTranslation(videoId),
      getSrt: (videoId) => this.getSrt(videoId),
      setSrt: (videoId, content) => this.setSrt(videoId, content),
      getActiveTranslationConfigId: () => this.getActiveTranslationConfigId(),
      setActiveTranslationConfigId: (id) =>
        this.setActiveTranslationConfigId(id),
      getActiveChatConfigId: () => this.getActiveChatConfigId(),
      setActiveChatConfigId: (id) => this.setActiveChatConfigId(id),
      getActiveChatSessionId: () => this.getActiveChatSessionId(),
      setActiveChatSessionId: (id) => this.setActiveChatSessionId(id),
      getBackupPath: () => this.getBackupPath(),
      setBackupPath: (path) => this.setBackupPath(path),
      getBackupType: () => this.getBackupType(),
      setBackupType: (type) => this.setBackupType(type),
      isAutoBackupEnabled: () => this.isAutoBackupEnabled(),
      setAutoBackupEnabled: (enabled) => this.setAutoBackupEnabled(enabled),
      saveTranslationIndex: () => this.saveTranslationIndex(),
      ensureDefaultConfigs: () => this.ensureDefaultConfigs(),
    };
  }

  /**
   * Initialize storage - load frequently accessed data into memory cache
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log("[StorageService] Initializing...");

      // Load core data in parallel
      const [settings, configs, sessions, indexJson] = await Promise.all([
        AsyncStorage.getItem(KEYS.SETTINGS),
        AsyncStorage.getItem(KEYS.GEMINI_CONFIGS),
        AsyncStorage.getItem(KEYS.CHAT_SESSIONS),
        AsyncStorage.getItem(KEYS.TRANSLATION_INDEX),
      ]);

      // Parse and merge with defaults
      if (settings) {
        const parsed = JSON.parse(settings);
        this.cache.settings = mergeWithDefaults(parsed);
      } else {
        this.cache.settings = { ...DEFAULT_APP_SETTINGS };
      }

      this.cache.geminiConfigs = configs ? JSON.parse(configs) : [];
      this.cache.chatSessions = sessions ? JSON.parse(sessions) : [];
      this.cache.translationIndex = indexJson
        ? new Set(JSON.parse(indexJson))
        : new Set();

      // Ensure default configs exist
      await this.ensureDefaultConfigs();

      this.initialized = true;
      logger.setDebugEnabled(!!this.cache.settings?.debug?.enabled);
      logger.info("StorageService", "StorageService initialized successfully");
    } catch (error) {
      console.error("[StorageService] Init error:", error);
      this.cache.settings = { ...DEFAULT_APP_SETTINGS };
      this.cache.geminiConfigs = [];
      this.cache.chatSessions = [];
      this.initialized = true;
      logger.setDebugEnabled(!!this.cache.settings?.debug?.enabled);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Force reinitialize - reload all data from AsyncStorage into cache
   * Call this after restore or clear operations
   */
  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.cache = {
      settings: null,
      geminiConfigs: null,
      chatSessions: null,
      translationIndex: new Set(),
    };
    await this.initialize();
  }

  private async ensureDefaultConfigs(): Promise<void> {
    const { configs, needsSave } = computeEnsuredConfigs(
      this.cache.geminiConfigs
    );

    if (needsSave) {
      this.cache.geminiConfigs = configs;
      await AsyncStorage.setItem(KEYS.GEMINI_CONFIGS, JSON.stringify(configs));
    }
  }

  // ============================================
  // SETTINGS
  // ============================================

  getSettings(): AppSettings {
    return this.cache.settings || { ...DEFAULT_APP_SETTINGS };
  }

  async setSettings(settings: AppSettings): Promise<void> {
    this.cache.settings = settings;
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    logger.setDebugEnabled(!!settings.debug?.enabled);
    logger.info("StorageService", `Settings updated. Debug mode: ${settings.debug?.enabled ? "ON" : "OFF"}`);
  }

  getApiKeys(): string[] {
    return this.cache.settings?.apiKeys?.keys || [];
  }

  async setApiKeys(keys: string[]): Promise<void> {
    if (!this.cache.settings) {
      this.cache.settings = { ...DEFAULT_APP_SETTINGS };
    }
    this.cache.settings.apiKeys = { keys };
    await AsyncStorage.setItem(
      KEYS.SETTINGS,
      JSON.stringify(this.cache.settings)
    );
  }

  // ============================================
  // GEMINI CONFIGS
  // ============================================

  getGeminiConfigs(): GeminiConfig[] {
    return this.cache.geminiConfigs || [];
  }

  async setGeminiConfigs(configs: GeminiConfig[]): Promise<void> {
    this.cache.geminiConfigs = configs;
    await AsyncStorage.setItem(KEYS.GEMINI_CONFIGS, JSON.stringify(configs));
  }

  async getActiveTranslationConfigId(): Promise<string | null> {
    const id = await AsyncStorage.getItem(KEYS.ACTIVE_TRANSLATION_CONFIG);
    return id;
  }

  async setActiveTranslationConfigId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACTIVE_TRANSLATION_CONFIG, id);
  }

  async getActiveChatConfigId(): Promise<string | null> {
    const id = await AsyncStorage.getItem(KEYS.ACTIVE_CHAT_CONFIG);
    return id;
  }

  async setActiveChatConfigId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACTIVE_CHAT_CONFIG, id);
  }

  // ============================================
  // CHAT SESSIONS
  // ============================================

  getChatSessions(): ChatSession[] {
    return this.cache.chatSessions || [];
  }

  async setChatSessions(sessions: ChatSession[]): Promise<void> {
    this.cache.chatSessions = sessions;
    await AsyncStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
  }

  async getActiveChatSessionId(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.ACTIVE_CHAT_SESSION);
  }

  async setActiveChatSessionId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACTIVE_CHAT_SESSION, id);
  }

  // ============================================
  // TRANSLATIONS
  // ============================================

  hasTranslationIndex(videoId: string): boolean {
    return this.cache.translationIndex.has(videoId);
  }

  getTranslationVideoIds(): string[] {
    return Array.from(this.cache.translationIndex);
  }

  async getTranslation(videoId: string): Promise<VideoTranslations | null> {
    try {
      const data = await AsyncStorage.getItem(
        KEYS.TRANSLATION_PREFIX + videoId
      );
      if (!data) return null;
      const parsed = JSON.parse(data) as VideoTranslations;
      if (!parsed.translations || parsed.translations.length === 0) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async setTranslation(
    videoId: string,
    data: VideoTranslations
  ): Promise<void> {
    await AsyncStorage.setItem(
      KEYS.TRANSLATION_PREFIX + videoId,
      JSON.stringify(data)
    );
    // Update index
    if (!this.cache.translationIndex.has(videoId)) {
      this.cache.translationIndex.add(videoId);
      await this.saveTranslationIndex();
    }
  }

  async deleteTranslation(videoId: string): Promise<void> {
    await AsyncStorage.removeItem(KEYS.TRANSLATION_PREFIX + videoId);
    this.cache.translationIndex.delete(videoId);
    await this.saveTranslationIndex();
  }

  private async saveTranslationIndex(): Promise<void> {
    await AsyncStorage.setItem(
      KEYS.TRANSLATION_INDEX,
      JSON.stringify(Array.from(this.cache.translationIndex))
    );
  }

  // ============================================
  // SRT FILES
  // ============================================

  async getSrt(videoId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.SRT_PREFIX + videoId);
    } catch {
      return null;
    }
  }

  async setSrt(videoId: string, content: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SRT_PREFIX + videoId, content);
  }

  async deleteSrt(videoId: string): Promise<void> {
    await AsyncStorage.removeItem(KEYS.SRT_PREFIX + videoId);
  }

  // ============================================
  // ONBOARDING & BACKUP CONFIG
  // ============================================

  async getOnboardingCompleted(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETED);
    return value === "true";
  }

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETED, String(completed));
  }

  async getBackupPath(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.BACKUP_PATH);
  }

  async setBackupPath(path: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.BACKUP_PATH, path);
  }

  async getBackupType(): Promise<"local" | "saf"> {
    const type = await AsyncStorage.getItem(KEYS.BACKUP_TYPE);
    return (type as "local" | "saf") || "local";
  }

  async setBackupType(type: "local" | "saf"): Promise<void> {
    await AsyncStorage.setItem(KEYS.BACKUP_TYPE, type);
  }

  async isAutoBackupEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.AUTO_BACKUP_ENABLED);
    return value === "true";
  }

  async setAutoBackupEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.AUTO_BACKUP_ENABLED, String(enabled));
  }

  async getLastBackupTime(): Promise<number | null> {
    const value = await AsyncStorage.getItem(KEYS.LAST_BACKUP_TIME);
    return value ? parseInt(value, 10) : null;
  }

  async setLastBackupTime(time: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_BACKUP_TIME, String(time));
  }

  // ============================================
  // BULK OPERATIONS (for backup/restore)
  // ============================================

  /**
   * Export all data for backup
   */
  async exportAllData() {
    return exportAllData(this.getBackupContext());
  }

  /**
   * Import all data from backup
   */
  async importAllData(data: {
    settings?: AppSettings;
    geminiConfigs?: GeminiConfig[];
    chatSessions?: ChatSession[];
    translations?: Record<string, VideoTranslations>;
    srtFiles?: Record<string, string>;
    activeTranslationConfigId?: string | null;
    activeChatConfigId?: string | null;
    activeChatSessionId?: string | null;
    translationQueue?: any[];
  }): Promise<void> {
    return importAllData(this.getBackupContext(), data);
  }

  /**
   * Clear all app data (preserves backup configuration)
   */
  async clearAllData(): Promise<void> {
    return clearAllData(this.getBackupContext());
  }
}

export const storageService = StorageService.getInstance();
export { KEYS as STORAGE_KEYS };

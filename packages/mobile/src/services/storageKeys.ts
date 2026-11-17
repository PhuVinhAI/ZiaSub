/**
 * Storage Keys
 *
 * Tách từ storageService.ts — chỉ di chuyển code, không sửa đổi logic.
 */

// Storage keys
export const KEYS = {
  SETTINGS: "@ziasub_settings",
  GEMINI_CONFIGS: "@ziasub_gemini_configs",
  CHAT_SESSIONS: "@ziasub_chat_sessions",
  ACTIVE_TRANSLATION_CONFIG: "@ziasub_active_translation_config",
  ACTIVE_CHAT_CONFIG: "@ziasub_active_chat_config",
  ACTIVE_CHAT_SESSION: "@ziasub_active_chat_session",
  TRANSLATION_INDEX: "@ziasub_translation_index", // List of video IDs
  TRANSLATION_PREFIX: "@ziasub_translation_", // + videoId
  SRT_PREFIX: "@ziasub_srt_", // + videoId
  ONBOARDING_COMPLETED: "@onboarding_completed",
  BACKUP_PATH: "@ziasub_backup_path",
  BACKUP_TYPE: "@ziasub_backup_type",
  AUTO_BACKUP_ENABLED: "@ziasub_auto_backup",
  LAST_BACKUP_TIME: "@ziasub_last_backup",
  SAVED_YOUTUBE_URLS: "@ziasub_saved_youtube_urls",
};

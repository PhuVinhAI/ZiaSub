/**
 * Hook for managing app settings
 * Uses storage service for persistence
 */
import { useState, useEffect, useCallback } from "react";
import type {
  SubtitleSettings,
  BatchSettings,
  FloatingUISettings,
  NotificationSettings,
  DebugSettings,
} from "@src/types";
import { storageService } from "@services/storageService";
import {
  DEFAULT_SUBTITLE_SETTINGS,
  DEFAULT_BATCH_SETTINGS,
  DEFAULT_FLOATING_UI_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_DEBUG_SETTINGS,
} from "@constants/defaults";
import { keyManager } from "@services/keyManager";
import { notificationService } from "@services/notificationService";

export const useAppSettings = () => {
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(
    DEFAULT_SUBTITLE_SETTINGS
  );
  const [batchSettings, setBatchSettings] = useState<BatchSettings>(
    DEFAULT_BATCH_SETTINGS
  );
  const [floatingUISettings, setFloatingUISettings] =
    useState<FloatingUISettings>(DEFAULT_FLOATING_UI_SETTINGS);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [debugSettings, setDebugSettings] =
    useState<DebugSettings>(DEFAULT_DEBUG_SETTINGS);
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all settings from storage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const settings = storageService.getSettings();

        setSubtitleSettings(settings.subtitle || DEFAULT_SUBTITLE_SETTINGS);
        setBatchSettings(settings.batch || DEFAULT_BATCH_SETTINGS);
        setFloatingUISettings(
          settings.floatingUI || DEFAULT_FLOATING_UI_SETTINGS
        );
        setNotificationSettings(
          settings.notification || DEFAULT_NOTIFICATION_SETTINGS
        );
        setDebugSettings(settings.debug || DEFAULT_DEBUG_SETTINGS);

        const keys = settings.apiKeys?.keys || [];
        setApiKeys(keys);

        // Initialize services with loaded settings
        if (keys.length > 0) {
          keyManager.initialize(keys);
        }
        // Initialize notification service
        notificationService.initialize();
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (storageService.isInitialized()) {
      loadSettings();
    }
  }, []);

  const updateSubtitleSettings = useCallback(
    async (newSettings: SubtitleSettings) => {
      setSubtitleSettings(newSettings);
      const settings = storageService.getSettings();
      settings.subtitle = newSettings;
      await storageService.setSettings(settings);
    },
    []
  );

  const updateBatchSettings = useCallback(
    async (newSettings: BatchSettings) => {
      setBatchSettings(newSettings);
      const settings = storageService.getSettings();
      settings.batch = newSettings;
      await storageService.setSettings(settings);
    },
    []
  );

  const updateApiKeys = useCallback(async (newKeys: string[]) => {
    setApiKeys(newKeys);
    keyManager.initialize(newKeys);
    await storageService.setApiKeys(newKeys);
  }, []);

  const updateFloatingUISettings = useCallback(
    async (newSettings: FloatingUISettings) => {
      setFloatingUISettings(newSettings);
      const settings = storageService.getSettings();
      settings.floatingUI = newSettings;
      await storageService.setSettings(settings);
    },
    []
  );

  const updateNotificationSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      setNotificationSettings(newSettings);
      const settings = storageService.getSettings();
      settings.notification = newSettings;
      await storageService.setSettings(settings);
    },
    []
  );

  const updateDebugSettings = useCallback(
    async (newSettings: DebugSettings) => {
      setDebugSettings(newSettings);
      const settings = storageService.getSettings();
      settings.debug = newSettings;
      await storageService.setSettings(settings);
    },
    []
  );

  return {
    subtitleSettings,
    batchSettings,
    floatingUISettings,
    notificationSettings,
    debugSettings,
    apiKeys,
    isLoading,
    updateSubtitleSettings,
    updateBatchSettings,
    updateFloatingUISettings,
    updateNotificationSettings,
    updateDebugSettings,
    updateApiKeys,
  };
};

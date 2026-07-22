/**
 * useSavedTranslations — load & track saved translations for a video
 *
 * Tách từ TranslateTab.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useState, useEffect, useCallback } from "react";
import type { SavedTranslation } from "@src/types";
import { getVideoTranslations } from "@utils/storage";

export function useSavedTranslations(videoUrl?: string, visible?: boolean) {
  const [savedTranslations, setSavedTranslations] = useState<
    SavedTranslation[]
  >([]);
  const [activeTranslationId, setActiveTranslationId] = useState<string | null>(
    null
  );

  const loadTranslations = useCallback(async () => {
    if (!videoUrl) return;
    try {
      const data = await getVideoTranslations(videoUrl);
      if (data) {
        setSavedTranslations(data.translations);
        setActiveTranslationId(data.activeTranslationId);
      } else {
        setSavedTranslations([]);
        setActiveTranslationId(null);
      }
    } catch (error) {
      console.error("Error loading translations:", error);
      setSavedTranslations([]);
      setActiveTranslationId(null);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (videoUrl) loadTranslations();
  }, [videoUrl, loadTranslations]);
  // Reload translations when modal becomes visible
  useEffect(() => {
    if (visible && videoUrl) {
      loadTranslations();
    }
  }, [visible, videoUrl, loadTranslations]);

  return {
    savedTranslations,
    setSavedTranslations,
    activeTranslationId,
    setActiveTranslationId,
    loadTranslations,
  };
}

/**
 * useTranslationConfigs — Gemini config selection + preset detection + API key check
 *
 * Tách từ TranslateTab.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useState, useEffect, useRef } from "react";
import type { GeminiConfig } from "@src/types";
import {
  getGeminiConfigs,
  getActiveTranslationConfig,
  getApiKeys,
} from "@utils/storage";
import { PRESET_PROMPTS, type PresetPromptType } from "@constants/defaults";

export function useTranslationConfigs() {
  const [geminiConfigs, setGeminiConfigs] = useState<GeminiConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [showConfigPicker, setShowConfigPicker] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [currentPresetId, setCurrentPresetId] = useState<
    PresetPromptType | undefined
  >();
  // Initialize preset ONLY once on initial load when currentPresetId is undefined
  useEffect(() => {
    if (!selectedConfigId || currentPresetId !== undefined) return;
    const selectedConfig = geminiConfigs.find((c) => c.id === selectedConfigId);
    if (selectedConfig) {
      if (selectedConfig.presetId) {
        setCurrentPresetId(selectedConfig.presetId as PresetPromptType);
      } else {
        const matchingPreset = PRESET_PROMPTS.find(
          (p) => p.prompt === selectedConfig.systemPrompt
        );
        setCurrentPresetId(matchingPreset?.id || "custom");
      }
    }
  }, [selectedConfigId, geminiConfigs, currentPresetId]);

  const loadConfigs = async () => {
    const configs = await getGeminiConfigs();
    // Filter out chat config for translation picker
    const translationConfigs = configs.filter(
      (c) => c.id !== "default-chat-config"
    );
    setGeminiConfigs(translationConfigs);
    const activeConfig = await getActiveTranslationConfig();
    if (activeConfig) {
      setSelectedConfigId(activeConfig.id);
    } else if (translationConfigs.length > 0) {
      setSelectedConfigId(translationConfigs[0].id);
    }
  };
  const checkApiKeys = async () => {
    const keys = await getApiKeys();
    setHasApiKey(keys.length > 0);
  };

  useEffect(() => {
    loadConfigs();
    checkApiKeys();
  }, []);

  const handleSelectConfig = (configId: string) => {
    setSelectedConfigId(configId);
    setShowConfigPicker(false);
  };

  return {
    geminiConfigs,
    setGeminiConfigs,
    selectedConfigId,
    setSelectedConfigId,
    showConfigPicker,
    setShowConfigPicker,
    hasApiKey,
    currentPresetId,
    setCurrentPresetId,
    handleSelectConfig,
  };
}

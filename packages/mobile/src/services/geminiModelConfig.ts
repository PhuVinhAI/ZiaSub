/**
 * Gemini Model Configuration Utilities
 *
 * Tách từ geminiService.ts — chứa các hàm mapping config (model, thinking level,
 * media resolution, system prompt) và model ID constants.
 * Chỉ di chuyển code, không sửa đổi logic.
 */
import { ThinkingLevel, MediaResolution } from "@google/genai";
import type { GeminiConfig } from "@src/types";
import {
  DEFAULT_CHAT_SYSTEM_PROMPT,
  DEFAULT_SYSTEM_PROMPT,
  PRESET_PROMPTS,
  buildTranslationSystemPrompt,
} from "@constants/defaults";

// Model IDs for reference
export const MODEL_GEMINI_3_7_FLASH = "models/gemini-3.7-flash";
export const MODEL_GEMINI_3_6_FLASH = "models/gemini-3.6-flash";
export const MODEL_GEMINI_3_5_FLASH = "models/gemini-3.5-flash";
export const MODEL_GEMINI_3_5_FLASH_LITE = "models/gemini-3.5-flash-lite";
export const MODEL_GEMINI_3_FLASH = "models/gemini-3-flash-preview";
export const MODEL_GEMINI_3_1_PRO = "models/gemini-3.1-pro-preview";
export const MODEL_GEMINI_3_1_FLASH_LITE = "models/gemini-3.1-flash-lite";
export const MODEL_GEMINI_PRO = "models/gemini-pro-latest";
export const MODEL_GEMINI_FLASH = "models/gemini-flash-latest";
export const MODEL_GEMINI_FLASH_LITE = "models/gemini-flash-lite-latest";

// Get effective system prompt - use preset if set, otherwise use custom systemPrompt
export const getEffectiveSystemPrompt = (config: GeminiConfig): string => {
  if (config.presetId) {
    const preset = PRESET_PROMPTS.find((p) => p.id === config.presetId);
    if (preset) return preset.prompt;
  }

  const customPrompt = (config.systemPrompt || "").trim();
  if (!customPrompt) {
    return DEFAULT_SYSTEM_PROMPT;
  }

  // New built-in prompts already contain the shared quality and SRT contract.
  if (
    customPrompt.includes("SOURCE FIDELITY") &&
    customPrompt.includes("SRT OUTPUT CONTRACT")
  ) {
    return customPrompt;
  }

  // User prompts specialize style/content; the output contract remains invariant.
  return buildTranslationSystemPrompt(customPrompt);
};

export const getEffectiveChatSystemPrompt = (config: GeminiConfig): string =>
  (config.systemPrompt || "").trim() || DEFAULT_CHAT_SYSTEM_PROMPT;

// Map config string to ThinkingLevel enum
export const getThinkingLevel = (level?: string): ThinkingLevel => {
  switch (level) {
    case "MINIMAL":
      return ThinkingLevel.MINIMAL;
    case "LOW":
      return ThinkingLevel.LOW;
    case "MEDIUM":
      return ThinkingLevel.MEDIUM;
    case "HIGH":
    default:
      return ThinkingLevel.HIGH;
  }
};

// Models without the MINIMAL thinking level - only LOW, MEDIUM, HIGH.
// gemini-flash-latest currently resolves to 3.7, so it follows the same rule.
// Flash Lite (incl. flash-lite-latest) still supports MINIMAL.
const MODELS_WITHOUT_MINIMAL_THINKING: string[] = [
  MODEL_GEMINI_PRO,
  MODEL_GEMINI_FLASH,
  MODEL_GEMINI_3_7_FLASH,
  MODEL_GEMINI_3_1_PRO,
];

export const supportsMinimalThinking = (model: string): boolean =>
  !MODELS_WITHOUT_MINIMAL_THINKING.includes(model);

// Get thinking config based on model type
export const getThinkingConfig = (
  model: string,
  thinkingLevel?: string
): { thinkingLevel?: ThinkingLevel } | undefined => {
  // Models without MINIMAL clamp it down to the nearest level (LOW)
  if (thinkingLevel === "MINIMAL" && !supportsMinimalThinking(model)) {
    return { thinkingLevel: ThinkingLevel.LOW };
  }

  // All other supported models use full ThinkingLevel (MINIMAL, LOW, MEDIUM, HIGH)
  return { thinkingLevel: getThinkingLevel(thinkingLevel) };
};

// Check if model supports mediaResolution
export const supportsMediaResolution = (_model: string): boolean => {
  return true;
};

// Map config string to MediaResolution enum
export const getMediaResolution = (resolution?: string): MediaResolution => {
  switch (resolution) {
    case "MEDIA_RESOLUTION_LOW":
      return MediaResolution.MEDIA_RESOLUTION_LOW;
    case "MEDIA_RESOLUTION_MEDIUM":
      return MediaResolution.MEDIA_RESOLUTION_MEDIUM;
    case "MEDIA_RESOLUTION_HIGH":
      return MediaResolution.MEDIA_RESOLUTION_HIGH;
    case "MEDIA_RESOLUTION_UNSPECIFIED":
    default:
      return MediaResolution.MEDIA_RESOLUTION_HIGH;
  }
};

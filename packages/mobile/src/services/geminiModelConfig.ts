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
export const MODEL_GEMINI_4_HYDROGEN = "models/gemini-4-hydrogen";
export const MODEL_GEMINI_4_ARGON = "models/gemini-4-argon";
export const MODEL_GEMINI_4_CARBON = "models/gemini-4-carbon";
export const MODEL_GEMINI_3_8_FLASH = "models/gemini-3.8-flash";
export const MODEL_GEMINI_3_6_FLASH = "models/gemini-3.6-flash";
export const MODEL_GEMINI_3_5_FLASH_LITE = "models/gemini-3.5-flash-lite";
export const MODEL_GEMINI_3_7_FLASH = "models/gemini-3.7-flash";
export const MODEL_GEMINI_3_5_FLASH = "models/gemini-3.5-flash";
export const MODEL_GEMINI_3_1_FLASH_LITE = "models/gemini-3.1-flash-lite";

export interface GeminiModelOption {
  id: string;
  name: string;
  deprecated?: {
    replacement: string;
    /** Announced shutdown date in ISO form; absent when Google has not announced one. */
    shutdownDate?: string;
  };
}

// Single source of truth for the models exposed in the config editor.
// Replaced-but-still-served models stay selectable and are flagged in the UI.
export const AVAILABLE_GEMINI_MODELS: GeminiModelOption[] = [
  { id: MODEL_GEMINI_4_HYDROGEN, name: "Gemini 4 Hydrogen" },
  { id: MODEL_GEMINI_4_ARGON, name: "Gemini 4 Argon" },
  { id: MODEL_GEMINI_4_CARBON, name: "Gemini 4 Carbon" },
  { id: MODEL_GEMINI_3_8_FLASH, name: "Gemini 3.8 Flash" },
  { id: MODEL_GEMINI_3_6_FLASH, name: "Gemini 3.6 Flash" },
  { id: MODEL_GEMINI_3_5_FLASH_LITE, name: "Gemini 3.5 Flash-Lite" },
  {
    id: MODEL_GEMINI_3_7_FLASH,
    name: "Gemini 3.7 Flash",
    deprecated: { replacement: "Gemini 3.8 Flash" },
  },
  {
    id: MODEL_GEMINI_3_5_FLASH,
    name: "Gemini 3.5 Flash",
    deprecated: { replacement: "Gemini 3.6 Flash" },
  },
  {
    id: MODEL_GEMINI_3_1_FLASH_LITE,
    name: "Gemini 3.1 Flash-Lite",
    deprecated: {
      replacement: "Gemini 3.5 Flash-Lite",
      shutdownDate: "2027-05-07",
    },
  },
];

// IDs that exist only in saved configs and cannot be called from the v1 API.
export const RETIRED_MODEL_MIGRATIONS: Record<string, string> = {
  "models/gemini-2.5-pro": MODEL_GEMINI_4_HYDROGEN,
  "models/gemini-flash-latest": MODEL_GEMINI_4_HYDROGEN,
  "models/gemini-pro-latest": MODEL_GEMINI_4_CARBON,
  "models/gemini-flash-lite-latest": MODEL_GEMINI_3_5_FLASH_LITE,
  "models/gemini-3-flash-preview": MODEL_GEMINI_3_8_FLASH,
  "models/gemini-3.1-pro-preview": MODEL_GEMINI_4_CARBON,
};

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
    case "XHIGH":
      return ThinkingLevel.XHIGH;
    case "HIGH":
    default:
      return ThinkingLevel.HIGH;
  }
};

// Models without the MINIMAL thinking level - only LOW, MEDIUM, HIGH.
// Gemini 4 and 3.8 Flash reject MINIMAL; 3.6 Flash and 3.5 Flash-Lite still support it.
const MODELS_WITHOUT_MINIMAL_THINKING: string[] = [
  MODEL_GEMINI_4_CARBON,
  MODEL_GEMINI_4_ARGON,
  MODEL_GEMINI_4_HYDROGEN,
  MODEL_GEMINI_3_8_FLASH,
  MODEL_GEMINI_3_7_FLASH,
];

export const supportsMinimalThinking = (model: string): boolean =>
  !MODELS_WITHOUT_MINIMAL_THINKING.includes(model);

// Only Gemini 4 Hydrogen exposes the extra-high thinking level.
export const supportsXHighThinking = (model: string): boolean =>
  model === MODEL_GEMINI_4_HYDROGEN;

// Get thinking config based on model type
export const getThinkingConfig = (
  model: string,
  thinkingLevel?: string
): { thinkingLevel?: ThinkingLevel } | undefined => {
  // Models without MINIMAL clamp it down to the nearest level (LOW)
  if (thinkingLevel === "MINIMAL" && !supportsMinimalThinking(model)) {
    return { thinkingLevel: ThinkingLevel.LOW };
  }

  // XHIGH is Hydrogen-only; other models fall back to the highest shared level
  if (thinkingLevel === "XHIGH" && !supportsXHighThinking(model)) {
    return { thinkingLevel: ThinkingLevel.HIGH };
  }

  // Other supported models use the full ThinkingLevel set they expose
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

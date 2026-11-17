import type { SubtitleItem } from "@ziasub/shared";
import type { ExtensionSettings } from "./settings";

export type MessageType =
  | { type: "SET_SUBTITLES"; subtitles: SubtitleItem[] }
  | { type: "CLEAR_SUBTITLES" }
  | { type: "GET_SUBTITLES" }
  | { type: "SETTINGS_UPDATED"; settings: ExtensionSettings };

export interface MessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

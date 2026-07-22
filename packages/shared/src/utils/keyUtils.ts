/**
 * Utility functions for API key validation and formatting
 */

/**
 * Validates whether a given string is a valid Gemini API Key.
 * Supports 2 formats:
 * - Legacy format: starts with 'AIza' (min length 25)
 * - New format: starts with 'AQ.' (min length 25)
 */
export const isValidApiKey = (key?: string): boolean => {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 25) return false;
  return trimmed.startsWith("AIza") || trimmed.startsWith("AQ.");
};

/**
 * Mask an API key for safe display (e.g. "AQ.Ab8RN...wrl")
 */
export const maskKey = (key: string): string => {
  if (!key || key.length < 12) return "***";
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
};

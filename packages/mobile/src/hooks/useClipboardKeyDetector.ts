import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Clipboard from "expo-clipboard";
import { isValidApiKey, maskKey } from "@utils/keyUtils";
import { alert, confirm } from "@components/common/CustomAlert";

interface UseClipboardKeyDetectorParams {
  apiKeys: string[];
  updateApiKeys: (keys: string[]) => void;
  activeUrl?: string;
}

export const useClipboardKeyDetector = ({
  apiKeys,
  updateApiKeys,
  activeUrl,
}: UseClipboardKeyDetectorParams) => {
  const lastCheckedClipboardRef = useRef<string>("");

  const checkClipboard = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const trimmed = text?.trim();
      if (!trimmed) return;

      // Skip if this exact clipboard text was already checked
      if (trimmed === lastCheckedClipboardRef.current) return;

      // Check if format is a valid key (starts with AIza or AQ.)
      if (!isValidApiKey(trimmed)) return;

      // Mark this clipboard string as checked so we don't pop up again for the same string
      lastCheckedClipboardRef.current = trimmed;

      // Skip if key already exists in app's apiKeys
      if (apiKeys.includes(trimmed)) return;

      // Prompt user with small confirm dialog
      confirm(
        "Thêm API Key mới?",
        `Tìm thấy key: ${maskKey(trimmed)}`,
        () => {
          const newKeys = [...apiKeys, trimmed];
          updateApiKeys(newKeys);
          alert("Thành công", "Đã thêm API Key mới!");
        },
        "Thêm ngay",
        "Bỏ qua"
      );
    } catch {
      // Ignore errors when reading clipboard
    }
  }, [apiKeys, updateApiKeys]);

  useEffect(() => {
    // Initial check on mount / URL change
    checkClipboard();

    // Interval check every 300ms while app is active for near-instant detection
    const intervalId = setInterval(() => {
      if (AppState.currentState === "active") {
        checkClipboard();
      }
    }, 300);

    // AppState change listener (e.g. returning to app from background)
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          checkClipboard();
        }
      }
    );

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [checkClipboard, activeUrl]);
};

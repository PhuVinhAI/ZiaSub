import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Clipboard from "expo-clipboard";
import { parseSRT } from "@ziasub/shared";
import { isValidApiKey, maskKey } from "@utils/keyUtils";
import {
  getLastCopiedVideoUrl,
  setLastCopiedVideoUrl,
  isVideoPage,
  normalizeYouTubeUrl,
  extractVideoId,
} from "@utils/videoUtils";
import {
  saveTranslation,
  getLastCopiedVideoUrlFromStorage,
  saveLastCopiedVideoUrlToStorage,
} from "@utils/storage";
import { alert, confirm } from "@components/common/CustomAlert";

interface UseClipboardKeyDetectorParams {
  apiKeys: string[];
  updateApiKeys: (keys: string[]) => void;
  activeUrl?: string;
  onApplySrt?: (srtContent: string, videoUrl: string) => void;
}

export const useClipboardKeyDetector = ({
  apiKeys,
  updateApiKeys,
  activeUrl,
  onApplySrt,
}: UseClipboardKeyDetectorParams) => {
  const lastCheckedClipboardRef = useRef<string>("");

  const checkClipboard = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const trimmed = text?.trim();
      if (!trimmed) return;

      // Skip if this exact clipboard text was already checked
      if (trimmed === lastCheckedClipboardRef.current) return;

      // 0. Check if text in clipboard is a YouTube Video URL (copied from Chrome or anywhere)
      if (isVideoPage(trimmed)) {
        lastCheckedClipboardRef.current = trimmed;
        const cleanUrl = normalizeYouTubeUrl(trimmed);
        setLastCopiedVideoUrl(cleanUrl);
        await saveLastCopiedVideoUrlToStorage(cleanUrl);
        return;
      }

      // 1. Check if text is a valid Gemini API Key (starts with AIza or AQ.)
      if (isValidApiKey(trimmed)) {
        // Mark as checked
        lastCheckedClipboardRef.current = trimmed;

        // Skip if key already exists in app's apiKeys
        if (apiKeys.includes(trimmed)) return;

        // Prompt user to add API Key
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
        return;
      }

      // 2. Check if text is a valid SRT Subtitle format
      const srtItems = parseSRT(trimmed);
      if (srtItems && srtItems.length > 0) {
        // Mark as checked
        lastCheckedClipboardRef.current = trimmed;

        // Determine target video URL (from memory, storage, or activeUrl)
        let targetVideoUrl = getLastCopiedVideoUrl();
        if (!targetVideoUrl) {
          targetVideoUrl = await getLastCopiedVideoUrlFromStorage();
        }
        if (!targetVideoUrl && activeUrl && isVideoPage(activeUrl)) {
          targetVideoUrl = normalizeYouTubeUrl(activeUrl);
        }

        if (targetVideoUrl) {
          const videoId = extractVideoId(targetVideoUrl) || targetVideoUrl;

          // Prompt user to auto-save translation for video
          confirm(
            "Lưu phụ đề AI Studio?",
            `Tìm thấy phụ đề SRT (${srtItems.length} câu) cho video: ${videoId}\n\nBạn có muốn tự động lưu bản dịch này không?`,
            async () => {
              try {
                await saveTranslation(
                  targetVideoUrl,
                  trimmed,
                  "AI Studio"
                );
                if (
                  activeUrl &&
                  extractVideoId(activeUrl) === extractVideoId(targetVideoUrl) &&
                  onApplySrt
                ) {
                  onApplySrt(trimmed, targetVideoUrl);
                }
                alert(
                  "Thành công",
                  "Đã tự động lưu bản dịch 'AI Studio' cho video!"
                );
              } catch {
                alert("Lỗi", "Không thể lưu phụ đề vào video.");
              }
            },
            "Lưu bản dịch",
            "Bỏ qua"
          );
        }
      }
    } catch {
      // Ignore errors when reading clipboard
    }
  }, [apiKeys, updateApiKeys, activeUrl, onApplySrt]);

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

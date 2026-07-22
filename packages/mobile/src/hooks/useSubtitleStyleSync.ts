/**
 * useSubtitleStyleSync
 *
 * Tách từ HomeScreen.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useEffect } from "react";
import type { RefObject } from "react";
import { WebView } from "react-native-webview";
import { ttsService } from "@services/ttsService";
import type { SubtitleSettings } from "@src/types";

interface UseSubtitleStyleSyncParams {
  webViewRef: RefObject<WebView | null>;
  postMessageToWebView: (message: object) => void;
  subtitleSettings: SubtitleSettings;
  isVideoPlaying: boolean;
}

export const useSubtitleStyleSync = ({
  webViewRef,
  postMessageToWebView,
  subtitleSettings,
  isVideoPlaying,
}: UseSubtitleStyleSyncParams) => {
  // Set up TTS speaking callback for video ducking
  useEffect(() => {
    ttsService.setSpeakingCallback((isSpeaking) => {
      const settings = ttsService.getSettings();
      if (webViewRef.current && settings.duckVideo) {
        const volume = isSpeaking ? settings.duckLevel : 1.0;
        postMessageToWebView({ type: "setVideoVolume", payload: volume });
      }
    });
  }, [postMessageToWebView]);

  // Send subtitle style to WebView whenever settings change
  useEffect(() => {
    postMessageToWebView({
      type: "setSubtitleStyle",
      payload: subtitleSettings,
    });
  }, [subtitleSettings, postMessageToWebView]);

  // Send subtitle style when entering video page
  useEffect(() => {
    if (isVideoPlaying) {
      const timer = setTimeout(() => {
        postMessageToWebView({
          type: "setSubtitleStyle",
          payload: subtitleSettings,
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVideoPlaying, subtitleSettings, postMessageToWebView]);
};

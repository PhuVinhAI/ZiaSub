/**
 * Hook for managing subtitles
 */
import { useState, useCallback, useRef } from "react";
import type { SubtitleItem } from "@src/types";
import { parseSRT, fixSRT } from "@utils/srtParser";
import {
  saveSRT,
  getSRT,
  removeSRT,
  getActiveTranslation,
  clearLastCopiedVideoUrl,
  setHandledSrt,
} from "@utils/storage";
import { WebView } from "react-native-webview";

interface UseSubtitlesOptions {
  webViewRef: React.RefObject<WebView | null>;
}

export const useSubtitles = ({ webViewRef }: UseSubtitlesOptions) => {
  const [srtContent, setSrtContent] = useState("");
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const lastSentSubtitleRef = useRef<string>("");
  const lastPlaybackTimeRef = useRef(0);

  // Load saved SRT for a video URL
  const loadSavedSRT = useCallback(
    async (url: string) => {
      lastPlaybackTimeRef.current = 0;
      if (!url) {
        setSrtContent("");
        setSubtitles([]);
        setCurrentSubtitle("");
        lastSentSubtitleRef.current = "";
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({ type: "setSubtitle", payload: "" })
          );
        }
        return;
      }

      // First check manual SRT
      let srt = await getSRT(url);

      // If no manual SRT, check for active translation
      if (!srt) {
        const activeTranslation = await getActiveTranslation(url);
        if (activeTranslation) {
          srt = activeTranslation.srtContent;
        }
      }

      if (srt) {
        setSrtContent(srt);
        const { fixedData } = fixSRT(srt);
        const parsed = parseSRT(fixedData);
        setSubtitles(parsed);
        lastSentSubtitleRef.current = "";
        // Auto-apply subtitles when loaded
        if (webViewRef.current && parsed.length > 0) {
          // Subtitles will be shown when video plays and findSubtitle is called
        }
      } else {
        setSrtContent("");
        setSubtitles([]);
        setCurrentSubtitle("");
        lastSentSubtitleRef.current = "";
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({ type: "setSubtitle", payload: "" })
          );
        }
      }
    },
    [webViewRef]
  );

  // Apply SRT content and save
  const applySrtContent = useCallback(
    async (content: string, videoUrl: string) => {
      const { fixedData, fixCount } = fixSRT(content);
      const parsed = parseSRT(fixedData);
      setSubtitles(parsed);
      setSrtContent(fixedData);
      lastSentSubtitleRef.current = "";
      setCurrentSubtitle("");

      // Clear subtitle display in WebView when content is empty
      if (!fixedData && webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({ type: "setSubtitle", payload: "" })
        );
      }

      if (videoUrl) {
        if (fixedData) {
          await saveSRT(videoUrl, fixedData);
        } else {
          await removeSRT(videoUrl);
        }
      }

      await clearLastCopiedVideoUrl();
      if (fixedData) {
        await setHandledSrt(fixedData);
      }

      return { fixCount, parsed };
    },
    [webViewRef]
  );

  // Keep the player and visual editor in sync without writing every edit to storage.
  // The finalized content is persisted by applySrtContent when the editor closes.
  const updateSrtDraft = useCallback(
    (content: string) => {
      setSrtContent(content);
      const { fixedData } = fixSRT(content);
      const parsed = parseSRT(fixedData);
      const activeSubtitle = parsed.find(
        (subtitle) =>
          lastPlaybackTimeRef.current >= subtitle.startTime &&
          lastPlaybackTimeRef.current <= subtitle.endTime
      );
      const text = activeSubtitle?.text || "";

      setSubtitles(parsed);
      setCurrentSubtitle(text);
      lastSentSubtitleRef.current = text;
      webViewRef.current?.postMessage(
        JSON.stringify({ type: "setSubtitle", payload: text })
      );
    },
    [webViewRef]
  );

  // Find and display subtitle for current time
  const findSubtitle = useCallback(
    (seconds: number) => {
      lastPlaybackTimeRef.current = seconds;
      const sub = subtitles.find(
        (s) => seconds >= s.startTime && seconds <= s.endTime
      );
      const text = sub ? sub.text : "";

      const shouldSend =
        text !== currentSubtitle ||
        (subtitles.length > 0 && text && lastSentSubtitleRef.current !== text);

      if (shouldSend) {
        setCurrentSubtitle(text);
        lastSentSubtitleRef.current = text;

        // Send subtitle to WebView
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: "setSubtitle",
              payload: text,
            })
          );
        }
      }
    },
    [subtitles, currentSubtitle, webViewRef]
  );

  // Update subtitles from translation result
  const updateFromTranslation = useCallback((srt: string) => {
    setSrtContent(srt);
    const { fixedData } = fixSRT(srt);
    const parsed = parseSRT(fixedData);
    setSubtitles(parsed);
    lastSentSubtitleRef.current = "";
  }, []);

  // Clear all subtitles
  const clearSubtitles = useCallback(
    async (videoUrl?: string) => {
      setSrtContent("");
      setSubtitles([]);
      setCurrentSubtitle("");
      lastSentSubtitleRef.current = "";

      // Clear subtitle display in WebView
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({ type: "setSubtitle", payload: "" })
        );
      }

      // Remove saved SRT if videoUrl provided
      if (videoUrl) {
        await removeSRT(videoUrl);
      }
    },
    [webViewRef]
  );

  return {
    srtContent,
    setSrtContent,
    subtitles,
    currentSubtitle,
    loadSavedSRT,
    applySrtContent,
    updateSrtDraft,
    findSubtitle,
    updateFromTranslation,
    clearSubtitles,
    hasSubtitles: subtitles.length > 0,
  };
};

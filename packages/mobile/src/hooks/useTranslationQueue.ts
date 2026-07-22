/**
 * Hook for managing translation queue
 *
 * Đề xuất E: checkQueueStatus logic đã được gộp vào useQueueVideoStatus hook chung.
 * Hook này giờ chỉ giữ logic translation-specific (isTranslating, progress, WebView sync).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { queueManager } from "@services/queueManager";
import { translationManager } from "@services/translationManager";
import { extractVideoId } from "@utils/videoUtils";
import {
  getFullyTranslatedVideoUrls,
  getPartialOnlyVideoUrls,
} from "@utils/storage";
import { useQueueVideoStatus } from "./useQueueVideoStatus";
import { WebView } from "react-native-webview";

interface UseTranslationQueueOptions {
  webViewRef: React.RefObject<WebView | null>;
  currentUrlRef: React.RefObject<string>;
  onTranslationComplete?: (srt: string) => void;
}

export const useTranslationQueue = ({
  webViewRef,
  currentUrlRef,
  onTranslationComplete,
}: UseTranslationQueueOptions) => {
  const [queueCount, setQueueCount] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);

  // Track the video URL that is currently being translated for THIS video
  const currentTranslatingUrlRef = useRef<string | null>(null);

  // Đề xuất E: Dùng hook chung cho queue status thay vì duplicate checkQueueStatus
  const {
    isWaitingInQueue,
    isPausedInQueue,
    queuePosition,
    pausedProgress,
  } = useQueueVideoStatus(undefined, currentUrlRef);

  // Sync translated video IDs to WebView
  const syncTranslatedVideosToWebView = useCallback(async () => {
    // Get fully translated videos (have at least one complete translation)
    const fullyTranslatedUrls = await getFullyTranslatedVideoUrls();
    const fullyTranslatedIds = fullyTranslatedUrls
      .map((url) => extractVideoId(url))
      .filter((id): id is string => id !== null);

    // Get partial only videos (only have partial translations)
    const partialOnlyUrls = await getPartialOnlyVideoUrls();
    const partialOnlyIds = partialOnlyUrls
      .map((url) => extractVideoId(url))
      .filter((id): id is string => id !== null);

    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "setTranslatedVideos",
          payload: {
            full: fullyTranslatedIds,
            partial: partialOnlyIds,
          },
        })
      );
    }
  }, [webViewRef]);

  // Sync queued video IDs to WebView
  const syncQueuedVideosToWebView = useCallback(() => {
    const { items: queueItems } = queueManager.getItemsByStatus("all");
    const videoIds = queueItems
      .filter(
        (item) => item.status === "pending" || item.status === "translating"
      )
      .map((item) => extractVideoId(item.videoUrl))
      .filter((id): id is string => id !== null);

    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: "setQueuedVideos", payload: videoIds })
      );
    }
  }, [webViewRef]);

  // Sync all data to WebView
  const syncAllToWebView = useCallback(async () => {
    await syncTranslatedVideosToWebView();
    syncQueuedVideosToWebView();
  }, [syncTranslatedVideosToWebView, syncQueuedVideosToWebView]);

  // Initialize queue manager and subscribe to updates
  useEffect(() => {
    queueManager.initialize();
    const unsubscribe = queueManager.subscribe(() => {
      const counts = queueManager.getCounts();
      setQueueCount(counts.pending + counts.translating);
      syncQueuedVideosToWebView();
    });
    return () => unsubscribe();
  }, [syncQueuedVideosToWebView]);

  // Subscribe to translation manager for auto-apply
  useEffect(() => {
    const unsubscribe = translationManager.subscribe((job) => {
      // Skip if job is null or missing videoUrl
      if (!job || !job.videoUrl) return;

      const jobVideoId = extractVideoId(job.videoUrl);
      const currentVideoId = extractVideoId(currentUrlRef.current);

      // Only show translating state if this job is for the current video
      const isCurrentVideo =
        jobVideoId && currentVideoId && jobVideoId === currentVideoId;

      // Check if this is a batch retranslation (has isBatchRetranslation flag or retranslateBatchIndex)
      // Time range translation (rangeStart/rangeEnd without isBatchRetranslation) is NOT a batch retranslation
      const isBatchRetranslation =
        job.isBatchRetranslation || job.retranslateBatchIndex !== undefined;

      if (isCurrentVideo) {
        // Batch retranslation should NOT affect main isTranslating state
        const isJobProcessing =
          job.status === "processing" && !isBatchRetranslation;
        setIsTranslating(isJobProcessing);

        if (isJobProcessing) {
          currentTranslatingUrlRef.current = job.videoUrl;
          if (job.progress) {
            setTranslationProgress({
              completed: job.progress.completedBatches,
              total: job.progress.totalBatches,
            });
          }
        }

        // Streaming mode: Apply partial result (only for full translation, not batch retranslation)
        if (
          job.status === "processing" &&
          job.partialResult &&
          !isBatchRetranslation
        ) {
          onTranslationComplete?.(job.partialResult);
        }

        // Final result when completed (only for full translation)
        if (job.status === "completed" && job.result && !isBatchRetranslation) {
          onTranslationComplete?.(job.result);
          syncTranslatedVideosToWebView();
          setIsTranslating(false);
          setTranslationProgress(null);
          currentTranslatingUrlRef.current = null;
        }

        // Batch retranslation completed - just sync
        if (job.status === "completed" && isBatchRetranslation) {
          syncTranslatedVideosToWebView();
        }

        if (job.status === "error") {
          if (!isBatchRetranslation) {
            setIsTranslating(false);
            setTranslationProgress(null);
            currentTranslatingUrlRef.current = null;
          }
          // Queue status (waiting/paused) tự cập nhật qua useQueueVideoStatus hook
        }
      } else {
        // Different video is being translated - ensure current video shows correct state
        // Check if current video has its own active job
        const currentJob = translationManager.getJobForUrl(
          currentUrlRef.current
        );
        if (!currentJob || currentJob.status !== "processing") {
          setIsTranslating(false);
          setTranslationProgress(null);
        }
      }
    });
    return () => unsubscribe();
  }, [
    currentUrlRef,
    onTranslationComplete,
    syncTranslatedVideosToWebView,
  ]);

  // Reset state when URL changes
  useEffect(() => {
    const currentVideoId = extractVideoId(currentUrlRef.current);
    const job = translationManager.getCurrentJob();

    if (job) {
      const jobVideoId = extractVideoId(job.videoUrl);
      // Check if this is a batch retranslation (has isBatchRetranslation flag or retranslateBatchIndex)
      // Time range translation (rangeStart/rangeEnd without isBatchRetranslation) is NOT a batch retranslation
      const isBatchRetranslation =
        job.isBatchRetranslation || job.retranslateBatchIndex !== undefined;

      if (
        jobVideoId === currentVideoId &&
        job.status === "processing" &&
        !isBatchRetranslation
      ) {
        setIsTranslating(true);
        currentTranslatingUrlRef.current = job.videoUrl;
        if (job.progress) {
          setTranslationProgress({
            completed: job.progress.completedBatches,
            total: job.progress.totalBatches,
          });
        }
      } else {
        setIsTranslating(false);
        setTranslationProgress(null);
      }
    } else {
      setIsTranslating(false);
      setTranslationProgress(null);
    }
    // Queue status tự cập nhật qua useQueueVideoStatus hook khi URL thay đổi
  }, [currentUrlRef.current]);

  return {
    queueCount,
    isTranslating,
    isWaitingInQueue,
    isPausedInQueue,
    queuePosition,
    pausedProgress,
    translationProgress,
    syncAllToWebView,
    syncTranslatedVideosToWebView,
    syncQueuedVideosToWebView,
  };
};

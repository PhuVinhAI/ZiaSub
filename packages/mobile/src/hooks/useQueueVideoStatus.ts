/**
 * useQueueVideoStatus — Hook chung cho trạng thái queue của một video
 *
 * Đề xuất E: Gộp logic checkQueueStatus trùng lặp giữa
 * SubtitleInputModal và useTranslationQueue vào một hook duy nhất.
 *
 * Trả về: isWaitingInQueue, isPausedInQueue, queuePosition, pausedProgress
 */
import { useState, useEffect, useCallback } from "react";
import { queueManager } from "@services/queueManager";
import { translationManager } from "@services/translationManager";
import { extractVideoId } from "@utils/videoUtils";

export interface QueueVideoStatus {
  isWaitingInQueue: boolean;
  isPausedInQueue: boolean;
  queuePosition: number | null;
  pausedProgress: { completed: number; total: number } | null;
}

export function useQueueVideoStatus(
  videoUrl: string | undefined,
  currentUrlRef?: React.RefObject<string>
): QueueVideoStatus {
  const [isWaitingInQueue, setIsWaitingInQueue] = useState(false);
  const [isPausedInQueue, setIsPausedInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [pausedProgress, setPausedProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);

  // Resolve which URL to use — supports both direct string and ref pattern
  const resolveUrl = useCallback((): string | undefined => {
    if (videoUrl !== undefined) return videoUrl;
    if (currentUrlRef?.current) return currentUrlRef.current;
    return undefined;
  }, [videoUrl, currentUrlRef]);

  // Central status check — replaces ~80 lines of duplicated logic
  const checkQueueStatus = useCallback(() => {
    const url = resolveUrl();
    if (!url) {
      setIsWaitingInQueue(false);
      setIsPausedInQueue(false);
      setQueuePosition(null);
      setPausedProgress(null);
      return;
    }

    const queueStatus = queueManager.getVideoQueueStatus(url);

    // Check if paused
    if (queueStatus.inQueue && queueStatus.status === "paused") {
      // Batch retranslation paused — should NOT affect main UI
      const queueItem = queueManager.isInQueue(url);
      if (queueItem?.retranslateBatchIndex !== undefined) {
        setIsPausedInQueue(false);
        setIsWaitingInQueue(false);
        setQueuePosition(null);
        setPausedProgress(null);
        return;
      }

      // Full translation paused — show paused state
      setIsPausedInQueue(true);
      setIsWaitingInQueue(false);
      setQueuePosition(null);
      if (queueItem && queueItem.completedBatches && queueItem.totalBatches) {
        setPausedProgress({
          completed: queueItem.completedBatches,
          total: queueItem.totalBatches,
        });
      } else {
        setPausedProgress(null);
      }
      return;
    }

    // Reset paused state
    setIsPausedInQueue(false);
    setPausedProgress(null);

    if (queueStatus.inQueue && queueStatus.status === "translating") {
      // Batch retranslation — should NOT show as waiting
      const queueItem = queueManager.isInQueue(url);
      if (queueItem?.retranslateBatchIndex !== undefined) {
        setIsWaitingInQueue(false);
        setQueuePosition(null);
        return;
      }

      // Check if this video is actively being translated vs waiting
      const currentJob = translationManager.getCurrentJob();
      const currentVideoId = extractVideoId(url);
      const jobVideoId = currentJob
        ? extractVideoId(currentJob.videoUrl)
        : null;

      if (
        currentJob &&
        jobVideoId === currentVideoId &&
        currentJob.status === "processing"
      ) {
        // Actively being translated
        setIsWaitingInQueue(false);
        setQueuePosition(null);
      } else {
        // Waiting in queue
        setIsWaitingInQueue(true);
        setQueuePosition(queueStatus.position || null);
      }
    } else {
      setIsWaitingInQueue(false);
      setQueuePosition(null);
    }
  }, [resolveUrl]);

  // Re-check when resolved URL changes (fix: ref pattern won't trigger checkQueueStatus callback change)
  const resolvedUrl = resolveUrl();
  useEffect(() => {
    checkQueueStatus();
  }, [resolvedUrl, checkQueueStatus]);

  // Subscribe to queue changes + translation manager for real-time updates
  useEffect(() => {
    // Re-check whenever queue changes
    const unsubscribeQueue = queueManager.subscribe(() => {
      checkQueueStatus();
    });

    // Re-check only when translation job completes/errors (not on every progress update)
    const unsubscribeTranslation = translationManager.subscribe((job) => {
      if (!job || !job.videoUrl) return;
      if (job.status === "completed" || job.status === "error") {
        checkQueueStatus();
      }
    });

    return () => {
      unsubscribeQueue();
      unsubscribeTranslation();
    };
  }, [checkQueueStatus]);

  return {
    isWaitingInQueue,
    isPausedInQueue,
    queuePosition,
    pausedProgress,
  };
}

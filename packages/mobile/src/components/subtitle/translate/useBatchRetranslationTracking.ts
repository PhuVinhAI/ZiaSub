/**
 * useBatchRetranslationTracking — track batch retranslation & time-range state
 * from the queue + translationManager subscriptions.
 *
 * Tách từ TranslateTab.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useState, useEffect } from "react";
import type { SavedTranslation, TranslationJob } from "@src/types";
import { translationManager } from "@services/translationManager";
import { extractVideoId } from "@utils/videoUtils";

interface UseBatchRetranslationTrackingParams {
  videoUrl?: string;
  savedTranslations: SavedTranslation[];
  loadTranslations: () => void;
}

export function useBatchRetranslationTracking({
  videoUrl,
  savedTranslations,
  loadTranslations,
}: UseBatchRetranslationTrackingParams) {
  // Track batch retranslation job (for single batch or fromHere mode)
  const [batchRetranslateJob, setBatchRetranslateJob] =
    useState<TranslationJob | null>(null);
  // Track paused batch retranslation (from queue)
  const [pausedBatchRetranslation, setPausedBatchRetranslation] = useState<{
    batchIndex: number;
    mode: "single" | "fromHere";
    batchIndices?: number[];
    completedBatches?: number;
    totalBatches?: number;
    translationId?: string;
  } | null>(null);
  // Track which translation is being retranslated
  const [retranslatingTranslationId, setRetranslatingTranslationId] = useState<
    string | null
  >(null);
  // Track current time range translation (for display in TranslationProgress)
  const [currentTimeRange, setCurrentTimeRange] = useState<{
    rangeStart?: number;
    rangeEnd?: number;
  } | null>(null);

  // Check for paused/waiting/active batch retranslation from queue
  useEffect(() => {
    if (!videoUrl) {
      setPausedBatchRetranslation(null);
      setBatchRetranslateJob(null);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupAndSubscribe = async () => {
      const { queueManager } = await import("@services/queueManager");

      const checkBatchRetranslation = () => {
        if (!isMounted) return;
        // Use getBatchRetranslationInfo to get paused, waiting, or active batch retranslation
        const batchItem = queueManager.getBatchRetranslationInfo(videoUrl);
        if (
          batchItem &&
          (batchItem.retranslateBatchIndices?.length ||
            batchItem.retranslateBatchIndex !== undefined)
        ) {
          // Track which translation is being retranslated
          if (batchItem.savedTranslationId) {
            setRetranslatingTranslationId(batchItem.savedTranslationId);
          }

          const batchDuration =
            batchItem.batchSettings?.maxVideoDuration || 600;
          const targetTranslation = batchItem.savedTranslationId
            ? savedTranslations.find(
                (translation) =>
                  translation.id === batchItem.savedTranslationId,
              )
            : savedTranslations[0];
          const totalTranslationBatches =
            targetTranslation?.totalBatches ||
            Math.ceil(
              (targetTranslation?.videoDuration || batchItem.duration || 0) /
                batchDuration,
            );
          const firstBatchIndex = batchItem.retranslateBatchIndex ?? 0;
          const selectedBatchIndices = batchItem.retranslateBatchIndices?.length
            ? [...batchItem.retranslateBatchIndices].sort((a, b) => a - b)
            : batchItem.retranslateMode === "fromHere"
              ? Array.from(
                  {
                    length: Math.max(
                      totalTranslationBatches - firstBatchIndex,
                      0,
                    ),
                  },
                  (_, offset) => firstBatchIndex + offset,
                )
              : [firstBatchIndex];

          if (batchItem.status === "paused") {
            // Paused state
            setPausedBatchRetranslation({
              batchIndex: selectedBatchIndices[0] ?? firstBatchIndex,
              mode: batchItem.retranslateMode || "single",
              batchIndices: selectedBatchIndices,
              completedBatches: batchItem.completedBatches || 0,
              totalBatches:
                batchItem.totalBatches || selectedBatchIndices.length,
              translationId: batchItem.savedTranslationId,
            });
            setBatchRetranslateJob(null);
          } else if (batchItem.status === "translating") {
            // Active or waiting state - create a fake job to show UI
            setPausedBatchRetranslation(null);
            const isPresubMode = batchItem.batchSettings?.presubMode ?? false;
            const presubDuration =
              batchItem.batchSettings?.presubDuration ?? 120;
            const currentSelectionPosition = Math.min(
              batchItem.progress?.completed || 0,
              Math.max(selectedBatchIndices.length - 1, 0),
            );
            const currentBatchIndex =
              selectedBatchIndices[currentSelectionPosition] ?? firstBatchIndex;

            // Check if the translation has time range
            const translationRangeStart = targetTranslation?.rangeStart ?? 0;
            const translationRangeEnd =
              targetTranslation?.rangeEnd ??
              targetTranslation?.videoDuration ??
              batchItem.duration ??
              0;
            const isTimeRangeTranslation =
              targetTranslation?.rangeStart !== undefined ||
              targetTranslation?.rangeEnd !== undefined;

            // Calculate rangeStart and rangeEnd considering time range AND presub mode
            let rangeStart: number;
            let rangeEnd: number | undefined;

            if (isTimeRangeTranslation) {
              // Time range translation: batches are relative to translationRangeStart
              rangeStart =
                translationRangeStart +
                currentBatchIndex * batchDuration;
              rangeEnd = Math.min(
                translationRangeStart +
                  (currentBatchIndex + 1) * batchDuration,
                translationRangeEnd,
              );
            } else if (isPresubMode) {
              if (currentBatchIndex === 0) {
                rangeStart = 0;
                rangeEnd = Math.min(
                  presubDuration,
                  batchItem.duration || Infinity,
                );
              } else {
                rangeStart =
                  presubDuration +
                  (currentBatchIndex - 1) * batchDuration;
                rangeEnd = Math.min(
                  presubDuration + currentBatchIndex * batchDuration,
                  batchItem.duration || Infinity,
                );
              }
            } else {
              rangeStart = currentBatchIndex * batchDuration;
              rangeEnd = Math.min(
                (currentBatchIndex + 1) * batchDuration,
                batchItem.duration || Infinity,
              );
            }

            setBatchRetranslateJob({
              id: batchItem.id,
              videoUrl: batchItem.videoUrl,
              configName: batchItem.configName || "",
              status: batchItem.progress ? "processing" : "pending",
              progress: batchItem.progress
                ? {
                    currentBatch: batchItem.progress.completed + 1,
                    totalBatches: batchItem.progress.total,
                    completedBatches: batchItem.progress.completed,
                    status: "processing",
                    batchStatuses: [],
                  }
                : null,
              keyStatus: null,
              result: null,
              error: null,
              startedAt: batchItem.startedAt || Date.now(),
              completedAt: null,
              partialResult: null,
              rangeStart,
              rangeEnd,
              retranslateBatchIndex: selectedBatchIndices[0],
              retranslateMode: batchItem.retranslateMode,
              retranslateBatchIndices: selectedBatchIndices,
              isBatchRetranslation: true,
              existingTranslationId: batchItem.savedTranslationId, // Track which translation is being retranslated
            });
          }
        } else {
          setPausedBatchRetranslation(null);
          setRetranslatingTranslationId(null);
          // Only clear batchRetranslateJob if there's no active translation
          const currentJob = translationManager.getCurrentJob();
          if (!currentJob || currentJob.status !== "processing") {
            setBatchRetranslateJob(null);
          }
        }
      };

      // Check immediately
      checkBatchRetranslation();

      // Subscribe to queue changes
      unsubscribe = queueManager.subscribe(() => {
        checkBatchRetranslation();
      });
    };

    setupAndSubscribe();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [savedTranslations, videoUrl]);

  // Subscribe to translationManager to track batch retranslation
  useEffect(() => {
    if (!videoUrl) return;

    const currentVideoId = extractVideoId(videoUrl);

    // Check current job state immediately when component mounts
    const currentJob = translationManager.getCurrentJob();
    if (currentJob) {
      const jobVideoId = extractVideoId(currentJob.videoUrl);
      // Check if this is a batch retranslation (has isBatchRetranslation flag or retranslateBatchIndex)
      // Time range translation (rangeStart/rangeEnd without isBatchRetranslation) is NOT a batch job
      const isBatchJob =
        currentJob.isBatchRetranslation ||
        currentJob.retranslateBatchIndices?.length ||
        currentJob.retranslateBatchIndex !== undefined;
      if (
        jobVideoId === currentVideoId &&
        currentJob.status === "processing" &&
        isBatchJob
      ) {
        setBatchRetranslateJob(currentJob);
      }
    }

    const unsubscribe = translationManager.subscribe((job) => {
      const jobVideoId = extractVideoId(job.videoUrl);
      // Check if this is a batch retranslation for current video
      // Time range translation (rangeStart/rangeEnd without isBatchRetranslation) is NOT a batch job
      const isBatchJob =
        job.isBatchRetranslation ||
        job.retranslateBatchIndices?.length ||
        job.retranslateBatchIndex !== undefined;
      if (jobVideoId === currentVideoId && isBatchJob) {
        if (job.status === "processing") {
          setBatchRetranslateJob(job);
          // Clear paused state when job starts
          setPausedBatchRetranslation(null);
        } else if (job.status === "completed" || job.status === "error") {
          setBatchRetranslateJob(null);
          // Reload translations when batch retranslation completes
          if (job.status === "completed") {
            loadTranslations();
          }
        }
      }

      // Track time range for full translation (not batch retranslation)
      if (jobVideoId === currentVideoId && !isBatchJob) {
        if (job.status === "processing") {
          // Check if this is a time range translation
          if (job.rangeStart !== undefined || job.rangeEnd !== undefined) {
            setCurrentTimeRange({
              rangeStart: job.rangeStart,
              rangeEnd: job.rangeEnd,
            });
          } else {
            setCurrentTimeRange(null);
          }
        } else if (job.status === "completed" || job.status === "error") {
          setCurrentTimeRange(null);
        }
      }
    });
    return () => unsubscribe();
  }, [videoUrl, loadTranslations]);

  return {
    batchRetranslateJob,
    setBatchRetranslateJob,
    pausedBatchRetranslation,
    setPausedBatchRetranslation,
    retranslatingTranslationId,
    setRetranslatingTranslationId,
    currentTimeRange,
  };
}

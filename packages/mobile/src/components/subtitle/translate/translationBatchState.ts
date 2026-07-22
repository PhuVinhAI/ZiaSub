/**
 * Batch display-state derivation for SavedTranslationsList
 *
 * Tách từ SavedTranslationsList.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import type { SavedTranslation, TranslationJob } from "@src/types";
import type { BatchInfo } from "./translationListUtils";

export interface BatchDisplayState {
  isInRetranslationRange: boolean;
  isCompleted: boolean;
  isError: boolean;
  isProcessing: boolean;
  isPaused: boolean;
  isWaiting: boolean;
  isPresubBatch: boolean;
}

export interface BatchDisplayStateOptions {
  batchRetranslateJob?: TranslationJob | null;
  pausedBatchRetranslation?: {
    batchIndex: number;
    mode: "single" | "fromHere";
    translationId?: string;
  } | null;
  isWaitingInQueue: boolean;
}

/**
 * Compute the visual state of a single batch chip. Extracted verbatim from the
 * per-batch derivation block inside SavedTranslationsList's batches.map.
 */
export function getBatchDisplayState(
  batch: BatchInfo,
  item: SavedTranslation,
  opts: BatchDisplayStateOptions
): BatchDisplayState {
  const { batchRetranslateJob, pausedBatchRetranslation, isWaitingInQueue } =
    opts;

  // Get batch duration from translation settings
  const batchDuration = item.batchSettings?.maxVideoDuration || 600;

  // Calculate the starting batch index for retranslation
  const retranslateStartBatchIndex =
    batchRetranslateJob?.rangeStart !== undefined
      ? Math.floor(batchRetranslateJob.rangeStart / batchDuration)
      : pausedBatchRetranslation?.batchIndex ?? -1;

  // Check if this batch is in the retranslation range
  const isInRetranslationRange =
    (batchRetranslateJob?.rangeStart !== undefined &&
      batch.startTime >= batchRetranslateJob.rangeStart &&
      (batchRetranslateJob.rangeEnd === undefined ||
        batch.startTime < batchRetranslateJob.rangeEnd)) ||
    (pausedBatchRetranslation &&
      ((pausedBatchRetranslation.mode === "single" &&
        batch.index === pausedBatchRetranslation.batchIndex) ||
        (pausedBatchRetranslation.mode === "fromHere" &&
          batch.index >= pausedBatchRetranslation.batchIndex)));

  // Calculate relative batch index within retranslation range
  // e.g., if retranslating from batch 2, batch 2 is relative index 0, batch 3 is relative index 1
  const relativeBatchIndex = batch.index - retranslateStartBatchIndex;

  // Check if this batch has been completed during retranslation
  // Use progress.completedBatches to determine which batches are done
  // IMPORTANT: completedBatches from geminiService includes skipped batches,
  // so we need to subtract the number of skipped batches (retranslateStartBatchIndex)
  // to get the actual number of batches completed in this retranslation
  const actualCompletedInRetranslation =
    batchRetranslateJob?.progress?.completedBatches !== undefined
      ? Math.max(
          0,
          batchRetranslateJob.progress.completedBatches -
            retranslateStartBatchIndex
        )
      : 0;
  const completedInRetranslation =
    batchRetranslateJob?.progress?.completedBatches !== undefined &&
    relativeBatchIndex >= 0 &&
    relativeBatchIndex < actualCompletedInRetranslation;

  // Check if this batch is the one currently being processed
  const isCurrentlyProcessingBatch =
    batchRetranslateJob?.status === "processing" &&
    batchRetranslateJob?.progress?.completedBatches !== undefined &&
    relativeBatchIndex === actualCompletedInRetranslation;

  // Check if this batch is being retranslated (actively processing)
  // Only the current batch being processed should show as "processing"
  const isBatchRetranslating =
    isCurrentlyProcessingBatch && isInRetranslationRange;

  // Check if this batch retranslation is waiting in queue (not yet started)
  const isBatchRetranslationWaiting =
    batchRetranslateJob &&
    batchRetranslateJob.status !== "processing" &&
    batchRetranslateJob.rangeStart !== undefined &&
    batch.startTime >= batchRetranslateJob.rangeStart &&
    (batchRetranslateJob.rangeEnd === undefined ||
      batch.startTime < batchRetranslateJob.rangeEnd);

  // Check if this batch is paused (user explicitly paused)
  // For paused state, only show paused for batches that haven't been completed yet
  // Use actualCompletedInRetranslation which already accounts for skipped batches
  const pausedActualCompleted = pausedBatchRetranslation
    ? actualCompletedInRetranslation
    : 0;
  const isPausedAndNotCompleted =
    pausedBatchRetranslation && relativeBatchIndex >= pausedActualCompleted;
  const isBatchPaused =
    isPausedAndNotCompleted &&
    ((pausedBatchRetranslation?.mode === "single" &&
      batch.index === pausedBatchRetranslation.batchIndex) ||
      (pausedBatchRetranslation?.mode === "fromHere" &&
        batch.index >= pausedBatchRetranslation.batchIndex));

  // Check if this batch is waiting (video is waiting in queue for full translation)
  const isBatchWaitingFullTranslation =
    isWaitingInQueue && batch.status !== "completed";

  // Batch is completed if:
  // 1. It has completed status AND is NOT in retranslation range, OR
  // 2. It's in retranslation range but has been completed during retranslation
  const isCompleted =
    (batch.status === "completed" &&
      !isInRetranslationRange &&
      !isBatchWaitingFullTranslation) ||
    completedInRetranslation;
  const isError = batch.status === "error";
  const isProcessing = isBatchRetranslating;
  const isPaused =
    isBatchPaused &&
    !isProcessing &&
    !isBatchRetranslationWaiting &&
    !completedInRetranslation;
  const isWaiting =
    (isBatchWaitingFullTranslation ||
      (isBatchRetranslationWaiting && !completedInRetranslation)) &&
    !isProcessing &&
    !isPaused;

  // First batch in presub mode should be yellow (even when completed)
  // Check item.batchSettings?.presubMode for saved translation's presub state
  const isPresubTranslation = item.batchSettings?.presubMode ?? false;
  const isPresubBatch = isPresubTranslation && batch.index === 0;

  return {
    isInRetranslationRange: !!isInRetranslationRange,
    isCompleted: !!isCompleted,
    isError,
    isProcessing: !!isProcessing,
    isPaused: !!isPaused,
    isWaiting: !!isWaiting,
    isPresubBatch,
  };
}

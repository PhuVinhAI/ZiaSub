/**
 * Queue Item State Derivation
 *
 * Tách từ QueueItemCard.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import type { QueueItem } from "@src/types";
import { PRESET_PROMPTS } from "@constants/defaults";

export interface QueueItemState {
  hasRealProgress: boolean;
  isBatchRetranslation: boolean;
  isBatchRetranslationActive: boolean;
  isBatchRetranslationWaiting: boolean;
  isTimeRangeTranslation: boolean;
  isTimeRangeTranslationActive: boolean;
  isTimeRangeTranslationWaiting: boolean;
  isActivelyTranslating: boolean;
  isPaused: boolean;
  isWaitingInQueue: boolean;
  progressPercent: number;
  presetName: string | null;
  batchSettingsInfo: string | null;
  showProgressBar: boolean;
}

// Get preset name from presetId
const getPresetName = (presetId?: string): string | null => {
  if (!presetId) return null;
  const preset = PRESET_PROMPTS.find((p) => p.id === presetId);
  return preset?.nameVi || preset?.name || null;
};

// Format batch settings info
const getBatchSettingsInfo = (item: QueueItem): string | null => {
  const bs = item.batchSettings;
  if (!bs) return null;

  const parts: string[] = [];
  if (bs.maxVideoDuration) {
    const mins = Math.floor(bs.maxVideoDuration / 60);
    parts.push(`${mins}p`); // p = phút/part
  }
  if (bs.batchOffset !== undefined) {
    parts.push(`±${bs.batchOffset}s`);
  }
  // Chỉ hiện số batch cùng lúc nếu không phải streaming mode
  if (
    !bs.streamingMode &&
    bs.maxConcurrentBatches &&
    bs.maxConcurrentBatches > 1
  ) {
    parts.push(`x${bs.maxConcurrentBatches}`); // x2, x3 = số batch cùng lúc
  }
  if (bs.streamingMode) {
    parts.push("stream");
  }

  return parts.length > 0 ? parts.join(" • ") : null;
};

export const deriveQueueItemState = (item: QueueItem): QueueItemState => {
  const hasRealProgress = !!(item.progress && item.progress.total > 0);
  // Batch retranslation info
  const isBatchRetranslation = item.retranslateBatchIndex !== undefined;
  // Batch retranslation is actively translating only if it has progress (meaning API call started)
  // Without progress, it's waiting in queue
  const isBatchRetranslationActive = isBatchRetranslation && hasRealProgress;
  const isBatchRetranslationWaiting = isBatchRetranslation && !hasRealProgress;

  // Time range translation info (translate only specific time range x-y)
  // This is different from batch retranslation - it's a fresh translation of a specific time range
  const isTimeRangeTranslation =
    item.rangeStart !== undefined || item.rangeEnd !== undefined;
  const isTimeRangeTranslationActive =
    isTimeRangeTranslation && hasRealProgress;
  const isTimeRangeTranslationWaiting =
    isTimeRangeTranslation && !hasRealProgress;

  const isActivelyTranslating =
    item.status === "translating" &&
    (hasRealProgress ||
      isBatchRetranslationActive ||
      isTimeRangeTranslationActive);
  // Paused is now a separate status
  const isPaused = item.status === "paused";
  // Waiting in queue: either full translation waiting OR batch retranslation waiting OR time range waiting
  const isWaitingInQueue =
    item.status === "translating" &&
    !hasRealProgress &&
    !isBatchRetranslationActive &&
    !isTimeRangeTranslationActive;

  // Calculate progress percentage (only for full translation with progress, not batch retranslation)
  const progressPercent =
    isActivelyTranslating && hasRealProgress
      ? (item.progress!.completed / item.progress!.total) * 100
      : isPaused && item.totalBatches
      ? (item.completedBatches! / item.totalBatches) * 100
      : 0;

  const presetName = getPresetName(item.presetId);
  const batchSettingsInfo = getBatchSettingsInfo(item);

  // Show progress bar only when there's actual progress to show
  const showProgressBar =
    (isActivelyTranslating && hasRealProgress) || isPaused;

  return {
    hasRealProgress,
    isBatchRetranslation,
    isBatchRetranslationActive,
    isBatchRetranslationWaiting,
    isTimeRangeTranslation,
    isTimeRangeTranslationActive,
    isTimeRangeTranslationWaiting,
    isActivelyTranslating,
    isPaused,
    isWaitingInQueue,
    progressPercent,
    presetName,
    batchSettingsInfo,
    showProgressBar,
  };
};

export interface StatusStyle {
  color: string;
  onColor: string;
  icon:
    | "translate"
    | "pause"
    | "clock-outline"
    | "check-circle"
    | "alert-circle";
}

// Get status color and icon
export const getStatusStyle = (
  state: QueueItemState,
  colors: any,
  item: QueueItem
): StatusStyle => {
  const { isActivelyTranslating, isPaused, isWaitingInQueue } = state;
  if (isActivelyTranslating)
    return {
      color: colors.primary,
      onColor: colors.onPrimary,
      icon: "translate" as const,
    };
  if (isPaused)
    return {
      color: colors.warning,
      onColor: colors.onWarning,
      icon: "pause" as const,
    };
  if (isWaitingInQueue)
    return {
      color: colors.primary,
      onColor: colors.onPrimary,
      icon: "clock-outline" as const,
    };
  if (item.status === "completed")
    return {
      color: colors.success,
      onColor: colors.onSuccess,
      icon: "check-circle" as const,
    };
  if (item.status === "error")
    return {
      color: colors.error,
      onColor: colors.onError,
      icon: "alert-circle" as const,
    };
  return {
    color: colors.textMuted,
    onColor: colors.onPrimary,
    icon: "clock-outline" as const,
  }; // pending
};

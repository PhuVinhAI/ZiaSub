/**
 * Translation List Utilities — Formatting & Batch Info Helpers
 *
 * Tách từ SavedTranslationsList.tsx — chứa các hàm format (date, time),
 * BatchInfo interface, và logic tính batch info từ translation.
 * Chỉ di chuyển code, không sửa đổi logic.
 */
import type { SavedTranslation } from "@src/types";
import { parseSRT } from "@utils/srtParser";
import { PRESET_PROMPTS } from "@constants/defaults";

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export interface BatchInfo {
  index: number;
  startTime: number;
  endTime: number;
  subtitleCount: number;
  hasContent: boolean;
  status: "pending" | "completed" | "error";
}

/**
 * Calculate batches info for a translation.
 * Extracted from SavedTranslationsList's useMemo — same logic, standalone function.
 */
export const getBatchesInfo = (
  item: SavedTranslation,
  videoDuration?: number
): BatchInfo[] => {
  const duration = item.videoDuration || videoDuration || 0;
  // IMPORTANT: Use original batch settings from the translation
  // This ensures batch display matches how it was originally translated
  const batchDuration = item.batchSettings?.maxVideoDuration || 600;
  const batchOffset = item.batchSettings?.batchOffset ?? 60; // Default 60s tolerance
  // Presub mode: first batch uses shorter duration
  const isPresubTranslation = item.batchSettings?.presubMode ?? false;
  const presubDuration = item.batchSettings?.presubDuration ?? 120; // Default 2 minutes

  // Time range translation: use rangeStart/rangeEnd if available
  const rangeStart = item.rangeStart ?? 0;
  const rangeEnd = item.rangeEnd ?? duration;
  const isTimeRangeTranslation =
    item.rangeStart !== undefined || item.rangeEnd !== undefined;
  const effectiveRangeLength = rangeEnd - rangeStart;

  // If we have saved totalBatches and batchStatuses, use them directly
  // This handles cases where videoDuration might not be available
  if (item.totalBatches && item.totalBatches > 0 && item.batchStatuses) {
    const parsed = parseSRT(item.srtContent);
    const batches: BatchInfo[] = [];

    // Helper to calculate batch start time considering presub mode and time range
    const getBatchStart = (batchIndex: number) => {
      // For time range translation, start from rangeStart
      const baseStart = isTimeRangeTranslation ? rangeStart : 0;

      if (batchIndex === 0) return baseStart;
      if (isPresubTranslation && !isTimeRangeTranslation) {
        // First batch is presubDuration, rest are batchDuration
        return presubDuration + (batchIndex - 1) * batchDuration;
      }
      return baseStart + batchIndex * batchDuration;
    };

    // Helper to calculate batch end time considering presub mode and time range
    const getBatchEnd = (batchIndex: number) => {
      const effectiveEnd = isTimeRangeTranslation ? rangeEnd : duration;

      // The last batch always extends to the true end (video duration / range
      // end), mirroring geminiService's splitting which caps the final batch at
      // finalEnd. This also covers the single-batch tolerance case: when the
      // duration exceeds maxVideoDuration but stays within batchOffset, the
      // whole video is one batch, so its end must be the real duration
      // (e.g. 10:25) rather than the default maxVideoDuration (10:00).
      const isLastBatch = batchIndex === (item.totalBatches ?? 0) - 1;
      if (isLastBatch && effectiveEnd > 0) {
        return effectiveEnd;
      }

      if (
        isPresubTranslation &&
        batchIndex === 0 &&
        !isTimeRangeTranslation
      ) {
        return duration > 0
          ? Math.min(presubDuration, duration)
          : presubDuration;
      }
      const startTime = getBatchStart(batchIndex);
      const endTime = startTime + batchDuration;
      return effectiveEnd > 0 ? Math.min(endTime, effectiveEnd) : endTime;
    };

    for (let i = 0; i < item.totalBatches; i++) {
      const startTime = getBatchStart(i);
      const endTime = getBatchEnd(i);

      // Count subtitles in this batch
      const subtitlesInBatch = parsed.filter(
        (sub) => sub.startTime >= startTime && sub.startTime < endTime
      );

      batches.push({
        index: i,
        startTime,
        endTime,
        subtitleCount: subtitlesInBatch.length,
        hasContent: subtitlesInBatch.length > 0,
        status: item.batchStatuses[i] || "completed",
      });
    }

    return batches;
  }

  // Use effective range length for calculations
  const effectiveDuration = isTimeRangeTranslation
    ? effectiveRangeLength
    : duration;
  if (effectiveDuration <= 0) return [];

  // Apply tolerance: if duration <= batchDuration + batchOffset, it's a single batch
  // This matches the logic in geminiService.ts
  const effectiveMaxDuration = batchDuration + batchOffset;
  if (effectiveDuration <= effectiveMaxDuration) {
    // Single batch - fits within tolerance
    const parsed = parseSRT(item.srtContent);
    const savedStatus = item.batchStatuses?.[0];
    const hasContent = parsed.length > 0;

    return [
      {
        index: 0,
        startTime: rangeStart,
        endTime: rangeEnd,
        subtitleCount: parsed.length,
        hasContent,
        status: savedStatus || (hasContent ? "completed" : "pending"),
      },
    ];
  }

  const totalBatches = Math.ceil(effectiveDuration / batchDuration);
  const parsed = parseSRT(item.srtContent);
  const batches: BatchInfo[] = [];

  for (let i = 0; i < totalBatches; i++) {
    // For time range translation, start from rangeStart
    const startTime = rangeStart + i * batchDuration;
    const endTime = Math.min(
      rangeStart + (i + 1) * batchDuration,
      rangeEnd
    );

    // Count subtitles in this batch
    const subtitlesInBatch = parsed.filter(
      (sub) => sub.startTime >= startTime && sub.startTime < endTime
    );

    // Use saved batchStatuses if available, otherwise fallback to hasContent check
    const savedStatus = item.batchStatuses?.[i];
    const hasContent = subtitlesInBatch.length > 0;

    // Determine status: use saved status if available, otherwise infer from content
    let status: "pending" | "completed" | "error" = "pending";
    if (savedStatus) {
      status = savedStatus;
    } else if (hasContent) {
      // Fallback for old translations without batchStatuses
      status = "completed";
    }

    batches.push({
      index: i,
      startTime,
      endTime,
      subtitleCount: subtitlesInBatch.length,
      hasContent,
      status,
    });
  }

  return batches;
};

// Get preset name from presetId
export const getPresetName = (presetId?: string): string | null => {
  if (!presetId) return null;
  const preset = PRESET_PROMPTS.find((p) => p.id === presetId);
  return preset?.nameVi || preset?.name || null;
};

// Format batch settings info
export const getBatchSettingsInfo = (
  item: SavedTranslation
): string | null => {
  const bs = item.batchSettings;
  if (!bs) return null;

  const parts: string[] = [];
  if (bs.maxVideoDuration) {
    const mins = Math.floor(bs.maxVideoDuration / 60);
    parts.push(`${mins}p`);
  }
  if (bs.batchOffset !== undefined) {
    parts.push(`±${bs.batchOffset}s`);
  }
  if (
    !bs.streamingMode &&
    bs.maxConcurrentBatches &&
    bs.maxConcurrentBatches > 1
  ) {
    parts.push(`x${bs.maxConcurrentBatches}`);
  }
  if (bs.streamingMode) {
    parts.push("stream");
  }

  return parts.length > 0 ? parts.join(" • ") : null;
};

// Get progress percent for partial translations
export const getProgressPercent = (item: SavedTranslation): number => {
  if (!item.isPartial || !item.totalBatches) return 100;
  return Math.round(((item.completedBatches || 0) / item.totalBatches) * 100);
};

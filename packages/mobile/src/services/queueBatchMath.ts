/**
 * Queue Batch Range Math
 *
 * Tách từ queueManager.ts — chỉ di chuyển code, không sửa đổi logic.
 */

export interface BatchRangeInput {
  retranslateBatchIndex: number;
  batchDuration: number;
  isTimeRangeTranslation: boolean;
  translationRangeStart: number;
  translationRangeEnd: number;
  isPresubMode: boolean;
  presubDuration: number;
  itemDuration?: number;
}

/**
 * Compute batchStart/batchEnd for a batch retranslation, considering time-range
 * translation and presub mode. Pure function — extracted verbatim from
 * processItem's batch-retranslation branch.
 */
export function computeBatchRange(input: BatchRangeInput): {
  batchStart: number;
  batchEnd: number;
} {
  const {
    retranslateBatchIndex,
    batchDuration,
    isTimeRangeTranslation,
    translationRangeStart,
    translationRangeEnd,
    isPresubMode,
    presubDuration,
    itemDuration,
  } = input;

  let batchStart: number;
  let batchEnd: number;

  if (isTimeRangeTranslation) {
    // Time range translation: batches are relative to translationRangeStart
    batchStart = translationRangeStart + retranslateBatchIndex * batchDuration;
    batchEnd = Math.min(
      translationRangeStart + (retranslateBatchIndex + 1) * batchDuration,
      translationRangeEnd
    );
  } else if (isPresubMode) {
    if (retranslateBatchIndex === 0) {
      batchStart = 0;
      batchEnd = Math.min(presubDuration, itemDuration || Infinity);
    } else {
      batchStart = presubDuration + (retranslateBatchIndex - 1) * batchDuration;
      batchEnd = Math.min(
        presubDuration + retranslateBatchIndex * batchDuration,
        itemDuration || Infinity
      );
    }
  } else {
    batchStart = retranslateBatchIndex * batchDuration;
    batchEnd = Math.min(
      (retranslateBatchIndex + 1) * batchDuration,
      itemDuration || Infinity
    );
  }

  return { batchStart, batchEnd };
}

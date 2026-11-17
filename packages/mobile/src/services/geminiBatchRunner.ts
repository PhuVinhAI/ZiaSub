/**
 * Gemini Batch Runner — Concurrency & Streaming Utilities
 *
 * Tách từ geminiService.ts — chứa các hàm chạy batch (concurrent và sequential
 * streaming) với abort support và progress tracking.
 * Chỉ di chuyển code, không sửa đổi logic.
 */

// Run promises with concurrency limit - continues on error, collects partial results
export const runWithConcurrency = async <T>(
  tasks: (() => Promise<T>)[],
  maxConcurrent: number,
  onProgress?: (
    completed: number,
    total: number,
    statuses: Array<"pending" | "processing" | "completed" | "error">
  ) => void,
  abortSignal?: AbortSignal,
  onTaskComplete?: (
    result: T,
    index: number,
    completedIndices: number[],
  ) => void,
): Promise<{
  results: (T | null)[];
  hasErrors: boolean;
  errorMessage?: string;
  aborted?: boolean;
}> => {
  const results: (T | null)[] = new Array(tasks.length).fill(null);
  const statuses: Array<"pending" | "processing" | "completed" | "error"> =
    new Array(tasks.length).fill("pending");
  let currentIndex = 0;
  let completedCount = 0;
  let hasErrors = false;
  let lastError: string | undefined;
  let aborted = false;
  const completedIndices: number[] = [];

  const runNext = async (): Promise<void> => {
    // Check abort before starting next task
    if (abortSignal?.aborted) {
      aborted = true;
      return;
    }

    const index = currentIndex++;
    if (index >= tasks.length) return;

    statuses[index] = "processing";
    onProgress?.(completedCount, tasks.length, [...statuses]);

    try {
      // Check abort again before executing
      if (abortSignal?.aborted) {
        aborted = true;
        statuses[index] = "error";
        return;
      }

      // Each batch task uses keyManager.executeWithRetry internally
      // which handles retry + key rotation for that specific batch
      const result = await tasks[index]();
      results[index] = result;
      statuses[index] = "completed";
      completedCount++;
      completedIndices.push(index);
      onTaskComplete?.(result, index, [...completedIndices]);
    } catch (error: any) {
      // Check if aborted
      if (abortSignal?.aborted) {
        aborted = true;
        statuses[index] = "error";
        return;
      }

      // Only reaches here after all retries exhausted (executeWithRetry handles retries)
      statuses[index] = "error";
      hasErrors = true;
      lastError = error.message || "Có lỗi xảy ra";
      console.error(
        `[Gemini] Batch ${index + 1} failed after all retries:`,
        error.message
      );
    }

    onProgress?.(completedCount, tasks.length, [...statuses]);

    // Don't continue if aborted
    if (!abortSignal?.aborted) {
      await runNext();
    }
  };

  const workers = Array(Math.min(maxConcurrent, tasks.length))
    .fill(null)
    .map(() => runNext());

  await Promise.all(workers);
  return { results, hasErrors, errorMessage: lastError, aborted };
};

// Run batches sequentially for streaming mode - apply each result immediately
export const runSequentialStreaming = async <T>(
  tasks: (() => Promise<T>)[],
  onBatchComplete: (
    result: T,
    index: number,
    total: number,
    completedIndices: number[]
  ) => void,
  onProgress?: (
    completed: number,
    total: number,
    statuses: Array<"pending" | "processing" | "completed" | "error">
  ) => void,
  abortSignal?: AbortSignal,
  skipIndices?: number[]
): Promise<{
  results: (T | null)[];
  hasErrors: boolean;
  errorMessage?: string;
  aborted?: boolean;
  completedIndices: number[];
}> => {
  const results: (T | null)[] = new Array(tasks.length).fill(null);
  const statuses: Array<"pending" | "processing" | "completed" | "error"> =
    new Array(tasks.length).fill("pending");
  let hasErrors = false;
  let lastError: string | undefined;
  const completedIndices: number[] = [...(skipIndices || [])];

  // Mark skipped batches as completed
  for (const idx of skipIndices || []) {
    statuses[idx] = "completed";
  }

  for (let i = 0; i < tasks.length; i++) {
    // Skip already completed batches
    if (skipIndices?.includes(i)) {
      continue;
    }

    // Check abort before each batch
    if (abortSignal?.aborted) {
      console.log(`[Gemini] Aborted at batch ${i + 1}`);
      return {
        results,
        hasErrors,
        errorMessage: lastError,
        aborted: true,
        completedIndices,
      };
    }

    statuses[i] = "processing";
    onProgress?.(completedIndices.length, tasks.length, [...statuses]);

    try {
      const result = await tasks[i]();

      // Check abort after batch completes
      if (abortSignal?.aborted) {
        console.log(`[Gemini] Aborted after batch ${i + 1}`);
        return {
          results,
          hasErrors,
          errorMessage: lastError,
          aborted: true,
          completedIndices,
        };
      }

      results[i] = result;
      statuses[i] = "completed";
      completedIndices.push(i);
      // Immediately notify about completed batch for streaming
      onBatchComplete(result, i, tasks.length, completedIndices);
    } catch (error: any) {
      statuses[i] = "error";
      hasErrors = true;
      lastError = error.message || "Có lỗi xảy ra";
      console.error(`[Gemini] Batch ${i + 1} failed:`, error.message);
    }

    onProgress?.(completedIndices.length, tasks.length, [...statuses]);
  }

  return { results, hasErrors, errorMessage: lastError, completedIndices };
};

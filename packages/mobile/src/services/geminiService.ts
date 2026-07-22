import type {
  GeminiConfig,
  VideoTranslateOptions,
} from "@src/types";
import { DEFAULT_BATCH_SETTINGS } from "@constants/defaults";
import { mergeSrtContents, adjustSrtTimestamps } from "@utils/srtParser";
import { normalizeYouTubeUrl, isShortsUrl } from "@utils/videoUtils";
import { keyManager } from "./keyManager";
import { logger } from "./loggerService";
// Tách từ file này sang file riêng — chỉ import, không sửa logic
import {
  getEffectiveSystemPrompt,
  getThinkingConfig,
  supportsMediaResolution,
  getMediaResolution,
} from "./geminiModelConfig";
import {
  runWithConcurrency,
  runSequentialStreaming,
} from "./geminiBatchRunner";

// Translate a single video batch with automatic key rotation
const translateVideoBatch = async (
  videoUrl: string,
  config: GeminiConfig,
  startOffset?: string,
  endOffset?: string
): Promise<string> => {
  if (!videoUrl) {
    throw new Error("Video URL is required");
  }

  return keyManager.executeWithRetry(async (ai) => {
    const videoPart: any = {
      fileData: { fileUri: videoUrl, mimeType: "video/*" },
    };

    if (startOffset || endOffset) {
      videoPart.videoMetadata = {};
      if (startOffset) videoPart.videoMetadata.startOffset = startOffset;
      if (endOffset) videoPart.videoMetadata.endOffset = endOffset;
    }

    const contents = [
      {
        role: "user" as const,
        parts: [
          videoPart,
          { text: "Hãy tạo phụ đề SRT tiếng Việt cho video này." },
        ],
      },
    ];

    // Build config based on model capabilities
    const generateConfig: any = {
      temperature: config.temperature,
      systemInstruction: getEffectiveSystemPrompt(config),
      thinkingConfig: getThinkingConfig(
        config.model,
        config.thinkingLevel
      ),
    };

    // Only add mediaResolution if model supports it
    if (supportsMediaResolution(config.model)) {
      generateConfig.mediaResolution = getMediaResolution(
        config.mediaResolution
      );
    }

    const response = await ai.models.generateContent({
      model: config.model,
      contents,
      config: generateConfig,
    });

    if (!response || !response.text) {
      throw new Error("API không trả về kết quả");
    }

    return response.text;
  });
};

// Translate video directly from YouTube URL
export const translateVideoWithGemini = async (
  videoUrl: string,
  config: GeminiConfig,
  onChunk?: (text: string) => void,
  options?: VideoTranslateOptions
): Promise<string> => {
  if (!videoUrl) {
    throw new Error("Video URL is required");
  }

  if (!keyManager.hasAvailableKey()) {
    throw new Error("Thêm key trong Cài đặt trước nhé");
  }

  // Set key status callback
  if (options?.onKeyStatus) {
    keyManager.setStatusCallback(options.onKeyStatus);
  }

  const normalizedUrl = normalizeYouTubeUrl(videoUrl);
  if (!normalizedUrl) {
    throw new Error("Invalid video URL");
  }

  const isShorts = isShortsUrl(videoUrl);
  const batchSettings = options?.batchSettings || DEFAULT_BATCH_SETTINGS;
  const maxDuration = batchSettings.maxVideoDuration;
  const maxConcurrent = batchSettings.maxConcurrentBatches;
  const batchOffset = batchSettings.batchOffset ?? 60; // Default 60s tolerance
  const streamingMode = batchSettings.streamingMode ?? false;
  const presubMode = batchSettings.presubMode ?? false;
  const presubDuration = batchSettings.presubDuration ?? 120; // 2 minutes default

  // Use custom range if provided, otherwise use full video duration
  // rangeStart defaults to 0, rangeEnd defaults to videoDuration
  const rangeStart = options?.rangeStart ?? 0;
  const rangeEnd = options?.rangeEnd ?? options?.videoDuration;
  const effectiveDuration = rangeEnd
    ? rangeEnd - rangeStart
    : options?.videoDuration;

  logger.info("GeminiService", `Starting video translation for: ${normalizedUrl}`, {
    isShorts,
    apiKeyMasked: keyManager.getCurrentKeyMasked(),
    maxDuration,
    batchOffset,
    videoDuration: options?.videoDuration || "unknown",
    range: `${rangeStart} - ${rangeEnd || "end"}`,
    streamingMode,
    presubMode,
    model: config.model,
  });

  try {
    // Shorts videos are typically under 60 seconds, so skip batching for them
    // Check if we need to split into batches
    // Only split if effective duration exceeds (maxDuration + batchOffset) AND not a Shorts video
    const effectiveMaxDuration = maxDuration + batchOffset;
    const shouldSplit =
      !isShorts &&
      effectiveDuration &&
      effectiveDuration > effectiveMaxDuration;

    if (shouldSplit) {
      // Calculate batches with presub mode support
      // In presub mode, first batch uses presubDuration, rest use maxDuration
      const batchRanges: { start: number; end: number }[] = [];
      let currentPos = rangeStart;
      const finalEnd = rangeEnd || (options?.videoDuration ?? Infinity);

      while (currentPos < finalEnd) {
        const isFirstBatch = batchRanges.length === 0;
        const batchDuration =
          presubMode && isFirstBatch ? presubDuration : maxDuration;
        const batchEnd = Math.min(currentPos + batchDuration, finalEnd);
        batchRanges.push({ start: currentPos, end: batchEnd });
        currentPos = batchEnd;
      }

      const numBatches = batchRanges.length;
      console.log(`[Gemini] Splitting into ${numBatches} batches...`);
      if (presubMode) {
        console.log(
          `[Gemini] Presub mode: first batch ${presubDuration}s, rest ${maxDuration}s`
        );
      }

      const initialStatuses: Array<
        "pending" | "processing" | "completed" | "error"
      > = new Array(numBatches).fill("pending");

      options?.onBatchProgress?.({
        totalBatches: numBatches,
        completedBatches: 0,
        currentBatch: 0,
        status: "processing",
        batchStatuses: initialStatuses,
      });

      const batchTasks: (() => Promise<{
        content: string;
        offsetSeconds: number;
      }>)[] = [];

      for (let i = 0; i < numBatches; i++) {
        const { start: startSeconds, end: endSeconds } = batchRanges[i];
        const isFirstBatch = i === 0;
        // Use presub config for first batch if presub mode is enabled and config is provided
        const batchConfig =
          presubMode && isFirstBatch && options?.presubConfig
            ? options.presubConfig
            : config;

        console.log(
          `[Gemini] Batch ${i + 1}: ${startSeconds}s - ${endSeconds}s${
            isFirstBatch && presubMode && options?.presubConfig
              ? ` (using presub config: ${batchConfig.name})`
              : ""
          }`
        );

        batchTasks.push(() =>
          translateVideoBatch(
            normalizedUrl,
            batchConfig,
            `${startSeconds}s`,
            `${endSeconds}s`
          ).then((content) => ({ content, offsetSeconds: startSeconds }))
        );
      }

      // Calculate which batch indices to skip based on skipRanges
      const skipIndices: number[] = [];
      if (options?.skipRanges && options.skipRanges.length > 0) {
        for (let i = 0; i < batchRanges.length; i++) {
          const range = batchRanges[i];
          // Check if this range is already completed
          const isCompleted = options.skipRanges.some(
            (skip) => skip.start === range.start && skip.end === range.end
          );
          if (isCompleted) {
            skipIndices.push(i);
          }
        }
        console.log(
          `[Gemini] Resuming: skipping ${skipIndices.length} completed batches`
        );
      }

      let accumulatedResults: { content: string; offsetSeconds: number }[] = [];

      // If resuming with existing partial SRT, add it as the first "result"
      // Use offsetSeconds: -1 as a marker that this content already has correct absolute timestamps
      if (options?.existingPartialSrt) {
        accumulatedResults.push({
          content: options.existingPartialSrt,
          offsetSeconds: -1, // Special marker: already has absolute timestamps
        });
        console.log(`[Gemini] Resuming with existing partial SRT`);
      }

      // Use streaming mode (sequential) or concurrent mode based on settings
      if (streamingMode) {
        console.log("[Gemini] Using streaming mode (sequential batches)...");

        const { results, hasErrors, errorMessage, aborted, completedIndices } =
          await runSequentialStreaming(
            batchTasks,
            (result, index, total, allCompletedIndices) => {
              // Accumulate results and merge for streaming preview
              accumulatedResults.push(result);
              const partialSrt = mergeSrtContents([...accumulatedResults], options?.videoDuration);
              // Build completed ranges from indices
              const completedRanges = allCompletedIndices.map(
                (idx) => batchRanges[idx]
              );
              options?.onBatchComplete?.(
                partialSrt,
                index,
                total,
                completedRanges
              );
            },
            (completed, total, statuses) => {
              options?.onBatchProgress?.({
                totalBatches: total,
                completedBatches: completed,
                currentBatch:
                  statuses.filter((s) => s === "processing").length > 0
                    ? statuses.findIndex((s) => s === "processing") + 1
                    : completed,
                status: "processing",
                batchStatuses: statuses,
              });
            },
            options?.abortSignal,
            skipIndices
          );

        // Check if aborted
        if (aborted) {
          throw new Error("Đã dừng dịch");
        }

        const successfulResults = results.filter(
          (r): r is { content: string; offsetSeconds: number } => r !== null
        );

        if (successfulResults.length === 0 && skipIndices.length === 0) {
          throw new Error(errorMessage || "Không dịch được phần nào");
        }

        const finalStatuses = results.map((r, idx) =>
          r !== null || skipIndices.includes(idx) ? "completed" : "error"
        ) as Array<"completed" | "error">;

        options?.onBatchProgress?.({
          totalBatches: numBatches,
          completedBatches: completedIndices.length + skipIndices.length,
          currentBatch: numBatches,
          status: "completed",
          batchStatuses: finalStatuses,
        });

        // Use accumulatedResults which includes existing partial SRT + new results
        const mergedSrt = mergeSrtContents(accumulatedResults, options?.videoDuration);
        onChunk?.(mergedSrt);
        return mergedSrt;
      }

      // Concurrent mode (original behavior)
      // For concurrent mode, we need to handle skip ranges differently
      // Filter out tasks that should be skipped
      const tasksToRun = batchTasks.filter(
        (_, idx) => !skipIndices.includes(idx)
      );
      const taskIndexMap = batchTasks
        .map((_, idx) => idx)
        .filter((idx) => !skipIndices.includes(idx));

      if (tasksToRun.length === 0) {
        // All batches already completed
        console.log("[Gemini] All batches already completed (resume)");
        return "";
      }

      const {
        results: runResults,
        hasErrors,
        errorMessage,
        aborted,
      } = await runWithConcurrency(
        tasksToRun,
        maxConcurrent,
        (completed, total, statuses) => {
          options?.onBatchProgress?.({
            totalBatches: numBatches,
            completedBatches: completed + skipIndices.length,
            currentBatch:
              statuses.filter((s) => s === "processing").length > 0
                ? taskIndexMap[statuses.findIndex((s) => s === "processing")] +
                  1
                : completed + skipIndices.length,
            status: "processing",
            batchStatuses: batchTasks.map((_, idx) => {
              if (skipIndices.includes(idx)) return "completed";
              const runIdx = taskIndexMap.indexOf(idx);
              return runIdx >= 0 ? statuses[runIdx] : "pending";
            }),
          });
        },
        options?.abortSignal
      );

      // Check if aborted
      if (aborted) {
        throw new Error("Đã dừng dịch");
      }

      // Map results back to original indices
      const results: (typeof runResults)[0][] = new Array(
        batchTasks.length
      ).fill(null);
      runResults.forEach((result, runIdx) => {
        results[taskIndexMap[runIdx]] = result;
      });

      // Filter out failed batches (null results)
      const successfulResults = results.filter(
        (r): r is { content: string; offsetSeconds: number } => r !== null
      );

      if (successfulResults.length === 0 && skipIndices.length === 0) {
        // All batches failed
        throw new Error(errorMessage || "Không dịch được phần nào");
      }

      const finalStatuses = results.map((r, idx) =>
        r !== null || skipIndices.includes(idx) ? "completed" : "error"
      ) as Array<"completed" | "error">;

      if (hasErrors) {
        console.log(
          `[Gemini] ${
            successfulResults.length + skipIndices.length
          }/${numBatches} batches completed, merging partial SRT...`
        );
        options?.onBatchProgress?.({
          totalBatches: numBatches,
          completedBatches: successfulResults.length + skipIndices.length,
          currentBatch: numBatches,
          status: "completed",
          batchStatuses: finalStatuses,
        });
      } else {
        console.log("[Gemini] All batches completed, merging SRT...");
        options?.onBatchProgress?.({
          totalBatches: numBatches,
          completedBatches: numBatches,
          currentBatch: numBatches,
          status: "completed",
          batchStatuses: new Array(numBatches).fill("completed"),
        });
      }

      const mergedSrt = mergeSrtContents(successfulResults, options?.videoDuration);
      onChunk?.(mergedSrt);
      return mergedSrt;
    }

    // Check abort before single batch
    if (options?.abortSignal?.aborted) {
      throw new Error("Đã dừng dịch");
    }

    // Single batch translation (with custom range support)
    console.log("[Gemini] Single batch translation...");
    options?.onBatchProgress?.({
      totalBatches: 1,
      completedBatches: 0,
      currentBatch: 1,
      status: "processing",
      batchStatuses: ["processing"],
    });

    const startOffset =
      rangeStart > 0 ? `${rangeStart}s` : options?.startOffset;
    const endOffset = rangeEnd ? `${rangeEnd}s` : options?.endOffset;

    const result = await translateVideoBatch(
      normalizedUrl,
      config,
      startOffset,
      endOffset
    );

    // Check abort after single batch
    if (options?.abortSignal?.aborted) {
      throw new Error("Đã dừng dịch");
    }

    // Adjust timestamps if translating a custom range starting after 0
    // AI might return timestamps starting from 0 instead of rangeStart
    // Skip if caller will handle adjustment (e.g., replaceBatchInSrt)
    const adjustedResult =
      rangeStart > 0 && !options?.skipTimestampAdjust
        ? adjustSrtTimestamps(result, rangeStart)
        : result;

    options?.onBatchProgress?.({
      totalBatches: 1,
      completedBatches: 1,
      currentBatch: 1,
      status: "completed",
      batchStatuses: ["completed"],
    });

    // For single batch in streaming mode, also call onBatchComplete
    if (streamingMode) {
      const completedRanges =
        rangeStart !== undefined && rangeEnd !== undefined
          ? [{ start: rangeStart, end: rangeEnd }]
          : [{ start: 0, end: options?.videoDuration || 0 }];
      options?.onBatchComplete?.(adjustedResult, 0, 1, completedRanges);
    }

    onChunk?.(adjustedResult);
    return adjustedResult;
  } catch (error: any) {
    // Don't log error if user stopped translation
    const isUserStopped =
      error.message === "Đã dừng dịch" || options?.abortSignal?.aborted;
    if (!isUserStopped) {
      console.error("[Gemini] Error:", error);
    }
    options?.onBatchProgress?.({
      totalBatches: 1,
      completedBatches: 0,
      currentBatch: 0,
      status: "error",
      batchStatuses: ["error"],
    });
    throw error;
  } finally {
    // Clear callback when done
    keyManager.setStatusCallback(undefined);
  }
};

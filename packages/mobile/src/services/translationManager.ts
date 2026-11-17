import type {
  GeminiConfig,
  BatchSettings,
  BatchProgress,
  BatchStatus,
  TranslationJob,
  KeyStatusCallback,
  RetranslateBatchRange,
} from "@src/types";
import { saveTranslation, savePartialTranslation } from "@utils/storage";
import { translateVideoWithGemini } from "./geminiService";
import { notificationService } from "./notificationService";
import { backgroundService } from "./backgroundService";
import { logger } from "./loggerService";
import {
  TranslationJobStore,
  createJobId,
  type TranslationListener,
} from "./translationJobStore";

class TranslationManager {
  private static instance: TranslationManager;
  private store = new TranslationJobStore();
  private abortController: AbortController | null = null;
  private abortedJobIds = new Set<string>();

  // Proxy current job through the store so all method bodies below are unchanged.
  private get currentJob(): TranslationJob | null {
    return this.store.currentJob;
  }
  private set currentJob(job: TranslationJob | null) {
    this.store.currentJob = job;
  }

  private constructor() {}

  static getInstance(): TranslationManager {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager();
    }
    return TranslationManager.instance;
  }

  subscribe(listener: TranslationListener): () => void {
    return this.store.subscribe(listener);
  }

  private notify() {
    this.store.notify();
  }

  getCurrentJob(): TranslationJob | null {
    return this.currentJob;
  }

  isTranslating(): boolean {
    return this.currentJob?.status === "processing";
  }

  isTranslatingUrl(videoUrl: string): boolean {
    return (
      this.currentJob?.videoUrl === videoUrl &&
      this.currentJob?.status === "processing"
    );
  }

  getJobForUrl(videoUrl: string): TranslationJob | null {
    if (this.currentJob?.videoUrl === videoUrl) {
      return this.currentJob;
    }
    return null;
  }

  async startTranslation(
    videoUrl: string,
    config: GeminiConfig,
    videoDuration?: number,
    batchSettings?: BatchSettings,
    rangeStart?: number,
    rangeEnd?: number,
    resumeData?: {
      partialSrt: string;
      completedBatchRanges: Array<{ start: number; end: number }>;
      existingTranslationId?: string;
    },
    presubConfig?: GeminiConfig,
    options?: {
      skipBackgroundControl?: boolean; // true khi gọi từ queue - queue tự quản lý background
      skipNotification?: boolean; // true khi gọi từ queue - queue tự gửi notification
    }
  ): Promise<string> {
    if (this.isTranslatingUrl(videoUrl)) {
      throw new Error("Video này đang dịch rồi");
    }

    if (this.isTranslating()) {
      throw new Error("Đang dịch video khác, vui lòng đợi hoặc dừng trước");
    }

    const abortController = new AbortController();
    this.abortController = abortController;

    // Start background service để giữ app chạy khi ở background
    // Skip nếu được gọi từ queue (queue tự quản lý background)
    const skipBackgroundControl = options?.skipBackgroundControl ?? false;
    const skipNotification = options?.skipNotification ?? false;
    if (!skipBackgroundControl) {
      await backgroundService.onTranslationStart(config.name);
    }

    const jobId = createJobId();
    logger.info(
      "TranslationManager",
      `Starting translation job ${jobId} for: ${videoUrl}`,
      {
        configName: config.name,
        model: config.model,
        videoDuration,
        rangeStart,
        rangeEnd,
        presubMode: !!presubConfig,
      }
    );

    this.currentJob = {
      id: jobId,
      videoUrl,
      configName: config.name,
      configId: config.id,
      presetId: config.presetId,
      status: "processing",
      progress: null,
      keyStatus: null,
      result: null,
      error: null,
      startedAt: Date.now(),
      completedAt: null,
      partialResult: resumeData?.partialSrt || null,
      rangeStart,
      rangeEnd,
      videoDuration,
      batchSettings,
      completedBatchRanges: resumeData?.completedBatchRanges || [],
      existingTranslationId: resumeData?.existingTranslationId,
    };
    this.notify();

    const onKeyStatus: KeyStatusCallback = (status) => {
      if (
        this.currentJob &&
        this.currentJob.id === jobId &&
        !this.abortedJobIds.has(jobId)
      ) {
        this.currentJob = {
          ...this.currentJob,
          keyStatus: status.message,
        };
        this.notify();
      }
    };

    // Track completed ranges for resume support
    let completedRanges: Array<{ start: number; end: number }> =
      resumeData?.completedBatchRanges || [];
    let accumulatedSrt = resumeData?.partialSrt || "";
    let currentBatchStatuses: Array<"pending" | "completed" | "error"> = [];

    try {
      const result = await translateVideoWithGemini(
        videoUrl,
        config,
        undefined,
        {
          videoDuration,
          batchSettings,
          rangeStart,
          rangeEnd,
          abortSignal: abortController.signal,
          skipRanges: resumeData?.completedBatchRanges,
          existingPartialSrt: resumeData?.partialSrt,
          presubConfig,
          onBatchProgress: (progress: BatchProgress) => {
            if (
              this.currentJob &&
              this.currentJob.id === jobId &&
              !this.abortedJobIds.has(jobId)
            ) {
              const pct = Math.round((progress.currentBatch / Math.max(1, progress.totalBatches)) * 100);
              logger.debug(
                "TranslationManager",
                `Progress: Batch ${progress.currentBatch}/${progress.totalBatches} (${pct}%)`
              );
              // Update batch statuses from progress
              currentBatchStatuses = progress.batchStatuses.map((s) =>
                s === "processing"
                  ? ("pending" as const)
                  : (s as "pending" | "completed" | "error")
              );
              this.currentJob = {
                ...this.currentJob,
                progress,
                batchStatuses: currentBatchStatuses,
              };
              this.notify();

              // Update background notification progress
              backgroundService.updateProgress(
                progress.currentBatch,
                progress.totalBatches,
                config.name
              );
            }
          },
          onKeyStatus,
          onBatchComplete: (
            partialSrt: string,
            batchIndex: number,
            totalBatches: number,
            newCompletedRanges: Array<{ start: number; end: number }>
          ) => {
            if (
              this.currentJob &&
              this.currentJob.id === jobId &&
              !this.abortedJobIds.has(jobId)
            ) {
              logger.info(
                "TranslationManager",
                `Batch ${batchIndex + 1}/${totalBatches} completed successfully`
              );
              accumulatedSrt = partialSrt;
              completedRanges = newCompletedRanges;
              // Update batch statuses - mark completed batch
              if (currentBatchStatuses.length === 0) {
                currentBatchStatuses = Array(totalBatches).fill("pending");
              }
              currentBatchStatuses[batchIndex] = "completed";
              this.currentJob = {
                ...this.currentJob,
                partialResult: partialSrt,
                completedBatchRanges: newCompletedRanges,
                batchStatuses: [...currentBatchStatuses],
              };
              this.notify();

              // Gửi notification khi dịch xong từng phần
              // Skip nếu được gọi từ queue (queue tự gửi notification)
              if (!skipNotification) {
                notificationService.notifyBatchComplete(
                  config.name,
                  batchIndex + 1,
                  totalBatches,
                  "direct"
                );
              }
            }
          },
        }
      );

      if (
        this.abortedJobIds.has(jobId) ||
        this.currentJob?.id !== jobId
      ) {
        throw new Error("Đã dừng dịch");
      }

      await saveTranslation(
        videoUrl,
        result,
        config.name,
        resumeData?.existingTranslationId,
        config.presetId,
        {
          videoDuration: this.currentJob?.videoDuration,
          batchSettings: this.currentJob?.batchSettings as BatchSettings,
          totalBatches: this.currentJob?.progress?.totalBatches,
          batchStatuses:
            currentBatchStatuses.length > 0 ? currentBatchStatuses : undefined,
          // Pass time range if this was a time range translation
          rangeStart: this.currentJob?.rangeStart,
          rangeEnd: this.currentJob?.rangeEnd,
        }
      );

      if (
        this.currentJob &&
        this.currentJob.id === jobId &&
        !this.abortedJobIds.has(jobId)
      ) {
        const elapsedSec = Math.round((Date.now() - (this.currentJob.startedAt || Date.now())) / 1000);
        logger.info(
          "TranslationManager",
          `Translation COMPLETED successfully for ${videoUrl}. Duration: ${elapsedSec}s`
        );
        this.currentJob = {
          ...this.currentJob,
          status: "completed",
          result,
          partialResult: null,
          keyStatus: null,
          completedAt: Date.now(),
          completedBatchRanges: [],
        };
        this.notify();

        // Gửi notification khi dịch xong
        // Skip nếu được gọi từ queue (queue tự gửi notification)
        if (!skipNotification) {
          notificationService.notifyTranslationComplete(config.name, "direct");
        }
      }

      return result;
    } catch (error: any) {
      // If aborted, partial was already saved in abortTranslation()
      // Only save here if it's a real error (not user abort) and not skipping save
      const isCurrentJob = this.currentJob?.id === jobId;
      const wasAborted = this.abortedJobIds.has(jobId);
      if (isCurrentJob && !wasAborted) {
        const hasPartialResult = accumulatedSrt && completedRanges.length > 0;

        if (hasPartialResult && this.currentJob) {
          try {
            await savePartialTranslation(
              videoUrl,
              accumulatedSrt,
              config.name,
              {
                completedBatches: completedRanges.length,
                totalBatches: this.currentJob.progress?.totalBatches || 0,
                rangeStart,
                rangeEnd,
                videoDuration,
                batchSettings,
                completedBatchRanges: completedRanges,
                batchStatuses: currentBatchStatuses,
                presetId: config.presetId,
                existingTranslationId: resumeData?.existingTranslationId, // Pass existing ID for batch retranslation
              }
            );
            console.log(
              "[TranslationManager] Saved partial on error:",
              completedRanges.length,
              "batches"
            );
          } catch (saveError) {
            console.error(
              "[TranslationManager] Failed to save partial:",
              saveError
            );
          }
        }

        // Update job status for real errors
        if (this.currentJob && this.currentJob.id === jobId) {
          logger.error(
            "TranslationManager",
            `Translation FAILED for ${videoUrl}: ${error.message || error}`,
            error
          );
          this.currentJob = {
            ...this.currentJob,
            status: "error",
            error: error.message || "Có lỗi xảy ra",
            completedAt: Date.now(),
            partialResult: accumulatedSrt || null,
            completedBatchRanges: completedRanges,
          };
          this.notify();

          // Gửi notification khi lỗi
          // Skip nếu được gọi từ queue (queue tự gửi notification)
          if (!skipNotification) {
            notificationService.notifyTranslationError(
              config.name,
              error.message,
              "direct"
            );
          }
        }
      }
      // If aborted, job status was already updated in abortTranslation()

      throw error;
    } finally {
      const isCurrentJob = this.currentJob?.id === jobId;
      if (this.abortController === abortController) {
        this.abortController = null;
      }
      // Stop background service khi dịch xong (dù thành công hay lỗi)
      // Skip nếu được gọi từ queue (queue tự quản lý background)
      if (
        !skipBackgroundControl &&
        (isCurrentJob || this.currentJob?.status !== "processing")
      ) {
        backgroundService.onTranslationComplete();
      }
      this.abortedJobIds.delete(jobId);
    }
  }

  clearCompletedJob(videoUrl?: string) {
    if (
      this.currentJob &&
      (this.currentJob.status === "completed" ||
        this.currentJob.status === "error")
    ) {
      if (!videoUrl || this.currentJob.videoUrl === videoUrl) {
        this.currentJob = null;
        this.notify();
      }
    }
  }

  async abortTranslation(
    videoUrl?: string,
    options?: {
      skipSavePartial?: boolean; // true khi xoá bản dịch - không cần lưu partial
    }
  ): Promise<{
    aborted: boolean;
    partialResult?: string;
    completedRanges?: Array<{ start: number; end: number }>;
  }> {
    if (!this.currentJob || this.currentJob.status !== "processing") {
      return { aborted: false };
    }

    if (videoUrl && this.currentJob.videoUrl !== videoUrl) {
      return { aborted: false };
    }

    const job = this.currentJob;
    this.abortedJobIds.add(job.id);

    const partialResult = job.partialResult || undefined;
    const completedRanges = job.completedBatchRanges || [];
    const batchStatuses = job.batchStatuses || [];
    const presetId = job.presetId;
    const existingTranslationId = job.existingTranslationId;
    const hasPartial = partialResult && completedRanges.length > 0;

    // Save partial translation IMMEDIATELY (don't wait for catch block)
    // Skip if explicitly requested (e.g., when deleting translation)
    if (hasPartial && !options?.skipSavePartial) {
      try {
        await savePartialTranslation(
          job.videoUrl,
          partialResult,
          job.configName,
          {
            completedBatches: completedRanges.length,
            totalBatches: job.progress?.totalBatches || 0,
            rangeStart: job.rangeStart,
            rangeEnd: job.rangeEnd,
            videoDuration: job.videoDuration,
            batchSettings: job.batchSettings as any,
            completedBatchRanges: completedRanges,
            batchStatuses,
            presetId,
            existingTranslationId, // Pass existing ID for batch retranslation
          }
        );
      } catch (saveError) {
        console.error(
          "[TranslationManager] Failed to save partial:",
          saveError
        );
      }
    }

    // Abort the signal (this will eventually trigger catch block, but we don't wait)
    const abortController = this.abortController;
    if (abortController) {
      try {
        abortController.abort();
      } catch (abortError) {
        // Ignore abort errors
      }
      if (this.abortController === abortController) {
        this.abortController = null;
      }
    }

    // Update job status and notify IMMEDIATELY
    if (this.currentJob?.id === job.id) {
      this.currentJob = {
        ...this.currentJob,
        status: "error",
        error: hasPartial
          ? `Đã dừng (${completedRanges.length} phần đã dịch)`
          : "Đã dừng dịch",
        completedAt: Date.now(),
      };
    }

    try {
      this.notify();
    } catch (notifyError) {
      // Ignore notify errors - subscribers may have stale references
    }

    return { aborted: true, partialResult, completedRanges };
  }

  canAbort(videoUrl?: string): boolean {
    if (!this.currentJob || this.currentJob.status !== "processing") {
      return false;
    }
    if (videoUrl && this.currentJob.videoUrl !== videoUrl) {
      return false;
    }
    return true;
  }

  // Get partial result for a video (for resume)
  getPartialResult(videoUrl: string): {
    partialSrt: string;
    completedRanges: Array<{ start: number; end: number }>;
  } | null {
    if (
      this.currentJob?.videoUrl === videoUrl &&
      this.currentJob.partialResult
    ) {
      return {
        partialSrt: this.currentJob.partialResult,
        completedRanges: this.currentJob.completedBatchRanges || [],
      };
    }
    return null;
  }

  // Retranslate arbitrary batches and merge each result into its exact time range.
  async translateSelectedBatches(
    videoUrl: string,
    config: GeminiConfig,
    existingSrt: string,
    batches: RetranslateBatchRange[],
    videoDuration?: number,
    existingTranslationId?: string,
    options?: {
      batchSettings?: BatchSettings;
      translationTotalBatches?: number;
      translationBatchStatuses?: BatchStatus[];
      initialCompletedBatches?: number;
      completedRanges?: Array<{ start: number; end: number }>;
      allBatchIndices?: number[];
      skipBackgroundControl?: boolean;
      skipNotification?: boolean;
    },
  ): Promise<string> {
    if (this.isTranslating()) {
      throw new Error("Đang dịch video khác, vui lòng đợi hoặc dừng trước");
    }

    const normalizedBatches = [
      ...new Map(
        batches
          .filter((batch) => batch.end > batch.start)
          .map((batch) => [batch.index, batch] as const),
      ).values(),
    ].sort((a, b) => a.index - b.index);
    if (normalizedBatches.length === 0) {
      throw new Error("Chưa chọn batch cần dịch lại");
    }

    const abortController = new AbortController();
    this.abortController = abortController;
    const skipBackgroundControl = options?.skipBackgroundControl ?? false;
    const skipNotification = options?.skipNotification ?? false;

    if (!skipBackgroundControl) {
      await backgroundService.onTranslationStart(config.name);
    }

    const initialCompleted = Math.max(
      0,
      options?.initialCompletedBatches ?? 0,
    );
    const allBatchIndices =
      options?.allBatchIndices?.length
        ? [...options.allBatchIndices].sort((a, b) => a - b)
        : normalizedBatches.map((batch) => batch.index);
    const totalSelected = Math.max(
      allBatchIndices.length,
      initialCompleted + normalizedBatches.length,
    );
    const initialStatuses: BatchProgress["batchStatuses"] = Array.from(
      { length: totalSelected },
      (_, index) => (index < initialCompleted ? "completed" : "pending"),
    );
    if (initialCompleted < totalSelected) {
      initialStatuses[initialCompleted] = "processing";
    }

    const jobId = createJobId();
    let workingSrt = existingSrt;
    let completedRanges = [...(options?.completedRanges || [])];
    const workingTranslationStatuses = options?.translationBatchStatuses
      ? [...options.translationBatchStatuses]
      : options?.translationTotalBatches
        ? Array.from(
            { length: options.translationTotalBatches },
            () => "completed" as BatchStatus,
          )
        : undefined;

    this.currentJob = {
      id: jobId,
      videoUrl,
      configName: config.name,
      configId: config.id,
      presetId: config.presetId,
      status: "processing",
      progress: {
        currentBatch: Math.min(initialCompleted + 1, totalSelected),
        totalBatches: totalSelected,
        completedBatches: initialCompleted,
        status: "processing",
        batchStatuses: initialStatuses,
      },
      keyStatus: null,
      result: null,
      error: null,
      startedAt: Date.now(),
      completedAt: null,
      partialResult: initialCompleted > 0 ? workingSrt : null,
      rangeStart: normalizedBatches[0].start,
      rangeEnd: normalizedBatches[normalizedBatches.length - 1].end,
      videoDuration,
      batchSettings: options?.batchSettings,
      completedBatchRanges: completedRanges,
      batchStatuses: workingTranslationStatuses,
      existingTranslationId,
      retranslateBatchIndices: allBatchIndices,
      isBatchRetranslation: true,
    };
    this.notify();

    const onKeyStatus: KeyStatusCallback = (status) => {
      if (
        this.currentJob?.id === jobId &&
        !this.abortedJobIds.has(jobId)
      ) {
        this.currentJob = { ...this.currentJob, keyStatus: status.message };
        this.notify();
      }
    };

    try {
      const { replaceBatchInSrt } = await import("@utils/srtParser");

      for (let position = 0; position < normalizedBatches.length; position++) {
        const batch = normalizedBatches[position];
        const progressIndex = initialCompleted + position;

        if (
          this.abortedJobIds.has(jobId) ||
          this.currentJob?.id !== jobId
        ) {
          throw new Error("Đã dừng dịch");
        }

        const batchStatuses = Array.from(
          { length: totalSelected },
          (_, index) =>
            index < progressIndex
              ? ("completed" as const)
              : index === progressIndex
                ? ("processing" as const)
                : ("pending" as const),
        );
        this.currentJob = {
          ...this.currentJob,
          rangeStart: batch.start,
          rangeEnd: batch.end,
          progress: {
            currentBatch: progressIndex + 1,
            totalBatches: totalSelected,
            completedBatches: progressIndex,
            status: "processing",
            batchStatuses,
          },
        };
        this.notify();

        const newBatchSrt = await translateVideoWithGemini(
          videoUrl,
          config,
          undefined,
          {
            videoDuration,
            rangeStart: batch.start,
            rangeEnd: batch.end,
            abortSignal: abortController.signal,
            onKeyStatus,
            skipTimestampAdjust: true,
          },
        );

        if (
          this.abortedJobIds.has(jobId) ||
          this.currentJob?.id !== jobId
        ) {
          throw new Error("Đã dừng dịch");
        }

        workingSrt = replaceBatchInSrt(
          workingSrt,
          newBatchSrt,
          batch.start,
          batch.end,
          videoDuration,
        );
        completedRanges = [
          ...completedRanges,
          { start: batch.start, end: batch.end },
        ];
        if (workingTranslationStatuses) {
          workingTranslationStatuses[batch.index] = "completed";
        }

        await saveTranslation(
          videoUrl,
          workingSrt,
          config.name,
          existingTranslationId,
          config.presetId,
          {
            videoDuration,
            batchSettings: options?.batchSettings,
            totalBatches: options?.translationTotalBatches,
            batchStatuses: workingTranslationStatuses,
          },
        );

        const completed = progressIndex + 1;
        const completedStatuses: BatchProgress["batchStatuses"] = Array.from(
          { length: totalSelected },
          (_, index) =>
            index < completed
              ? "completed"
              : index === completed
                ? "processing"
                : "pending",
        );
        this.currentJob = {
          ...this.currentJob,
          partialResult: workingSrt,
          completedBatchRanges: completedRanges,
          batchStatuses: workingTranslationStatuses,
          progress: {
            currentBatch: Math.min(completed + 1, totalSelected),
            totalBatches: totalSelected,
            completedBatches: completed,
            status: completed === totalSelected ? "completed" : "processing",
            batchStatuses: completedStatuses,
          },
        };
        this.notify();
      }

      if (
        this.currentJob?.id === jobId &&
        !this.abortedJobIds.has(jobId)
      ) {
        this.currentJob = {
          ...this.currentJob,
          status: "completed",
          result: workingSrt,
          partialResult: workingSrt,
          keyStatus: null,
          completedAt: Date.now(),
        };
        this.notify();

        if (!skipNotification) {
          notificationService.notifyTranslationComplete(config.name, "direct");
        }
      }

      return workingSrt;
    } catch (error: any) {
      if (
        !this.abortedJobIds.has(jobId) &&
        this.currentJob?.id === jobId
      ) {
        this.currentJob = {
          ...this.currentJob,
          status: "error",
          error: error.message || "Có lỗi xảy ra",
          partialResult: workingSrt,
          completedBatchRanges: completedRanges,
          completedAt: Date.now(),
        };
        this.notify();

        if (!skipNotification) {
          notificationService.notifyTranslationError(
            config.name,
            error.message,
            "direct",
          );
        }
      }
      throw error;
    } finally {
      const isCurrentJob = this.currentJob?.id === jobId;
      if (this.abortController === abortController) {
        this.abortController = null;
      }
      if (
        !skipBackgroundControl &&
        (isCurrentJob || this.currentJob?.status !== "processing")
      ) {
        backgroundService.onTranslationComplete();
      }
      this.abortedJobIds.delete(jobId);
    }
  }

  // Translate a single batch and replace in existing SRT
  async translateSingleBatch(
    videoUrl: string,
    config: GeminiConfig,
    existingSrt: string,
    batchStart: number,
    batchEnd: number,
    videoDuration?: number,
    existingTranslationId?: string
  ): Promise<string> {
    if (this.isTranslating()) {
      throw new Error("Đang dịch video khác, vui lòng đợi hoặc dừng trước");
    }

    const abortController = new AbortController();
    this.abortController = abortController;

    // Start background service
    await backgroundService.onTranslationStart(config.name);

    const jobId = createJobId();
    this.currentJob = {
      id: jobId,
      videoUrl,
      configName: config.name,
      configId: config.id,
      status: "processing",
      progress: {
        currentBatch: 1,
        totalBatches: 1,
        completedBatches: 0,
        status: "processing",
        batchStatuses: ["processing"],
      },
      keyStatus: null,
      result: null,
      error: null,
      startedAt: Date.now(),
      completedAt: null,
      partialResult: null,
      rangeStart: batchStart,
      rangeEnd: batchEnd,
      videoDuration,
      batchSettings: undefined,
      completedBatchRanges: [],
      existingTranslationId,
      isBatchRetranslation: true, // Flag to indicate this is a batch retranslation
    };
    this.notify();

    const onKeyStatus: KeyStatusCallback = (status) => {
      if (
        this.currentJob &&
        this.currentJob.id === jobId &&
        !this.abortedJobIds.has(jobId)
      ) {
        this.currentJob = {
          ...this.currentJob,
          keyStatus: status.message,
        };
        this.notify();
      }
    };

    try {
      // Translate only this batch
      // Skip timestamp adjustment here - replaceBatchInSrt will handle it
      const newBatchSrt = await translateVideoWithGemini(
        videoUrl,
        config,
        undefined,
        {
          videoDuration,
          rangeStart: batchStart,
          rangeEnd: batchEnd,
          abortSignal: abortController.signal,
          onKeyStatus,
          skipTimestampAdjust: true, // replaceBatchInSrt will adjust timestamps
        }
      );

      if (
        this.abortedJobIds.has(jobId) ||
        this.currentJob?.id !== jobId
      ) {
        throw new Error("Đã dừng dịch");
      }

      // Replace this batch in existing SRT (also cleans up subtitles exceeding video duration)
      const { replaceBatchInSrt } = await import("@utils/srtParser");
      const updatedSrt = replaceBatchInSrt(
        existingSrt,
        newBatchSrt,
        batchStart,
        batchEnd,
        videoDuration // Pass video duration to clean up out-of-range subtitles
      );

      // Save translation - update existing if ID provided, otherwise create new
      await saveTranslation(
        videoUrl,
        updatedSrt,
        config.name,
        existingTranslationId,
        config.presetId,
        {
          videoDuration,
        }
      );

      if (
        this.currentJob &&
        this.currentJob.id === jobId &&
        !this.abortedJobIds.has(jobId)
      ) {
        this.currentJob = {
          ...this.currentJob,
          status: "completed",
          result: updatedSrt,
          keyStatus: null,
          completedAt: Date.now(),
        };
        this.notify();

        // Gửi notification khi dịch xong batch
        notificationService.notifyTranslationComplete(config.name, "direct");
      }

      return updatedSrt;
    } catch (error: any) {
      if (
        !this.abortedJobIds.has(jobId) &&
        this.currentJob &&
        this.currentJob.id === jobId
      ) {
        this.currentJob = {
          ...this.currentJob,
          status: "error",
          error: error.message || "Có lỗi xảy ra",
          completedAt: Date.now(),
        };
        this.notify();

        // Gửi notification khi lỗi
        notificationService.notifyTranslationError(
          config.name,
          error.message,
          "direct"
        );
      }
      throw error;
    } finally {
      const isCurrentJob = this.currentJob?.id === jobId;
      if (this.abortController === abortController) {
        this.abortController = null;
      }
      // Stop background service
      // Skip nếu được gọi từ queue (queue tự quản lý background)
      if (isCurrentJob || this.currentJob?.status !== "processing") {
        backgroundService.onTranslationComplete();
      }
      this.abortedJobIds.delete(jobId);
    }
  }
}

export const translationManager = TranslationManager.getInstance();

/**
 * Queue Selectors & Pure Helpers
 *
 * Tách từ queueManager.ts — chỉ di chuyển code, không sửa đổi logic.
 * Các hàm thuần: nhận danh sách items làm tham số, không đọc/ghi state.
 */
import type { QueueItem, QueueStatus } from "@src/types";
import { PAGE_SIZE, extractVideoId } from "./queueUtils";

// Create a new QueueItem id — matches the two inline call sites verbatim
export const createQueueItemId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Reset stuck "translating" items to "paused" on app restart — they were
 * interrupted and can be resumed later. Keeps all existing data.
 */
export function migrateStuckTranslatingItems(items: QueueItem[]): QueueItem[] {
  return items.map((item) => {
    if (item.status === "translating") {
      return {
        ...item,
        status: "paused" as QueueStatus,
        completedBatches: item.completedBatches ?? 0,
      };
    }
    return item;
  });
}

// Get items by status with pagination
export function getItemsByStatus(
  items: QueueItem[],
  status: QueueStatus | "all",
  page: number = 1
): { items: QueueItem[]; total: number; totalPages: number } {
  let filtered =
    status === "all" ? items : items.filter((i) => i.status === status);

  // Sort by time
  filtered.sort((a, b) => {
    if (status === "completed")
      return (b.completedAt || 0) - (a.completedAt || 0);
    if (status === "translating")
      return (a.startedAt || 0) - (b.startedAt || 0); // FIFO order for translating
    if (status === "paused") return (b.startedAt || 0) - (a.startedAt || 0); // Most recently paused first
    // Pending: oldest first (FIFO - video thêm trước hiện trước)
    return a.addedAt - b.addedAt;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  return { items: pageItems, total, totalPages };
}

// Get counts
export function getCounts(items: QueueItem[]): {
  pending: number;
  translating: number;
  paused: number;
  completed: number;
  error: number;
} {
  return {
    pending: items.filter((i) => i.status === "pending").length,
    translating: items.filter((i) => i.status === "translating").length,
    paused: items.filter((i) => i.status === "paused").length,
    completed: items.filter((i) => i.status === "completed").length,
    error: items.filter((i) => i.status === "error").length,
  };
}

// Check if video is in queue
export function isInQueue(
  items: QueueItem[],
  videoUrl: string
): QueueItem | undefined {
  const videoId = extractVideoId(videoUrl);
  return items.find((i) => i.videoId === videoId);
}

// Get paused batch retranslation info for a video
export function getPausedBatchRetranslation(
  items: QueueItem[],
  videoUrl: string
): QueueItem | null {
  const videoId = extractVideoId(videoUrl);
  const item = items.find(
    (i) =>
      i.videoId === videoId &&
      i.status === "paused" &&
      i.retranslateBatchIndex !== undefined
  );
  return item || null;
}

// Get batch retranslation info for a video (paused or waiting to be resumed)
export function getBatchRetranslationInfo(
  items: QueueItem[],
  videoUrl: string
): QueueItem | null {
  const videoId = extractVideoId(videoUrl);
  // Check for paused batch retranslation
  const pausedItem = items.find(
    (i) =>
      i.videoId === videoId &&
      i.status === "paused" &&
      i.retranslateBatchIndex !== undefined
  );
  if (pausedItem) return pausedItem;

  // Check for translating batch retranslation (waiting or active)
  const translatingItem = items.find(
    (i) =>
      i.videoId === videoId &&
      i.status === "translating" &&
      i.retranslateBatchIndex !== undefined
  );
  return translatingItem || null;
}

// Get partial SRT for an item
export function getPartialSrt(
  items: QueueItem[],
  itemId: string
): string | undefined {
  const item = items.find((i) => i.id === itemId);
  return item?.partialSrt;
}

// Check if a queue item is a time range translation (not full video)
export function isTimeRangeTranslation(
  items: QueueItem[],
  videoUrl: string
): boolean {
  const videoId = extractVideoId(videoUrl);
  const item = items.find((i) => i.videoId === videoId);
  return !!(
    item &&
    (item.rangeStart !== undefined || item.rangeEnd !== undefined)
  );
}

// Get time range info for a video in queue
export function getTimeRangeInfo(
  items: QueueItem[],
  videoUrl: string
): { rangeStart?: number; rangeEnd?: number } | null {
  const videoId = extractVideoId(videoUrl);
  const item = items.find((i) => i.videoId === videoId);
  if (!item || (item.rangeStart === undefined && item.rangeEnd === undefined)) {
    return null;
  }
  return { rangeStart: item.rangeStart, rangeEnd: item.rangeEnd };
}

// Get total count of videos in translating queue (for notification display)
export function getTranslatingQueueCount(items: QueueItem[]): number {
  return items.filter((i) => i.status === "translating").length;
}

/**
 * Queue Utilities — Constants & Helper Functions
 *
 * Tách từ queueManager.ts — chứa constants và hàm extractVideoId.
 * Chỉ di chuyển code, không sửa đổi logic.
 */

export const QUEUE_STORAGE_KEY = "@translation_queue";
export const PAGE_SIZE = 10;

// Extract video ID from URL
export const extractVideoId = (url: string): string => {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /[?&]v=([a-zA-Z0-9_-]+)/,
    /\/shorts\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return url;
};

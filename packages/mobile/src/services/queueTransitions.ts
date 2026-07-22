/**
 * Queue Transition Validation
 *
 * Tách từ queueManager.ts — chứa VALID_TRANSITIONS map và hàm validateTransition.
 * Chỉ di chuyển code, không sửa đổi logic.
 */
import type { QueueStatus } from "@src/types";
import { logger } from "./loggerService";

/** Valid status transitions for QueueItem */
export const VALID_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  pending: ["translating"],
  translating: ["completed", "error", "paused"],
  paused: ["translating", "pending"],
  completed: ["translating"], // retranslate
  error: ["translating", "pending"],
};

/** Validate that a status transition is allowed. Logs warning if invalid but does not block. */
export const validateTransition = (
  itemId: string,
  from: QueueStatus,
  to: QueueStatus
): boolean => {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    logger.warn(
      "QueueManager",
      `Unexpected status transition: ${from} → ${to} for item ${itemId}`
    );
    return false;
  }
  return true;
};

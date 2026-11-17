/**
 * Chat task derivation
 *
 * Tách từ ChatModal.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import type { ChatMessage, StoredChatMessage } from "@src/types";
import type { TaskItem } from "./TaskCard";

export function deriveTasks(
  messages: ChatMessage[],
  isLoading: boolean
): TaskItem[] {
  const result: TaskItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "user") {
      const nextMsg = messages[i + 1];
      const hasResult = nextMsg && nextMsg.role === "model";
      const isLastMessage = i === messages.length - 1;
      const isStreamingResult =
        hasResult && isLoading && i + 1 === messages.length - 1;

      let status: "done" | "error" | "pending";
      if (isStreamingResult) {
        status = "pending";
      } else if (hasResult) {
        status = nextMsg.content.startsWith("Lỗi:") ? "error" : "done";
      } else if (isLastMessage && isLoading) {
        // Currently processing
        status = "pending";
      } else {
        // No response and not loading = interrupted/error
        status = "error";
      }

      result.push({
        id: msg.id,
        command: msg.content,
        result: hasResult
          ? nextMsg.content
          : status === "error"
          ? "Lỗi: Bị gián đoạn"
          : undefined,
        hasVideo: msg.hasVideo,
        videoTitle: msg.videoTitle,
        videoUrl: (msg as StoredChatMessage).videoUrl,
        videoTimeRange: msg.videoTimeRange,
        timestamp: msg.timestamp,
        status,
      });
    }
  }
  return result;
}

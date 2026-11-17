import { MediaResolution } from "@google/genai";
import type {
  GeminiConfig,
  ChatMessage,
  StreamCallbacks,
  VideoTimeRange,
} from "@src/types";
import { normalizeYouTubeUrl } from "@utils/videoUtils";
import { keyManager } from "./keyManager";
import {
  getEffectiveChatSystemPrompt,
  getThinkingConfig,
} from "./geminiModelConfig";

// Check if model supports mediaResolution
const supportsMediaResolution = (_model: string): boolean => {
  return true;
};

// Map config string to MediaResolution enum
const getMediaResolution = (resolution?: string): MediaResolution => {
  switch (resolution) {
    case "MEDIA_RESOLUTION_LOW":
      return MediaResolution.MEDIA_RESOLUTION_LOW;
    case "MEDIA_RESOLUTION_MEDIUM":
      return MediaResolution.MEDIA_RESOLUTION_MEDIUM;
    case "MEDIA_RESOLUTION_HIGH":
      return MediaResolution.MEDIA_RESOLUTION_HIGH;
    case "MEDIA_RESOLUTION_UNSPECIFIED":
    default:
      return MediaResolution.MEDIA_RESOLUTION_MEDIUM;
  }
};

// Send message with streaming response (multi-turn)
export const sendChatMessage = async (
  messages: ChatMessage[],
  config: GeminiConfig,
  callbacks: StreamCallbacks,
  videoUrl?: string, // Video URL để nhét vào tin nhắn đầu tiên của user
  videoTimeRange?: VideoTimeRange, // Khoảng thời gian video (x-y)
  abortSignal?: AbortSignal
): Promise<void> => {
  if (!keyManager.hasAvailableKey()) {
    callbacks.onError(new Error("Thêm API key trong Cài đặt trước nhé"));
    return;
  }

  const ai = keyManager.getCurrentAI();
  if (!ai) {
    callbacks.onError(new Error("Không tìm thấy API key"));
    return;
  }

  // Build full conversation history for multi-turn
  const contents: Array<{
    role: "user" | "model";
    parts: Array<
      | { text: string }
      | {
          fileData: { fileUri: string; mimeType: string };
          videoMetadata?: { startOffset?: string; endOffset?: string };
        }
    >;
  }> = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const parts: Array<
      | { text: string }
      | {
          fileData: { fileUri: string; mimeType: string };
          videoMetadata?: { startOffset?: string; endOffset?: string };
        }
    > = [];

    // Nếu là tin nhắn user và có video, nhét video vào
    if (msg.role === "user" && msg.hasVideo && videoUrl) {
      const normalizedUrl = normalizeYouTubeUrl(videoUrl);

      // Get time range from message or from parameter (for current message)
      const msgTimeRange =
        msg.videoTimeRange ||
        (i === messages.length - 1 ? videoTimeRange : undefined);

      // Build video part with optional time range (like geminiService)
      const videoPart: {
        fileData: { fileUri: string; mimeType: string };
        videoMetadata?: { startOffset?: string; endOffset?: string };
      } = {
        fileData: { fileUri: normalizedUrl, mimeType: "video/*" },
      };

      // Add videoMetadata if time range is specified
      if (msgTimeRange) {
        videoPart.videoMetadata = {
          startOffset: `${msgTimeRange.startTime}s`,
          endOffset: `${msgTimeRange.endTime}s`,
        };
      }

      parts.push(videoPart);
    }

    parts.push({ text: msg.modelContent || msg.content });

    contents.push({
      role: msg.role,
      parts,
    });
  }

  try {
    // Build config based on model capabilities
    const chatConfig: any = {
      temperature: config.temperature,
      systemInstruction: getEffectiveChatSystemPrompt(config),
      thinkingConfig: getThinkingConfig(
        config.model,
        config.thinkingLevel
      ),
    };

    if (abortSignal) {
      chatConfig.abortSignal = abortSignal;
    }

    // Only add mediaResolution if model supports it
    if (supportsMediaResolution(config.model)) {
      chatConfig.mediaResolution = getMediaResolution(config.mediaResolution);
    }

    const chat = ai.chats.create({
      model: config.model,
      config: chatConfig,
      history: contents.slice(0, -1), // Tất cả messages trừ cái cuối
    });

    // Lấy message cuối cùng để gửi
    const lastMessage = contents[contents.length - 1];

    let fullText = "";

    if (typeof chat.sendMessageStream === "function") {
      const responseStream = await chat.sendMessageStream({
        message: lastMessage.parts,
      });

      for await (const chunk of responseStream) {
        if (abortSignal?.aborted) return;

        const chunkText = chunk.text ?? "";
        if (!chunkText) continue;

        fullText += chunkText;
        callbacks.onChunk(chunkText);
      }
    } else {
      const response = await chat.sendMessage({
        message: lastMessage.parts,
      });

      fullText = response.text ?? "";
      if (fullText) callbacks.onChunk(fullText);
    }

    if (fullText) {
      callbacks.onComplete(fullText);
    } else {
      callbacks.onError(new Error("Không nhận được phản hồi từ AI"));
    }
  } catch (error: any) {
    console.error("[ChatService] Error:", error);
    callbacks.onError(error);
  }
};

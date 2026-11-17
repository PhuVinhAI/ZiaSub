/**
 * useChat
 *
 * Tách từ ChatModal.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { FlatList } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { DEFAULT_CHAT_CONFIG_ID } from "@constants/defaults";
import type {
  GeminiConfig,
  ChatSession,
  ChatMessage,
  StoredChatMessage,
  VideoTimeRange,
} from "@src/types";
import {
  getGeminiConfigs,
  saveActiveChatConfigId,
  getActiveChatConfig,
  getChatSessions,
  getActiveChatSession,
  createChatSession,
  updateChatSession,
  deleteChatSession,
  setActiveChatSessionId,
  getApiKeys,
} from "@utils/storage";
import { sendChatMessage } from "@services/chatService";
import type { TaskItem } from "./TaskCard";

const QUICK_ACTION_KEYS: Record<
  string,
  { label: string; prompt: string }
> = {
  summary: {
    label: "chat.quickActions.summarize",
    prompt: "chat.quickActionPrompts.summarize",
  },
  analyze: {
    label: "chat.quickActions.analyze",
    prompt: "chat.quickActionPrompts.analyze",
  },
  keypoints: {
    label: "chat.quickActions.keyPoints",
    prompt: "chat.quickActionPrompts.keyPoints",
  },
  translate: {
    label: "chat.quickActions.translate",
    prompt: "chat.quickActionPrompts.translate",
  },
};

interface UseChatParams {
  videoUrl?: string;
  videoTitle?: string;
  onLoadingChange?: (isLoading: boolean) => void;
  toggleDrawer: () => void;
}

export function useChat({
  videoUrl,
  videoTitle,
  onLoadingChange,
  toggleDrawer,
}: UseChatParams) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [configs, setConfigs] = useState<GeminiConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<GeminiConfig | null>(null);
  const [showConfigSelector, setShowConfigSelector] = useState(false);
  const [attachVideo, setAttachVideo] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [isFromHistory, setIsFromHistory] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [videoTimeRange, setVideoTimeRange] = useState<VideoTimeRange | null>(
    null
  );
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const pendingScrollAnimatedRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeResponseMessageIdRef = useRef<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  // Track current session ID for abort handling
  useEffect(() => {
    currentSessionIdRef.current = currentSession?.id || null;
  }, [currentSession]);

  useEffect(() => {
    if (currentSession && messages.length > 0) {
      const updatedSession = {
        ...currentSession,
        messages: messages as StoredChatMessage[],
        configId: activeConfig?.id || null,
      };
      updateChatSession(updatedSession);
    }
  }, [messages, activeConfig]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    []
  );

  const loadData = async () => {
    const [allConfigs, allSessions, activeSession, activeChatConfig, apiKeys] =
      await Promise.all([
        getGeminiConfigs(),
        getChatSessions(),
        getActiveChatSession(),
        getActiveChatConfig(),
        getApiKeys(),
      ]);
    setConfigs(allConfigs);
    setHasApiKey(apiKeys.length > 0);
    // Use saved chat config or default chat config
    if (activeChatConfig) {
      setActiveConfig(activeChatConfig);
    } else {
      const chatConfig = allConfigs.find(
        (c) => c.id === DEFAULT_CHAT_CONFIG_ID
      );
      setActiveConfig(chatConfig || allConfigs[0] || null);
    }
    setSessions(allSessions);
    if (activeSession) {
      setCurrentSession(activeSession);
      setMessages(activeSession.messages);
    }
  };

  const handleSelectConfig = async (config: GeminiConfig) => {
    setActiveConfig(config);
    await saveActiveChatConfigId(config.id);
    setShowConfigSelector(false);
  };
  const scrollToBottom = useCallback(
    ({ animated = false, force = false } = {}) => {
      if (force) shouldAutoScrollRef.current = true;
      if (!shouldAutoScrollRef.current) return;

      pendingScrollAnimatedRef.current ||= animated;
      if (scrollFrameRef.current !== null) return;

      scrollFrameRef.current = requestAnimationFrame(() => {
        const shouldAnimate = pendingScrollAnimatedRef.current;
        pendingScrollAnimatedRef.current = false;
        scrollFrameRef.current = null;
        flatListRef.current?.scrollToEnd({ animated: shouldAnimate });
      });
    },
    []
  );

  const handleChatScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromEnd =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      shouldAutoScrollRef.current = distanceFromEnd <= 160;
    },
    []
  );

  const handleChatScrollBeginDrag = useCallback(() => {
    shouldAutoScrollRef.current = false;
  }, []);

  const runChatRequest = (
    requestMessages: ChatMessage[],
    requestConfig: GeminiConfig,
    currentAbort: AbortController,
    currentSessionId: string | null,
    requestVideoUrl?: string,
    requestVideoTimeRange?: VideoTimeRange
  ) => {
    const responseMessageId = `${Date.now()}-model`;
    const responseTimestamp = Date.now();
    let streamedText = "";
    activeResponseMessageIdRef.current = responseMessageId;

    const isCurrentRequest = () =>
      !currentAbort.signal.aborted &&
      currentSessionIdRef.current === currentSessionId;

    const upsertResponse = (content: string) => {
      setMessages((prev) => {
        const existingIndex = prev.findIndex(
          (message) => message.id === responseMessageId
        );

        if (existingIndex === -1) {
          return [
            ...prev,
            {
              id: responseMessageId,
              role: "model",
              content,
              timestamp: responseTimestamp,
            },
          ];
        }

        return prev.map((message) =>
          message.id === responseMessageId
            ? { ...message, content }
            : message
        );
      });
    };

    const finishRequest = () => {
      setIsLoading(false);
      abortControllerRef.current = null;
      if (activeResponseMessageIdRef.current === responseMessageId) {
        activeResponseMessageIdRef.current = null;
      }
    };

    void sendChatMessage(
      requestMessages,
      requestConfig,
      {
        onChunk: (chunkText) => {
          if (!isCurrentRequest()) return;
          streamedText += chunkText;
          upsertResponse(streamedText);
        },
        onComplete: (fullText) => {
          if (!isCurrentRequest()) return;
          upsertResponse(fullText);
          finishRequest();
        },
        onError: (error) => {
          if (!isCurrentRequest()) return;
          const errorContent = `Lỗi: ${error.message}`;
          upsertResponse(
            streamedText ? `${errorContent}\n\n${streamedText}` : errorContent
          );
          finishRequest();
        },
      },
      requestVideoUrl,
      requestVideoTimeRange,
      currentAbort.signal
    );
  };

  const handleSend = async (
    text?: string,
    withVideo?: boolean,
    displayText?: string
  ) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading || !activeConfig) return;
    const shouldAttachVideo = withVideo !== undefined ? withVideo : attachVideo;
    const userMessage: StoredChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: displayText || messageText,
      modelContent: displayText ? messageText : undefined,
      timestamp: Date.now(),
      hasVideo: shouldAttachVideo && !!videoUrl,
      videoTitle: shouldAttachVideo && !!videoUrl ? videoTitle : undefined,
      videoTimeRange:
        shouldAttachVideo && !!videoUrl && videoTimeRange
          ? videoTimeRange
          : undefined,
      videoUrl: shouldAttachVideo && !!videoUrl ? videoUrl : undefined,
    };

    let sessionToUse = currentSession;
    if (!sessionToUse) {
      // Create new session with first message as name
      const sessionName = userMessage.content.slice(0, 50);
      const newSession = await createChatSession(sessionName, activeConfig.id);
      sessionToUse = newSession;
      setCurrentSession(newSession);
      setSessions((prev) => [newSession, ...prev]);
    } else if (
      sessionToUse.messages.length === 0 &&
      sessionToUse.name === "Chat mới"
    ) {
      // Update session name with first message if it's still default
      const sessionName = userMessage.content.slice(0, 50);
      const updatedSession = { ...sessionToUse, name: sessionName };
      await updateChatSession(updatedSession);
      setCurrentSession(updatedSession);
      setSessions((prev) =>
        prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      );
      sessionToUse = updatedSession;
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setAttachVideo(false);
    setVideoTimeRange(null);
    setIsLoading(true);
    setIsFromHistory(false);
    scrollToBottom({ animated: true, force: true });
    abortControllerRef.current = new AbortController();
    const currentAbort = abortControllerRef.current;
    const currentSessionId = sessionToUse.id;
    currentSessionIdRef.current = currentSessionId;
    runChatRequest(
      newMessages,
      activeConfig,
      currentAbort,
      currentSessionId,
      shouldAttachVideo ? videoUrl : undefined,
      shouldAttachVideo ? userMessage.videoTimeRange : undefined
    );
  };

  const handleQuickAction = (actionId: string) => {
    const action = QUICK_ACTION_KEYS[actionId];
    if (action) handleSend(t(action.prompt), true, t(action.label));
  };

  const handleStop = () => {
    const responseMessageId = activeResponseMessageIdRef.current;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeResponseMessageIdRef.current = null;

    setMessages((prev) => {
      const stoppedContent = "Lỗi: Đã dừng bởi người dùng";
      const existingResponse = responseMessageId
        ? prev.find((message) => message.id === responseMessageId)
        : undefined;

      if (existingResponse && responseMessageId) {
        return prev.map((message) =>
          message.id === responseMessageId
            ? {
                ...message,
                content: message.content
                  ? `${stoppedContent}\n\n${message.content}`
                  : stoppedContent,
              }
            : message
        );
      }

      return [
        ...prev,
        {
          id: responseMessageId || `${Date.now()}-model`,
          role: "model",
          content: stoppedContent,
          timestamp: Date.now(),
        },
      ];
    });
    setIsLoading(false);
  };

  const handleNewChat = async () => {
    // Abort any running request from previous session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    activeResponseMessageIdRef.current = null;
    // Reset loading state for new chat
    setIsLoading(false);
    setMessages([]);
    setAttachVideo(false);
    setInputText("");
    setIsFromHistory(false);
    const newSession = await createChatSession(undefined, activeConfig?.id);
    setCurrentSession(newSession);
    const allSessions = await getChatSessions();
    setSessions(allSessions);
    toggleDrawer();
  };

  const handleSelectSession = async (session: ChatSession) => {
    // Abort any running request from previous session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    activeResponseMessageIdRef.current = null;
    // Reset loading state when switching sessions
    setIsLoading(false);
    await setActiveChatSessionId(session.id);
    setCurrentSession(session);
    setMessages(session.messages);
    setIsFromHistory(true);
    toggleDrawer();
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteChatSession(sessionId);
    const newSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(newSessions);
    if (currentSession?.id === sessionId) {
      if (newSessions.length > 0) {
        setCurrentSession(newSessions[0]);
        setMessages(newSessions[0].messages);
      } else {
        setCurrentSession(null);
        setMessages([]);
      }
    }
  };

  const handleRegenerateTask = (task: TaskItem) => {
    if (isLoading || !activeConfig) return;
    const taskIndex = messages.findIndex((m) => m.id === task.id);
    if (taskIndex === -1) return;
    const hasResponse = messages[taskIndex + 1]?.role === "model";
    const originalMessage = messages[taskIndex];
    const removeCount = hasResponse ? 2 : 1;
    const newMessages = [
      ...messages.slice(0, taskIndex),
      ...messages.slice(taskIndex + removeCount),
    ];
    const userMessage: StoredChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: task.command,
      modelContent: originalMessage.modelContent,
      timestamp: Date.now(),
      hasVideo: task.hasVideo,
      videoTitle: task.videoTitle,
      videoTimeRange: task.videoTimeRange,
      videoUrl: task.videoUrl,
    };
    const updatedMessages = [...newMessages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setIsFromHistory(false);
    scrollToBottom({ animated: true, force: true });
    abortControllerRef.current = new AbortController();
    const currentAbort = abortControllerRef.current;
    const currentSessionId = currentSession?.id || null;
    // Use videoUrl from task (stored in message) or fallback to prop
    const taskVideoUrl = task.videoUrl || videoUrl;
    runChatRequest(
      updatedMessages,
      activeConfig,
      currentAbort,
      currentSessionId,
      task.hasVideo ? taskVideoUrl : undefined,
      task.videoTimeRange
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskIndex = messages.findIndex((m) => m.id === taskId);
    if (taskIndex === -1) return;
    const hasResponse = messages[taskIndex + 1]?.role === "model";
    const removeCount = hasResponse ? 2 : 1;
    const newMessages = [
      ...messages.slice(0, taskIndex),
      ...messages.slice(taskIndex + removeCount),
    ];
    setMessages(newMessages);

    // Immediately persist to storage
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        messages: newMessages as StoredChatMessage[],
        updatedAt: Date.now(),
      };
      await updateChatSession(updatedSession);
      setCurrentSession(updatedSession);
      setSessions((prev) =>
        prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      );
    }
  };

  return {
    messages,
    inputText,
    setInputText,
    isLoading,
    configs,
    activeConfig,
    showConfigSelector,
    setShowConfigSelector,
    attachVideo,
    setAttachVideo,
    sessions,
    setSessions,
    currentSession,
    setCurrentSession,
    isFromHistory,
    hasApiKey,
    videoTimeRange,
    setVideoTimeRange,
    showTimeRangePicker,
    setShowTimeRangePicker,
    flatListRef,
    scrollToBottom,
    handleChatScroll,
    handleChatScrollBeginDrag,
    loadData,
    handleSelectConfig,
    handleSend,
    handleQuickAction,
    handleStop,
    handleNewChat,
    handleSelectSession,
    handleDeleteSession,
    handleRegenerateTask,
    handleDeleteTask,
  };
}

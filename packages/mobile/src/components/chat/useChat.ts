/**
 * useChat
 *
 * Tách từ ChatModal.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { FlatList } from "react-native";
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
import { QUICK_ACTION_MAP } from "./chatModalStyles";

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
  const abortControllerRef = useRef<AbortController | null>(null);
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
  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = async (text?: string, withVideo?: boolean) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading || !activeConfig) return;
    const shouldAttachVideo = withVideo !== undefined ? withVideo : attachVideo;
    const userMessage: StoredChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
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
      const sessionName = messageText.slice(0, 50);
      const newSession = await createChatSession(sessionName, activeConfig.id);
      sessionToUse = newSession;
      setCurrentSession(newSession);
      setSessions((prev) => [newSession, ...prev]);
    } else if (
      sessionToUse.messages.length === 0 &&
      sessionToUse.name === "Chat mới"
    ) {
      // Update session name with first message if it's still default
      const sessionName = messageText.slice(0, 50);
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
    scrollToBottom();
    abortControllerRef.current = new AbortController();
    const currentAbort = abortControllerRef.current;
    const currentSessionId = sessionToUse.id;
    sendChatMessage(
      newMessages,
      activeConfig,
      {
        onChunk: () => scrollToBottom(),
        onComplete: (fullText) => {
          if (currentAbort.signal.aborted) return;
          // Check if we're still on the same session
          if (currentSessionIdRef.current !== currentSessionId) return;
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "model",
            content: fullText,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
          abortControllerRef.current = null;
          scrollToBottom();
        },
        onError: (error) => {
          if (currentAbort.signal.aborted) return;
          // Check if we're still on the same session
          if (currentSessionIdRef.current !== currentSessionId) return;
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "model",
            content: `Lỗi: ${error.message}`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
          abortControllerRef.current = null;
        },
      },
      shouldAttachVideo ? videoUrl : undefined,
      shouldAttachVideo ? userMessage.videoTimeRange : undefined
    );
  };

  const handleQuickAction = (actionId: string) => {
    handleSend(QUICK_ACTION_MAP[actionId], true);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const errorMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "model",
      content: "Lỗi: Đã dừng bởi người dùng",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, errorMessage]);
    setIsLoading(false);
  };

  const handleNewChat = async () => {
    // Abort any running request from previous session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
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
    const removeCount = hasResponse ? 2 : 1;
    const newMessages = [
      ...messages.slice(0, taskIndex),
      ...messages.slice(taskIndex + removeCount),
    ];
    const userMessage: StoredChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: task.command,
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
    scrollToBottom();
    abortControllerRef.current = new AbortController();
    const currentAbort = abortControllerRef.current;
    const currentSessionId = currentSession?.id;
    // Use videoUrl from task (stored in message) or fallback to prop
    const taskVideoUrl = task.videoUrl || videoUrl;
    sendChatMessage(
      updatedMessages,
      activeConfig,
      {
        onChunk: () => scrollToBottom(),
        onComplete: (fullText) => {
          if (currentAbort.signal.aborted) return;
          if (currentSessionIdRef.current !== currentSessionId) return;
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "model",
            content: fullText,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
          abortControllerRef.current = null;
          scrollToBottom();
        },
        onError: (error) => {
          if (currentAbort.signal.aborted) return;
          if (currentSessionIdRef.current !== currentSessionId) return;
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "model",
            content: `Lỗi: ${error.message}`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
          abortControllerRef.current = null;
        },
      },
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

import React, { useMemo, useRef } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  Animated,
} from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import { useThemedStyles } from "@hooks/useThemedStyles";
import ConfigSelector from "./ConfigSelector";
import TaskCard, { TaskItem } from "./TaskCard";
import ChatDrawer from "./ChatDrawer";
import ChatInput from "./ChatInput";
import ChatEmptyState from "./ChatEmptyState";
import VideoTimeRangePicker from "./VideoTimeRangePicker";
import { styles, chatModalThemedStyles } from "./chatModalStyles";
import { deriveTasks } from "./chatTasks";
import { useChat } from "./useChat";
import { useChatModalAnimation } from "./useChatModalAnimation";

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  videoUrl?: string;
  videoTitle?: string;
  videoDuration?: number;
  onLoadingChange?: (isLoading: boolean) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  videoUrl,
  videoTitle,
  videoDuration,
  onLoadingChange,
}) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(chatModalThemedStyles);
  const insets = useSafeAreaInsets();

  // toggleDrawer comes from the animation hook (declared below); route it
  // through a ref so useChat can call it while preserving effect ordering.
  const toggleDrawerRef = useRef<() => void>(() => {});

  const {
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
  } = useChat({
    videoUrl,
    videoTitle,
    onLoadingChange,
    toggleDrawer: () => toggleDrawerRef.current(),
  });

  const { slideAnim, drawerAnim, drawerOpen, toggleDrawer, handleClose } =
    useChatModalAnimation({ visible, loadData, onClose });
  toggleDrawerRef.current = toggleDrawer;

  // Keyboard handling with react-native-keyboard-controller
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: (event) => {
        "worklet";
        keyboardHeight.value = Math.max(event.height, 0);
      },
    },
    []
  );

  const keyboardAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboardHeight.value,
  }));

  const tasks = useMemo(
    (): TaskItem[] => deriveTasks(messages, isLoading),
    [messages, isLoading]
  );

  const renderTask = ({ item, index }: { item: TaskItem; index: number }) => {
    const isLastTask = index === tasks.length - 1;
    const shouldExpand =
      isLastTask && (!isFromHistory || item.status === "pending");
    return (
      <TaskCard
        task={item}
        defaultExpanded={shouldExpand}
        onCopy={() => {}}
        onRegenerate={handleRegenerateTask}
        onDelete={handleDeleteTask}
      />
    );
  };

  const topPadding = Math.max(insets.top, 24);
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.container,
            themedStyles.container,
            {
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={toggleDrawer}>
              <MaterialCommunityIcons
                name="menu"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={themedStyles.headerTitle} numberOfLines={1}>
              {currentSession?.name || "Zia"}
            </Text>
            <TouchableOpacity style={styles.headerBtn} onPress={handleClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            ref={flatListRef}
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.taskList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <ChatEmptyState
                hasApiKey={hasApiKey}
                hasVideo={!!videoUrl}
                isLoading={isLoading}
                onQuickAction={handleQuickAction}
              />
            }
          />
          <Reanimated.View style={keyboardAnimatedStyle}>
            <ChatInput
              inputText={inputText}
              onChangeText={setInputText}
              onSend={() => handleSend()}
              onStop={handleStop}
              isLoading={isLoading}
              videoUrl={videoUrl}
              videoTitle={videoTitle}
              attachVideo={attachVideo}
              onToggleVideo={() => setAttachVideo(!attachVideo)}
              configName={activeConfig?.name || "Chọn model"}
              onOpenConfig={() => setShowConfigSelector(true)}
              disabled={!hasApiKey}
              videoTimeRange={videoTimeRange}
              onOpenTimeRange={() => setShowTimeRangePicker(true)}
            />
          </Reanimated.View>
          {drawerOpen && (
            <TouchableOpacity
              style={[styles.drawerOverlay, { backgroundColor: colors.overlay }]}
              activeOpacity={1}
              onPress={toggleDrawer}
            />
          )}
          <ChatDrawer
            sessions={sessions}
            currentSession={currentSession}
            drawerAnim={drawerAnim}
            paddingTop={topPadding + 20}
            onNewChat={handleNewChat}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onUpdateSessions={setSessions}
            onUpdateCurrentSession={setCurrentSession}
          />
          <ConfigSelector
            visible={showConfigSelector}
            configs={configs}
            activeConfig={activeConfig}
            onSelect={handleSelectConfig}
            onClose={() => setShowConfigSelector(false)}
          />
          <VideoTimeRangePicker
            visible={showTimeRangePicker}
            onClose={() => setShowTimeRangePicker(false)}
            onConfirm={setVideoTimeRange}
            currentRange={videoTimeRange}
            videoDuration={videoDuration}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ChatModal;

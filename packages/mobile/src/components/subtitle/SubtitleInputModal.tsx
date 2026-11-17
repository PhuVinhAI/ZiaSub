import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { alert, confirm } from "../common/CustomAlert";
import BottomSheetModal from "../common/BottomSheetModal";
import SegmentedTabs from "../common/SegmentedTabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import type { BatchSettings, BatchProgress, TranslationJob } from "@src/types";
import { translationManager } from "@services/translationManager";
import { queueManager } from "@services/queueManager";
import { extractVideoId } from "@utils/videoUtils";
import { useQueueVideoStatus } from "@hooks/useQueueVideoStatus";
import { getActiveTranslationConfig } from "@utils/storage/geminiStorage";
import { PRESET_PROMPTS } from "@constants/defaults";
import { SrtTab } from "./SrtTab";
import { TranslateTab } from "./TranslateTab";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

type TabType = "srt" | "translate";

const isSRTFormat = (text: string): boolean => {
  if (!text || text.length < 10) return false;
  const srtPattern =
    /^\d+\s*\n\d{2}:\d{2}:\d{2}[,.:]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.:]\d{3}/m;
  return srtPattern.test(text.trim());
};

interface SubtitleInputModalProps {
  visible: boolean;
  onClose: () => void;
  srtContent: string;
  setSrtContent: (text: string) => void;
  onLoadSubtitles: () => void;
  onOpenVisualEditor?: (content: string) => void;
  onApplySubtitles?: (content: string) => void;
  onClearSubtitles?: () => void;
  videoUrl?: string;
  videoTitle?: string;
  videoDuration?: number;
  batchSettings?: BatchSettings;
  onBatchSettingsChange?: (settings: BatchSettings) => void;
  onTranslationStateChange?: (
    isTranslating: boolean,
    progress: { completed: number; total: number } | null
  ) => void;
}

const SubtitleInputModal: React.FC<SubtitleInputModalProps> = ({
  visible,
  onClose,
  srtContent,
  setSrtContent,
  onLoadSubtitles,
  onOpenVisualEditor,
  onApplySubtitles,
  onClearSubtitles,
  videoUrl,
  videoTitle,
  videoDuration,
  batchSettings,
  onBatchSettingsChange,
  onTranslationStateChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const styles = useThemedStyles(themedStyles);

  const [activeTab, setActiveTab] = useState<TabType>("translate");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateStatus, setTranslateStatus] = useState("");
  const [keyStatus, setKeyStatus] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null
  );
  // Đề xuất E: Dùng hook chung thay vì duplicate checkQueueStatus logic
  const {
    isWaitingInQueue,
    isPausedInQueue,
    queuePosition,
    pausedProgress,
  } = useQueueVideoStatus(videoUrl);

  // Config info for SRT export
  const [activeConfigName, setActiveConfigName] = useState<string>("");
  const [activePresetName, setActivePresetName] = useState<string>("");

  // Keyboard handling
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: (event) => {
        "worklet";
        keyboardHeight.value = event.height;
      },
    },
    []
  );

  const animatedBottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardHeight.value }],
  }));

  const onTranslationStateChangeRef = useRef(onTranslationStateChange);
  useEffect(() => {
    onTranslationStateChangeRef.current = onTranslationStateChange;
  }, [onTranslationStateChange]);

  const onApplySubtitlesRef = useRef(onApplySubtitles);
  useEffect(() => {
    onApplySubtitlesRef.current = onApplySubtitles;
  }, [onApplySubtitles]);

  // Load active config info for SRT export
  useEffect(() => {
    const loadConfigInfo = async () => {
      const activeConfig = await getActiveTranslationConfig();
      if (activeConfig) {
        setActiveConfigName(activeConfig.name);
        // Find preset name from presetId or systemPrompt
        const isVi = t("languages.vi") === "Tiếng Việt"; // Check current language
        if (activeConfig.presetId) {
          const preset = PRESET_PROMPTS.find(
            (p) => p.id === activeConfig.presetId
          );
          setActivePresetName(
            preset ? (isVi ? preset.nameVi : preset.name) : ""
          );
        } else {
          const matchingPreset = PRESET_PROMPTS.find(
            (p) => p.prompt === activeConfig.systemPrompt
          );
          setActivePresetName(
            matchingPreset
              ? isVi
                ? matchingPreset.nameVi
                : matchingPreset.name
              : ""
          );
        }
      }
    };
    if (visible) loadConfigInfo();
  }, [visible, t]);

  // Đề xuất E: checkQueueStatus và queue subscribe useEffect đã được thay bằng useQueueVideoStatus hook ở trên
  // Handle cancel waiting/translating in queue - abort and remove from queue
  const handleCancelQueue = useCallback(async () => {
    if (videoUrl) {
      const queueItem = queueManager.isInQueue(videoUrl);
      if (queueItem) {
        await queueManager.abortAndRemove(queueItem.id);
      }
      // Queue status sẽ tự cập nhật qua useQueueVideoStatus hook
      setIsTranslating(false);
    }
  }, [videoUrl]);

  const reloadTranslationsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = translationManager.subscribe((job: TranslationJob) => {
      const jobVideoId = extractVideoId(job.videoUrl);
      const currentVideoId = videoUrl ? extractVideoId(videoUrl) : null;

      if (jobVideoId && currentVideoId && jobVideoId === currentVideoId) {
        // Check if this is a batch retranslation (has isBatchRetranslation flag or retranslateBatchIndex)
        // Time range translation (rangeStart/rangeEnd without isBatchRetranslation) is NOT a batch retranslation
        // Batch retranslation should NOT affect main isTranslating state
        const isBatchRetranslation =
          job.isBatchRetranslation || job.retranslateBatchIndex !== undefined;

        if (!isBatchRetranslation) {
          setIsTranslating(job.status === "processing");
          setBatchProgress(job.progress);
          setKeyStatus(job.keyStatus);
          if (job.progress) {
            const currentBatch = job.progress.completedBatches + 1;
            setTranslateStatus(
              job.progress.totalBatches > 1
                ? `Đang dịch phần ${currentBatch}/${job.progress.totalBatches}...`
                : "Đang dịch video..."
            );
            queueManager.updateVideoProgress(
              job.videoUrl,
              {
                completed: job.progress.completedBatches,
                total: job.progress.totalBatches,
              },
              job.configName
            );
          }
          onTranslationStateChangeRef.current?.(
            job.status === "processing",
            job.progress
              ? {
                  completed: job.progress.completedBatches,
                  total: job.progress.totalBatches,
                }
              : null
          );
        }

        if (job.status === "completed" && job.result) {
          if (!isBatchRetranslation) {
            setTranslateStatus("Xong rồi!");
            setKeyStatus(null);
            setSrtContent(job.result);
            onApplySubtitlesRef.current?.(job.result);
            queueManager.markVideoCompleted(job.videoUrl, job.configName);
            if (visible)
              alert("Thành công", "Dịch xong rồi! Phụ đề đã sẵn sàng.");
          }
          translationManager.clearCompletedJob(job.videoUrl);
          reloadTranslationsRef.current?.();
        }
        if (job.status === "error") {
          if (!isBatchRetranslation) {
            setTranslateStatus("");
            setKeyStatus(null);
          }
          const isUserStopped = job.error?.startsWith("Đã dừng");
          if (!isUserStopped && !isBatchRetranslation) {
            queueManager.markVideoError(
              job.videoUrl,
              job.error || "Có lỗi xảy ra"
            );
          } else if (!isBatchRetranslation) {
            // Check if video is being removed from queue - if so, don't mark as stopped
            if (!queueManager.isBeingRemoved(job.videoUrl)) {
              const queueItem = queueManager.isInQueue(job.videoUrl);
              if (queueItem && queueItem.status === "translating") {
                const hasPartial =
                  job.partialResult &&
                  job.completedBatchRanges &&
                  job.completedBatchRanges.length > 0;
                queueManager.markVideoStopped(
                  job.videoUrl,
                  hasPartial
                    ? {
                        partialSrt: job.partialResult!,
                        completedBatchRanges: job.completedBatchRanges!,
                        completedBatches: job.completedBatchRanges!.length,
                        totalBatches: job.progress?.totalBatches || 0,
                      }
                    : undefined
                );
              }
            }
          }
          translationManager.clearCompletedJob(job.videoUrl);
          reloadTranslationsRef.current?.();
          if (!isUserStopped && !isBatchRetranslation) {
            alert("Không dịch được", job.error || "Không thể dịch video này.");
          }
        }
      }
    });
    return () => unsubscribe();
  }, [videoUrl, visible, setSrtContent]);

  useEffect(() => {
    if (videoUrl) {
      const existingJob = translationManager.getJobForUrl(videoUrl);
      // Check if this is a batch retranslation (has isBatchRetranslation flag or retranslateBatchIndex)
      // Time range translation (rangeStart/rangeEnd without isBatchRetranslation) is NOT a batch retranslation
      const isBatchRetranslation =
        existingJob?.isBatchRetranslation ||
        existingJob?.retranslateBatchIndex !== undefined;

      if (
        existingJob &&
        existingJob.status === "processing" &&
        !isBatchRetranslation
      ) {
        setIsTranslating(true);
        setBatchProgress(existingJob.progress);
        setKeyStatus(existingJob.keyStatus);
        setTranslateStatus(
          existingJob.progress && existingJob.progress.totalBatches > 1
            ? `Đang dịch phần ${existingJob.progress.completedBatches}/${existingJob.progress.totalBatches}...`
            : "Đang dịch video..."
        );
        setActiveTab("translate");
        onTranslationStateChangeRef.current?.(
          true,
          existingJob.progress
            ? {
                completed: existingJob.progress.completedBatches,
                total: existingJob.progress.totalBatches,
              }
            : null
        );
      } else {
        setIsTranslating(false);
        setBatchProgress(null);
        setKeyStatus(null);
        setTranslateStatus("");
        onTranslationStateChangeRef.current?.(false, null);
      }
    } else {
      setIsTranslating(false);
      setBatchProgress(null);
      setKeyStatus(null);
      setTranslateStatus("");
      onTranslationStateChangeRef.current?.(false, null);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SHEET_HEIGHT);
      fadeAnim.setValue(0);
      if (!isTranslating) {
        setTranslateStatus("");
        setBatchProgress(null);
      }
    }
  }, [visible, isTranslating]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const checkClipboard = useCallback(async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent && isSRTFormat(clipboardContent) && !srtContent) {
        confirm(
          t("subtitleModal.srt.detected"),
          t("subtitleModal.srt.detectedConfirm"),
          () => setSrtContent(clipboardContent),
          t("common.paste"),
          t("common.no")
        );
      }
    } catch {}
  }, [srtContent, setSrtContent, t]);

  useEffect(() => {
    if (visible && activeTab === "srt") checkClipboard();
  }, [visible, activeTab, checkClipboard]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      title={t("subtitleModal.title")}
      maxHeightRatio={0.8}
      fixedHeight={true}
      wrapperComponent={Reanimated.View}
      wrapperStyle={[styles.keyboardAvoidingContainer, animatedBottomStyle]}
    >
      <SegmentedTabs<TabType>
        value={activeTab}
        onChange={setActiveTab}
        style={styles.tabs}
        items={[
          {
            key: "translate",
            label: t("subtitleModal.tabs.translate"),
            icon: "translate",
          },
          {
            key: "srt",
            label: t("subtitleModal.tabs.srt"),
            icon: "file-document-outline",
          },
        ]}
      />
      <View
        style={{
          display: activeTab === "srt" ? "flex" : "none",
          flex: 1,
        }}
      >
        <SrtTab
          srtContent={srtContent}
          setSrtContent={setSrtContent}
          onLoadSubtitles={onLoadSubtitles}
          onOpenVisualEditor={onOpenVisualEditor}
          videoTitle={videoTitle}
          configName={activeConfigName}
          presetName={activePresetName}
        />
      </View>
      <View
        style={{
          display: activeTab === "translate" ? "flex" : "none",
          flex: 1,
        }}
      >
        <TranslateTab
          videoUrl={videoUrl}
          videoTitle={videoTitle}
          videoDuration={videoDuration}
          batchSettings={batchSettings}
          isTranslating={isTranslating}
          isWaitingInQueue={isWaitingInQueue}
          isPausedInQueue={isPausedInQueue}
          queuePosition={queuePosition}
          pausedProgress={pausedProgress}
          translateStatus={translateStatus}
          keyStatus={keyStatus}
          batchProgress={batchProgress}
          onClose={handleClose}
          onSelectTranslation={(srt) => {
            setSrtContent(srt);
            onApplySubtitles?.(srt);
          }}
          onBatchSettingsChange={onBatchSettingsChange}
          onTranslationDeleted={() => {
            setSrtContent("");
            onClearSubtitles?.();
          }}
          onReloadRef={reloadTranslationsRef}
          visible={visible}
          onCancelQueue={handleCancelQueue}
        />
      </View>
    </BottomSheetModal>
  );
};

const themedStyles = createThemedStyles((colors) => ({
  modalOverlay: { flex: 1, justifyContent: "flex-end" as const },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  keyboardAvoidingContainer: {
    width: "100%" as const,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    width: "100%" as const,
    height: SHEET_HEIGHT,
    backgroundColor: colors.surface,
  },
  sheetHeader: {
    alignItems: "center" as const,
    marginBottom: 16,
    position: "relative" as const,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: "600" as const },
  closeButton: { position: "absolute" as const, right: 0, top: 12, padding: 8 },
  tabs: { marginBottom: 16 },
}));

export default SubtitleInputModal;

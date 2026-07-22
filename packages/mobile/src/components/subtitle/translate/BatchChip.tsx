/**
 * BatchChip — single batch chip + per-batch retranslate buttons
 *
 * Tách từ SavedTranslationsList.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import type { SavedTranslation, TranslationJob } from "@src/types";
import type { BatchInfo } from "./translationListUtils";
import type { BatchDisplayState } from "./translationBatchState";
import { formatTime } from "./translationListUtils";

interface BatchChipProps {
  batch: BatchInfo;
  item: SavedTranslation;
  state: BatchDisplayState;
  styles: any;
  onRetranslateBatch?: (
    translation: SavedTranslation,
    batchIndex: number,
    mode: "single" | "fromHere"
  ) => void;
  handleRetranslateBatch: (
    item: SavedTranslation,
    batchIndex: number,
    mode: "single" | "fromHere"
  ) => void;
  batchRetranslateJob?: TranslationJob | null;
  pausedBatchRetranslation?: {
    batchIndex: number;
    mode: "single" | "fromHere";
    translationId?: string;
  } | null;
  isTranslating: boolean;
  isPausedInQueue: boolean;
  isWaitingInQueue: boolean;
}

const BatchChip: React.FC<BatchChipProps> = ({
  batch,
  item,
  state,
  styles,
  onRetranslateBatch,
  handleRetranslateBatch,
  batchRetranslateJob,
  pausedBatchRetranslation,
  isTranslating,
  isPausedInQueue,
  isWaitingInQueue,
}) => {
  const { colors } = useTheme();
  const {
    isInRetranslationRange,
    isCompleted,
    isError,
    isProcessing,
    isPaused,
    isWaiting,
    isPresubBatch,
  } = state;

  return (
    <View
      style={[
        styles.batchChipContainer,
        // Add highlight border for batches in retranslation range
        isInRetranslationRange && {
          borderWidth: 2,
          borderColor: isProcessing
            ? colors.primary
            : isPaused
            ? colors.warning
            : isWaiting
            ? colors.primary
            : colors.border,
          borderRadius: 8,
          borderStyle: "dashed",
          padding: 2,
          margin: -2,
        },
      ]}
    >
      <View
        style={[
          styles.batchChip,
          isCompleted && !isPresubBatch && styles.batchChipCompleted,
          isPresubBatch && styles.batchChipPresub,
          isError && styles.batchChipError,
          isProcessing && !isPresubBatch && styles.batchChipProcessing,
          isPaused && !isPresubBatch && styles.batchChipPaused,
          isWaiting && !isPresubBatch && styles.batchChipWaiting,
          !isCompleted &&
            !isError &&
            !isProcessing &&
            !isPaused &&
            !isWaiting &&
            styles.batchChipPending,
        ]}
      >
        {isProcessing ? (
          <MaterialCommunityIcons
            name="translate"
            size={12}
            color={colors.onPrimary}
          />
        ) : isPaused ? (
          <MaterialCommunityIcons
            name="pause"
            size={12}
            color={colors.onWarning}
          />
        ) : isWaiting ? (
          <MaterialCommunityIcons
            name="clock-outline"
            size={12}
            color={colors.primary}
          />
        ) : (
          <Text
            style={[
              styles.batchChipText,
              isCompleted && !isPresubBatch && styles.batchChipTextCompleted,
              isError && styles.batchChipTextError,
              isPresubBatch && styles.batchChipTextPresub,
            ]}
          >
            {batch.index + 1}
          </Text>
        )}
        <Text
          style={[
            styles.batchChipTime,
            isCompleted && !isPresubBatch && styles.batchChipTimeCompleted,
            isError && styles.batchChipTimeError,
            isPresubBatch && styles.batchChipTimePresub,
            isProcessing && !isPresubBatch && { color: colors.onPrimary },
            isPaused && { color: colors.onWarning },
            isWaiting && !isPresubBatch && { color: colors.primary },
          ]}
        >
          {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
        </Text>
      </View>
      {/* Retranslate buttons - hide when retranslating (full or batch), paused, or waiting in queue */}
      {onRetranslateBatch &&
        !batchRetranslateJob &&
        !pausedBatchRetranslation &&
        !isTranslating &&
        !isPausedInQueue &&
        !isWaitingInQueue && (
          <View style={styles.batchActions}>
            <TouchableOpacity
              style={styles.batchActionBtn}
              onPress={() => handleRetranslateBatch(item, batch.index, "single")}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={14}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.batchActionBtn}
              onPress={() =>
                handleRetranslateBatch(item, batch.index, "fromHere")
              }
            >
              <MaterialCommunityIcons
                name="arrow-right-bold"
                size={14}
                color={colors.warning}
              />
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
};

export default BatchChip;

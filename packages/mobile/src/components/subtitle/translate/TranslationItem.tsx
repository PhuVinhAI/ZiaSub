/**
 * TranslationItem — one saved-translation card (header + expanded content)
 *
 * Tách từ SavedTranslationsList.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import type { SavedTranslation, TranslationJob } from "@src/types";
import {
  formatDate,
  formatTime,
  getPresetName,
  getBatchSettingsInfo,
  getProgressPercent,
  type BatchInfo,
} from "./translationListUtils";
import { getBatchDisplayState } from "./translationBatchState";
import RetranslationStatusBar from "./RetranslationStatusBar";
import BatchChip from "./BatchChip";

interface TranslationItemProps {
  item: SavedTranslation;
  index: number;
  isExpanded: boolean;
  batches: BatchInfo[];
  activeTranslationId: string | null;
  onSelect: (translation: SavedTranslation) => void;
  onDelete: (translation: SavedTranslation) => void;
  onResume?: (translation: SavedTranslation) => void;
  onRetranslateBatch?: (
    translation: SavedTranslation,
    batchIndex: number,
    mode: "single" | "fromHere"
  ) => void;
  onStopBatchRetranslate?: () => void;
  onResumeBatchRetranslate?: () => void;
  onCancelBatchRetranslate?: () => void;
  onToggleExpand: (id: string) => void;
  handleRetranslateBatch: (
    item: SavedTranslation,
    batchIndex: number,
    mode: "single" | "fromHere"
  ) => void;
  isPausedInQueue: boolean;
  isWaitingInQueue: boolean;
  isTranslating: boolean;
  batchRetranslateJob?: TranslationJob | null;
  pausedBatchRetranslation?: {
    batchIndex: number;
    mode: "single" | "fromHere";
    translationId?: string;
  } | null;
  retranslatingTranslationId?: string | null;
  styles: any;
}

const TranslationItem: React.FC<TranslationItemProps> = ({
  item,
  index,
  isExpanded,
  batches,
  activeTranslationId,
  onSelect,
  onDelete,
  onResume,
  onRetranslateBatch,
  onStopBatchRetranslate,
  onResumeBatchRetranslate,
  onCancelBatchRetranslate,
  onToggleExpand,
  handleRetranslateBatch,
  isPausedInQueue,
  isWaitingInQueue,
  isTranslating,
  batchRetranslateJob,
  pausedBatchRetranslation,
  retranslatingTranslationId,
  styles,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const progressPercent = getProgressPercent(item);
  // Show batch retranslation status only for the translation being retranslated
  // If no specific translation ID is tracked, fallback to first translation (index 0)
  const hasBatchRetranslation = !!(
    batchRetranslateJob || pausedBatchRetranslation
  );
  const hasSpecificTranslationId = !!(
    retranslatingTranslationId ||
    batchRetranslateJob?.existingTranslationId ||
    pausedBatchRetranslation?.translationId
  );
  const isThisTranslationBeingRetranslated = hasSpecificTranslationId
    ? retranslatingTranslationId === item.id ||
      batchRetranslateJob?.existingTranslationId === item.id ||
      pausedBatchRetranslation?.translationId === item.id
    : hasBatchRetranslation && index === 0; // Fallback to first translation

  return (
    <View
      style={[
        styles.translationItem,
        item.id === activeTranslationId && styles.translationItemActive,
        item.isPartial && styles.translationItemPartial,
        isExpanded && styles.translationItemExpanded,
      ]}
    >
      {/* Header - always visible */}
      <TouchableOpacity
        style={styles.translationHeader}
        onPress={() => onToggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.translationHeaderLeft}>
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-down" : "chevron-right"}
            size={20}
            color={colors.textMuted}
          />
          <MaterialCommunityIcons
            name={
              item.isPartial
                ? "progress-clock"
                : item.id === activeTranslationId
                ? "check-circle"
                : "file-document-outline"
            }
            size={16}
            color={
              item.isPartial
                ? colors.warning
                : item.id === activeTranslationId
                ? colors.success
                : colors.textMuted
            }
          />
          <View style={styles.translationHeaderInfo}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              <Text style={styles.translationConfig}>{item.configName}</Text>
              {getPresetName(item.presetId) && (
                <View style={styles.presetBadge}>
                  <MaterialCommunityIcons
                    name="tag-outline"
                    size={10}
                    color={colors.primary}
                  />
                  <Text style={styles.presetBadgeText}>
                    {getPresetName(item.presetId)}
                  </Text>
                </View>
              )}
              {getBatchSettingsInfo(item) && (
                <View style={styles.settingsBadge}>
                  <MaterialCommunityIcons
                    name="cog-outline"
                    size={10}
                    color={colors.textMuted}
                  />
                  <Text style={styles.settingsBadgeText}>
                    {getBatchSettingsInfo(item)}
                  </Text>
                </View>
              )}
              {/* Time range badge - compact, only show if has time range */}
              {(item.rangeStart !== undefined ||
                item.rangeEnd !== undefined) && (
                <View
                  style={[
                    styles.settingsBadge,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="clock-time-four-outline"
                    size={10}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.settingsBadgeText,
                      { color: colors.primary },
                    ]}
                  >
                    {formatTime(item.rangeStart || 0)}-
                    {formatTime(item.rangeEnd || item.videoDuration || 0)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.translationDate}>
              {formatDate(item.createdAt)}
              {item.isPartial && ` • ${progressPercent}%`}
            </Text>
          </View>
        </View>
        {/* Quick actions on header */}
        <View style={styles.translationHeaderActions}>
          {item.isPartial &&
            onResume &&
            !isPausedInQueue &&
            !isWaitingInQueue &&
            !isTranslating &&
            !batchRetranslateJob &&
            !pausedBatchRetranslation && (
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onResume(item);
                }}
              >
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={20}
                  color={colors.success}
                />
              </TouchableOpacity>
            )}
        </View>
      </TouchableOpacity>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.translationExpanded}>
          {/* Progress bar for partial */}
          {item.isPartial && (
            <View style={styles.expandedProgressContainer}>
              <View style={styles.partialProgressBar}>
                <View
                  style={[
                    styles.partialProgressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
              <Text style={styles.partialProgressText}>
                {t("subtitleModal.translate.partial")} • {item.completedBatches}/
                {item.totalBatches || "?"} batches
              </Text>
            </View>
          )}

          {/* Batch grid */}
          {batches.length > 0 && (
            <View style={styles.batchesContainer}>
              <Text style={styles.batchesTitle}>
                {t("subtitleModal.translate.batchList")}
              </Text>

              {/* Retranslation status bar for fromHere mode */}
              {isThisTranslationBeingRetranslated &&
                (batchRetranslateJob || pausedBatchRetranslation) && (
                  <RetranslationStatusBar
                    item={item}
                    batchRetranslateJob={batchRetranslateJob}
                    pausedBatchRetranslation={pausedBatchRetranslation}
                    onStopBatchRetranslate={onStopBatchRetranslate}
                    onResumeBatchRetranslate={onResumeBatchRetranslate}
                    onCancelBatchRetranslate={onCancelBatchRetranslate}
                  />
                )}

              <View style={styles.batchesGrid}>
                {batches.map((batch) => {
                  const state = getBatchDisplayState(batch, item, {
                    batchRetranslateJob,
                    pausedBatchRetranslation,
                    isWaitingInQueue,
                  });
                  return (
                    <BatchChip
                      key={batch.index}
                      batch={batch}
                      item={item}
                      state={state}
                      styles={styles}
                      onRetranslateBatch={onRetranslateBatch}
                      handleRetranslateBatch={handleRetranslateBatch}
                      batchRetranslateJob={batchRetranslateJob}
                      pausedBatchRetranslation={pausedBatchRetranslation}
                      isTranslating={isTranslating}
                      isPausedInQueue={isPausedInQueue}
                      isWaitingInQueue={isWaitingInQueue}
                    />
                  );
                })}
              </View>
              {!batchRetranslateJob && !pausedBatchRetranslation && (
                <Text style={styles.batchesHint}>
                  {t("subtitleModal.translate.retranslateHint")}
                </Text>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.expandedActions}>
            <TouchableOpacity
              style={[
                styles.expandedActionBtn,
                styles.expandedActionBtnPrimary,
              ]}
              onPress={() => onSelect(item)}
            >
              <MaterialCommunityIcons
                name="check"
                size={18}
                color={colors.onPrimary}
              />
              <Text style={styles.expandedActionBtnTextPrimary}>
                {t("subtitleModal.translate.useThis")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.expandedActionBtn, styles.expandedActionBtnDanger]}
              onPress={() => onDelete(item)}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={18}
                color={colors.error}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default TranslationItem;

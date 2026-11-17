import React from "react";
import { TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { useTheme } from "@src/contexts";
import type { SavedTranslation, TranslationJob } from "@src/types";
import {
  formatDate,
  formatTime,
  getBatchSettingsInfo,
  getPresetName,
  getProgressPercent,
} from "./translationListUtils";
import RetranslationStatusBar from "./RetranslationStatusBar";

interface TranslationItemProps {
  item: SavedTranslation;
  index: number;
  activeTranslationId: string | null;
  onSelect: (translation: SavedTranslation) => void;
  onDelete: (translation: SavedTranslation) => void;
  onResume?: (translation: SavedTranslation) => void;
  onOpenBatchEditor?: (translation: SavedTranslation) => void;
  onStopBatchRetranslate?: () => void;
  onResumeBatchRetranslate?: () => void;
  onCancelBatchRetranslate?: () => void;
  isPausedInQueue: boolean;
  isWaitingInQueue: boolean;
  isTranslating: boolean;
  batchRetranslateJob?: TranslationJob | null;
  pausedBatchRetranslation?: {
    batchIndex: number;
    mode: "single" | "fromHere";
    batchIndices?: number[];
    completedBatches?: number;
    totalBatches?: number;
    translationId?: string;
  } | null;
  retranslatingTranslationId?: string | null;
  styles: any;
}

const TranslationItem: React.FC<TranslationItemProps> = ({
  item,
  index,
  activeTranslationId,
  onSelect,
  onDelete,
  onResume,
  onOpenBatchEditor,
  onStopBatchRetranslate,
  onResumeBatchRetranslate,
  onCancelBatchRetranslate,
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
  const isActive = item.id === activeTranslationId;
  const progressPercent = getProgressPercent(item);
  const canResume = Boolean(
    item.isPartial &&
      onResume &&
      !isPausedInQueue &&
      !isWaitingInQueue &&
      !isTranslating &&
      !batchRetranslateJob &&
      !pausedBatchRetranslation,
  );

  const hasBatchRetranslation = Boolean(
    batchRetranslateJob || pausedBatchRetranslation,
  );
  const trackedTranslationId =
    retranslatingTranslationId ||
    batchRetranslateJob?.existingTranslationId ||
    pausedBatchRetranslation?.translationId;
  const isThisTranslationBeingRetranslated = trackedTranslationId
    ? trackedTranslationId === item.id
    : hasBatchRetranslation && index === 0;

  const handleOpen = () => {
    if (item.isPartial) {
      if (canResume) onResume?.(item);
      return;
    }
    onOpenBatchEditor?.(item);
  };

  return (
    <View
      style={[
        styles.translationItem,
        isActive && styles.translationItemActive,
        item.isPartial && styles.translationItemPartial,
      ]}
    >
      <View style={styles.translationHeader}>
        <TouchableOpacity
          style={styles.translationHeaderMain}
          onPress={handleOpen}
          disabled={item.isPartial ? !canResume : !onOpenBatchEditor}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            item.isPartial
              ? t("subtitleModal.translate.resume")
              : t("subtitleModal.translate.batchEditor.title")
          }
        >
          <View
            style={[
              styles.translationIcon,
              item.isPartial && styles.translationIconPartial,
              isActive && styles.translationIconActive,
            ]}
          >
            <MaterialCommunityIcons
              name={
                item.isPartial
                  ? "progress-clock"
                  : isActive
                    ? "check"
                    : "playlist-edit"
              }
              size={19}
              color={
                item.isPartial
                  ? colors.warning
                  : isActive
                    ? colors.success
                    : colors.primary
              }
            />
          </View>

          <View style={styles.translationHeaderInfo}>
            <View style={styles.translationMetaRow}>
              <Text style={styles.translationConfig} numberOfLines={1}>
                {item.configName}
              </Text>
              {getPresetName(item.presetId) && (
                <View style={styles.presetBadge}>
                  <MaterialCommunityIcons
                    name="tag-outline"
                    size={10}
                    color={colors.primary}
                  />
                  <Text style={styles.presetBadgeText} numberOfLines={1}>
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
                  <Text style={styles.settingsBadgeText} numberOfLines={1}>
                    {getBatchSettingsInfo(item)}
                  </Text>
                </View>
              )}
              {(item.rangeStart !== undefined ||
                item.rangeEnd !== undefined) && (
                <View style={[styles.settingsBadge, styles.rangeBadge]}>
                  <MaterialCommunityIcons
                    name="clock-time-four-outline"
                    size={10}
                    color={colors.primary}
                  />
                  <Text style={styles.rangeBadgeText} numberOfLines={1}>
                    {formatTime(item.rangeStart || 0)}-
                    {formatTime(item.rangeEnd || item.videoDuration || 0)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.translationDate} numberOfLines={1}>
              {formatDate(item.createdAt)}
              {item.isPartial && ` • ${progressPercent}%`}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.translationHeaderActions}>
          {item.isPartial ? (
            <TouchableOpacity
              style={[
                styles.translationActionButton,
                styles.translationActionResume,
                !canResume && styles.translationActionDisabled,
              ]}
              onPress={() => onResume?.(item)}
              disabled={!canResume}
              accessibilityRole="button"
              accessibilityLabel={t("subtitleModal.translate.resume")}
            >
              <MaterialCommunityIcons
                name="play"
                size={20}
                color={canResume ? colors.success : colors.textMuted}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.translationActionButton,
                styles.translationActionSelect,
                isActive && styles.translationActionSelected,
              ]}
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={t("subtitleModal.translate.useThis")}
              accessibilityState={{ selected: isActive }}
            >
              <MaterialCommunityIcons
                name={isActive ? "check-circle" : "check-circle-outline"}
                size={21}
                color={isActive ? colors.success : colors.primary}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.translationActionButton,
              styles.translationActionDelete,
            ]}
            onPress={() => onDelete(item)}
            accessibilityRole="button"
            accessibilityLabel={t("common.delete")}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={20}
              color={colors.error}
            />
          </TouchableOpacity>
        </View>
      </View>

      {item.isPartial && (
        <View style={styles.compactProgressContainer}>
          <View style={styles.partialProgressBar}>
            <View
              style={[
                styles.partialProgressFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.partialProgressText}>
            {t("subtitleModal.translate.partial")} • {item.completedBatches || 0}/
            {item.totalBatches || "?"}
          </Text>
        </View>
      )}

      {isThisTranslationBeingRetranslated &&
        (batchRetranslateJob || pausedBatchRetranslation) && (
          <View style={styles.retranslationStatusContainer}>
            <RetranslationStatusBar
              item={item}
              batchRetranslateJob={batchRetranslateJob}
              pausedBatchRetranslation={pausedBatchRetranslation}
              onStopBatchRetranslate={onStopBatchRetranslate}
              onResumeBatchRetranslate={onResumeBatchRetranslate}
              onCancelBatchRetranslate={onCancelBatchRetranslate}
            />
          </View>
        )}
    </View>
  );
};

export default TranslationItem;

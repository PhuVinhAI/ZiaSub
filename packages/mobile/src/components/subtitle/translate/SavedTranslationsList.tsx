import React, { useMemo } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles } from "@hooks/useThemedStyles";
import type { SavedTranslation, TranslationJob } from "@src/types";
import { createTranslateStyles } from "./translateStyles";
// Tách từ file này sang file riêng — chỉ import, không sửa logic
import {
  getBatchesInfo as getBatchesInfoUtil,
  type BatchInfo,
} from "./translationListUtils";
import { useExpandedTranslation } from "./useExpandedTranslation";
import TranslationItem from "./TranslationItem";

interface SavedTranslationsListProps {
  translations: SavedTranslation[];
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
  videoDuration?: number;
  isPausedInQueue?: boolean;
  isWaitingInQueue?: boolean;
  isTranslating?: boolean;
  // Batch retranslation state
  batchRetranslateJob?: TranslationJob | null;
  // Paused batch retranslation info
  pausedBatchRetranslation?: {
    batchIndex: number;
    mode: "single" | "fromHere";
    translationId?: string; // ID of translation being retranslated
  } | null;
  // ID of translation currently being retranslated
  retranslatingTranslationId?: string | null;
  // Presub mode for first batch yellow highlighting
  presubMode?: boolean;
}

const SavedTranslationsList: React.FC<SavedTranslationsListProps> = ({
  translations,
  activeTranslationId,
  onSelect,
  onDelete,
  onResume,
  onRetranslateBatch,
  onStopBatchRetranslate,
  onResumeBatchRetranslate,
  onCancelBatchRetranslate,
  videoDuration,
  isPausedInQueue = false,
  isWaitingInQueue = false,
  isTranslating = false,
  batchRetranslateJob,
  pausedBatchRetranslation,
  retranslatingTranslationId,
  presubMode = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(() => createTranslateStyles(colors));

  // Calculate batches for a translation — tách sang translationListUtils.ts, delegate
  const getBatchesInfo = useMemo(() => {
    return (item: SavedTranslation): BatchInfo[] =>
      getBatchesInfoUtil(item, videoDuration);
  }, [videoDuration]);

  // Expand/collapse state + auto-expand effect
  // NOTE: useExpandedTranslation must be called before the early return to keep hooks order
  const { expandedId, toggleExpand } = useExpandedTranslation({
    translations,
    batchRetranslateJob,
    pausedBatchRetranslation,
    retranslatingTranslationId,
  });

  if (translations.length === 0) return null;

  const handleRetranslateBatch = (
    item: SavedTranslation,
    batchIndex: number,
    mode: "single" | "fromHere"
  ) => {
    if (onRetranslateBatch) {
      onRetranslateBatch(item, batchIndex, mode);
    }
  };

  return (
    <View style={styles.translationsSection}>
      <Text style={styles.sectionTitle}>
        {t("subtitleModal.translate.savedTranslations")}
      </Text>
      <View style={styles.translationsList}>
        {translations.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const batches = isExpanded ? getBatchesInfo(item) : [];

          return (
            <TranslationItem
              key={item.id}
              item={item}
              index={index}
              isExpanded={isExpanded}
              batches={batches}
              activeTranslationId={activeTranslationId}
              onSelect={onSelect}
              onDelete={onDelete}
              onResume={onResume}
              onRetranslateBatch={onRetranslateBatch}
              onStopBatchRetranslate={onStopBatchRetranslate}
              onResumeBatchRetranslate={onResumeBatchRetranslate}
              onCancelBatchRetranslate={onCancelBatchRetranslate}
              onToggleExpand={toggleExpand}
              handleRetranslateBatch={handleRetranslateBatch}
              isPausedInQueue={isPausedInQueue}
              isWaitingInQueue={isWaitingInQueue}
              isTranslating={isTranslating}
              batchRetranslateJob={batchRetranslateJob}
              pausedBatchRetranslation={pausedBatchRetranslation}
              retranslatingTranslationId={retranslatingTranslationId}
              styles={styles}
            />
          );
        })}
      </View>
    </View>
  );
};

export default SavedTranslationsList;

import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles } from "@hooks/useThemedStyles";
import type { SavedTranslation, TranslationJob } from "@src/types";
import { createTranslateStyles } from "./translateStyles";
import TranslationItem from "./TranslationItem";

interface SavedTranslationsListProps {
  translations: SavedTranslation[];
  activeTranslationId: string | null;
  onSelect: (translation: SavedTranslation) => void;
  onDelete: (translation: SavedTranslation) => void;
  onResume?: (translation: SavedTranslation) => void;
  onOpenBatchEditor?: (translation: SavedTranslation) => void;
  onStopBatchRetranslate?: () => void;
  onResumeBatchRetranslate?: () => void;
  onCancelBatchRetranslate?: () => void;
  isPausedInQueue?: boolean;
  isWaitingInQueue?: boolean;
  isTranslating?: boolean;
  // Batch retranslation state
  batchRetranslateJob?: TranslationJob | null;
  // Paused batch retranslation info
  pausedBatchRetranslation?: {
    batchIndex: number;
    mode: "single" | "fromHere";
    batchIndices?: number[];
    completedBatches?: number;
    totalBatches?: number;
    translationId?: string; // ID of translation being retranslated
  } | null;
  // ID of translation currently being retranslated
  retranslatingTranslationId?: string | null;
}

const SavedTranslationsList: React.FC<SavedTranslationsListProps> = ({
  translations,
  activeTranslationId,
  onSelect,
  onDelete,
  onResume,
  onOpenBatchEditor,
  onStopBatchRetranslate,
  onResumeBatchRetranslate,
  onCancelBatchRetranslate,
  isPausedInQueue = false,
  isWaitingInQueue = false,
  isTranslating = false,
  batchRetranslateJob,
  pausedBatchRetranslation,
  retranslatingTranslationId,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(() => createTranslateStyles(colors));

  if (translations.length === 0) return null;

  return (
    <View style={styles.translationsSection}>
      <Text style={styles.sectionTitle}>
        {t("subtitleModal.translate.savedTranslations")}
      </Text>
      <View style={styles.translationsList}>
        {translations.map((item, index) => {
          return (
            <TranslationItem
              key={item.id}
              item={item}
              index={index}
              activeTranslationId={activeTranslationId}
              onSelect={onSelect}
              onDelete={onDelete}
              onResume={onResume}
              onOpenBatchEditor={onOpenBatchEditor}
              onStopBatchRetranslate={onStopBatchRetranslate}
              onResumeBatchRetranslate={onResumeBatchRetranslate}
              onCancelBatchRetranslate={onCancelBatchRetranslate}
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

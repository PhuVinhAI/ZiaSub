/**
 * useExpandedTranslation — expand/collapse state + auto-expand effect
 *
 * Tách từ SavedTranslationsList.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import React, { useState } from "react";
import { LayoutAnimation } from "react-native";
import type { SavedTranslation, TranslationJob } from "@src/types";

interface UseExpandedTranslationParams {
  translations: SavedTranslation[];
  batchRetranslateJob?: TranslationJob | null;
  pausedBatchRetranslation?: {
    batchIndex: number;
    mode: "single" | "fromHere";
    translationId?: string;
  } | null;
  retranslatingTranslationId?: string | null;
}

export function useExpandedTranslation({
  translations,
  batchRetranslateJob,
  pausedBatchRetranslation,
  retranslatingTranslationId,
}: UseExpandedTranslationParams) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-expand the translation being retranslated when there's a batch retranslation in progress or paused
  // Must be before early return to maintain hooks order
  React.useEffect(() => {
    if (
      (batchRetranslateJob ||
        pausedBatchRetranslation ||
        retranslatingTranslationId) &&
      translations.length > 0 &&
      !expandedId
    ) {
      // Find the translation being retranslated
      const targetId =
        retranslatingTranslationId ||
        batchRetranslateJob?.existingTranslationId ||
        pausedBatchRetranslation?.translationId;

      if (targetId) {
        // Expand the specific translation being retranslated
        const targetTranslation = translations.find((t) => t.id === targetId);
        if (targetTranslation) {
          setExpandedId(targetId);
          return;
        }
      }
      // Fallback to first translation if target not found
      setExpandedId(translations[0].id);
    }
  }, [
    batchRetranslateJob,
    pausedBatchRetranslation,
    retranslatingTranslationId,
    translations,
    expandedId,
  ]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return { expandedId, toggleExpand };
}

/**
 * RetranslationStatusBar — status + action buttons for batch retranslation
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

interface RetranslationStatusBarProps {
  item: SavedTranslation;
  batchRetranslateJob?: TranslationJob | null;
  pausedBatchRetranslation?: {
    batchIndex: number;
    mode: "single" | "fromHere";
    translationId?: string;
  } | null;
  onStopBatchRetranslate?: () => void;
  onResumeBatchRetranslate?: () => void;
  onCancelBatchRetranslate?: () => void;
}

const RetranslationStatusBar: React.FC<RetranslationStatusBarProps> = ({
  item,
  batchRetranslateJob,
  pausedBatchRetranslation,
  onStopBatchRetranslate,
  onResumeBatchRetranslate,
  onCancelBatchRetranslate,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor:
          batchRetranslateJob?.status === "processing"
            ? colors.primarySoft
            : pausedBatchRetranslation
            ? colors.warningBg
            : colors.primarySoft,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor:
          batchRetranslateJob?.status === "processing"
            ? colors.primary
            : pausedBatchRetranslation
            ? colors.warning
            : colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <MaterialCommunityIcons
          name={
            batchRetranslateJob?.status === "processing"
              ? "translate"
              : pausedBatchRetranslation
              ? "pause-circle"
              : "clock-outline"
          }
          size={18}
          color={
            batchRetranslateJob?.status === "processing"
              ? colors.primary
              : pausedBatchRetranslation
              ? colors.warning
              : colors.primary
          }
        />
        <Text
          style={{
            color:
              batchRetranslateJob?.status === "processing"
                ? colors.primary
                : pausedBatchRetranslation
                ? colors.warning
                : colors.primary,
            fontSize: 12,
            fontWeight: "600",
            flex: 1,
          }}
        >
          {batchRetranslateJob?.status === "processing"
            ? pausedBatchRetranslation?.mode === "single" ||
              (batchRetranslateJob.rangeEnd !== undefined &&
                batchRetranslateJob.rangeEnd -
                  (batchRetranslateJob.rangeStart || 0) <=
                  (item.batchSettings?.maxVideoDuration || 600))
              ? t("subtitleModal.translate.retranslatingSingle", {
                  batch:
                    Math.floor(
                      (batchRetranslateJob.rangeStart || 0) /
                        (item.batchSettings?.maxVideoDuration || 600)
                    ) + 1,
                })
              : t("subtitleModal.translate.retranslatingFrom", {
                  batch:
                    Math.floor(
                      (batchRetranslateJob.rangeStart || 0) /
                        (item.batchSettings?.maxVideoDuration || 600)
                    ) + 1,
                })
            : pausedBatchRetranslation
            ? pausedBatchRetranslation.mode === "single"
              ? t("subtitleModal.translate.pausedBatchSingle", {
                  batch: pausedBatchRetranslation.batchIndex + 1,
                })
              : t("subtitleModal.translate.pausedBatchFrom", {
                  batch: pausedBatchRetranslation.batchIndex + 1,
                })
            : t("subtitleModal.translate.waitingBatch")}
        </Text>
      </View>

      {/* Action buttons */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginTop: 10,
        }}
      >
        {/* Stop/Pause button when processing */}
        {batchRetranslateJob?.status === "processing" &&
          onStopBatchRetranslate && (
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: colors.warning,
              }}
              onPress={onStopBatchRetranslate}
            >
              <MaterialCommunityIcons
                name="pause"
                size={16}
                color={colors.onWarning}
              />
              <Text
                style={{
                  color: colors.onWarning,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {t("subtitleModal.translate.pauseRetranslate")}
              </Text>
            </TouchableOpacity>
          )}

        {/* Cancel button when processing */}
        {batchRetranslateJob?.status === "processing" &&
          onCancelBatchRetranslate && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: colors.error,
              }}
              onPress={onCancelBatchRetranslate}
            >
              <MaterialCommunityIcons
                name="close"
                size={16}
                color={colors.onError}
              />
              <Text
                style={{
                  color: colors.onError,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          )}

        {/* Cancel button when waiting in queue */}
        {batchRetranslateJob &&
          batchRetranslateJob.status !== "processing" &&
          !pausedBatchRetranslation &&
          onCancelBatchRetranslate && (
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: colors.error,
              }}
              onPress={onCancelBatchRetranslate}
            >
              <MaterialCommunityIcons
                name="close"
                size={16}
                color={colors.onError}
              />
              <Text
                style={{
                  color: colors.onError,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          )}

        {/* Resume button when paused */}
        {pausedBatchRetranslation &&
          !batchRetranslateJob &&
          onResumeBatchRetranslate && (
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: colors.success,
              }}
              onPress={onResumeBatchRetranslate}
            >
              <MaterialCommunityIcons
                name="play"
                size={16}
                color={colors.onSuccess}
              />
              <Text
                style={{
                  color: colors.onSuccess,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {t("subtitleModal.translate.resumeRetranslate")}
              </Text>
            </TouchableOpacity>
          )}

        {/* Cancel button when paused */}
        {pausedBatchRetranslation &&
          !batchRetranslateJob &&
          onCancelBatchRetranslate && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: colors.error,
              }}
              onPress={onCancelBatchRetranslate}
            >
              <MaterialCommunityIcons
                name="close"
                size={16}
                color={colors.onError}
              />
              <Text
                style={{
                  color: colors.onError,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          )}
      </View>
    </View>
  );
};

export default RetranslationStatusBar;

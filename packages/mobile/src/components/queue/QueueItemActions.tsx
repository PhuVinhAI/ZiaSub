/**
 * Queue Item Actions (button row)
 *
 * Tách từ QueueItemCard.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import type { QueueItem } from "@src/types";
import type { QueueItemState } from "./queueItemState";

interface QueueItemActionsProps {
  item: QueueItem;
  state: QueueItemState;
  hasApiKey: boolean;
  onStart: (item: QueueItem) => void;
  onResume?: (item: QueueItem) => void;
  onRequeue: (item: QueueItem) => void;
  onRemove: (item: QueueItem) => void;
  onStop?: (item: QueueItem) => void;
  onAbort?: (item: QueueItem) => void;
  styles: any;
}

const QueueItemActions: React.FC<QueueItemActionsProps> = ({
  item,
  state,
  hasApiKey,
  onStart,
  onResume,
  onRequeue,
  onRemove,
  onStop,
  onAbort,
  styles,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isActivelyTranslating, isPaused, isWaitingInQueue } = state;

  return (
    <View style={styles.actions}>
      {(item.status === "pending" || item.status === "error") && (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.actionBtnPrimary,
            !hasApiKey && styles.actionBtnDisabled,
          ]}
          onPress={() => onStart(item)}
          disabled={!hasApiKey}
          activeOpacity={0.72}
          accessibilityRole="button"
          accessibilityLabel={t("queue.dialogs.translate")}
        >
          <MaterialCommunityIcons
            name="play"
            size={22}
            color={hasApiKey ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      )}

      {(isActivelyTranslating || isWaitingInQueue) && (
        <>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnWarning]}
            onPress={() => onStop?.(item)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={
              isWaitingInQueue ? t("queue.cancelWaiting") : t("common.stop")
            }
          >
            <MaterialCommunityIcons
              name={isWaitingInQueue ? "playlist-minus" : "pause"}
              size={22}
              color={colors.warning}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => onAbort?.(item)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t("common.remove")}
          >
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={22}
              color={colors.error}
            />
          </TouchableOpacity>
        </>
      )}

      {isPaused && (
        <>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnSuccess,
              !hasApiKey && styles.actionBtnDisabled,
            ]}
            onPress={() => onResume?.(item)}
            disabled={!hasApiKey}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t("queue.dialogs.resume")}
          >
            <MaterialCommunityIcons
              name="play"
              size={22}
              color={hasApiKey ? colors.success : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => onRemove(item)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t("common.delete")}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={22}
              color={colors.error}
            />
          </TouchableOpacity>
        </>
      )}

      {item.status === "completed" && (
        <>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => onRequeue(item)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t("common.retry")}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => onRemove(item)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t("common.delete")}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={22}
              color={colors.error}
            />
          </TouchableOpacity>
        </>
      )}

      {(item.status === "pending" || item.status === "error") && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDanger]}
          onPress={() => onRemove(item)}
          activeOpacity={0.72}
          accessibilityRole="button"
          accessibilityLabel={t("common.delete")}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={22}
            color={colors.error}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default QueueItemActions;

/**
 * Queue Item Actions (button row)
 *
 * Tách từ QueueItemCard.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const { colors } = useTheme();
  const { isActivelyTranslating, isPaused, isWaitingInQueue } = state;

  return (
    <View style={styles.actions}>
      {(item.status === "pending" || item.status === "error") && (
        <TouchableOpacity
          style={[styles.actionBtn, !hasApiKey && styles.actionBtnDisabled]}
          onPress={() => onStart(item)}
          disabled={!hasApiKey}
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
            style={styles.actionBtn}
            onPress={() => onStop?.(item)}
          >
            <MaterialCommunityIcons
              name="pause"
              size={22}
              color={colors.warning}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onAbort?.(item)}
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
            style={[styles.actionBtn, !hasApiKey && styles.actionBtnDisabled]}
            onPress={() => onResume?.(item)}
            disabled={!hasApiKey}
          >
            <MaterialCommunityIcons
              name="play"
              size={22}
              color={hasApiKey ? colors.success : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onRemove(item)}
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
            style={styles.actionBtn}
            onPress={() => onRequeue(item)}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onRemove(item)}
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
          style={styles.actionBtn}
          onPress={() => onRemove(item)}
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

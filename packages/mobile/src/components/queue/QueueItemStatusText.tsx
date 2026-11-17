/**
 * Queue Item Status Text (footer)
 *
 * Tách từ QueueItemCard.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import type { QueueItem } from "@src/types";
import type { QueueItemState } from "./queueItemState";
import type { StatusStyle } from "./queueItemState";
import { formatDate, formatTimeRange } from "./queueFormatters";

interface QueueItemStatusTextProps {
  item: QueueItem;
  state: QueueItemState;
  queuePosition?: number;
  totalInQueue?: number;
  statusStyle: StatusStyle;
  styles: any;
}

const QueueItemStatusText: React.FC<QueueItemStatusTextProps> = ({
  item,
  state,
  queuePosition,
  totalInQueue,
  statusStyle,
  styles,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    isActivelyTranslating,
    isBatchRetranslation,
    isTimeRangeTranslation,
    isPaused,
    isWaitingInQueue,
    isBatchRetranslationWaiting,
    isTimeRangeTranslationWaiting,
  } = state;

  return (
    <View style={styles.footer}>
      <MaterialCommunityIcons
        name={statusStyle.icon}
        size={13}
        color={statusStyle.color}
      />
      {item.status === "pending" && (
        <Text style={styles.statusText}>
          {t("queue.status.added", { date: formatDate(item.addedAt) })}
        </Text>
      )}
      {isActivelyTranslating &&
        !isBatchRetranslation &&
        !isTimeRangeTranslation && (
          <Text style={[styles.statusText, { color: colors.primary }]}>
            {t("queue.status.translating")} ({item.progress!.completed}/
            {item.progress!.total})
          </Text>
        )}
      {isActivelyTranslating &&
        isTimeRangeTranslation &&
        !isBatchRetranslation && (
          <Text style={[styles.statusText, { color: colors.primary }]}>
            {t("queue.status.translatingRange", {
              start: formatTimeRange(item.rangeStart || 0),
              end: formatTimeRange(item.rangeEnd || item.duration || 0),
            })}{" "}
            ({item.progress!.completed}/{item.progress!.total})
          </Text>
        )}
      {isActivelyTranslating && isBatchRetranslation && (
        <Text style={[styles.statusText, { color: colors.primary }]}>
          {item.retranslateBatchIndices?.length
            ? t("queue.status.retranslatingSelected", {
                completed: item.progress?.completed || 0,
                total:
                  item.progress?.total || item.retranslateBatchIndices.length,
              })
            : item.retranslateMode === "single"
            ? t("queue.status.retranslatingSingle", {
                batch: (item.retranslateBatchIndex || 0) + 1,
              })
            : t("queue.status.retranslatingFrom", {
                batch: (item.retranslateBatchIndex || 0) + 1,
              })}
        </Text>
      )}
      {isPaused && !isBatchRetranslation && !isTimeRangeTranslation && (
        <Text style={[styles.statusText, { color: colors.warning }]}>
          {t("queue.status.paused", {
            completed: item.completedBatches,
            total: item.totalBatches || "?",
          })}
        </Text>
      )}
      {isPaused && isTimeRangeTranslation && !isBatchRetranslation && (
        <Text style={[styles.statusText, { color: colors.warning }]}>
          {t("queue.status.pausedRange", {
            start: formatTimeRange(item.rangeStart || 0),
            end: formatTimeRange(item.rangeEnd || item.duration || 0),
            completed: item.completedBatches || 0,
            total: item.totalBatches || "?",
          })}
        </Text>
      )}
      {isPaused && isBatchRetranslation && (
        <Text style={[styles.statusText, { color: colors.warning }]}>
          {item.retranslateBatchIndices?.length
            ? t("queue.status.pausedBatchSelected", {
                completed: item.completedBatches || 0,
                total:
                  item.totalBatches || item.retranslateBatchIndices.length,
              })
            : item.retranslateMode === "single"
            ? t("queue.status.pausedBatchSingle", {
                batch: (item.retranslateBatchIndex || 0) + 1,
              })
            : t("queue.status.pausedBatchFrom", {
                batch: (item.retranslateBatchIndex || 0) + 1,
              })}
        </Text>
      )}
      {isWaitingInQueue &&
        !isBatchRetranslationWaiting &&
        !isTimeRangeTranslationWaiting && (
          <Text style={[styles.statusText, { color: colors.primary }]}>
            {queuePosition && totalInQueue
              ? `${t(
                  "queue.status.waiting",
                )} (${queuePosition}/${totalInQueue})`
              : t("queue.status.waiting")}
          </Text>
        )}
      {isWaitingInQueue &&
        isTimeRangeTranslationWaiting &&
        !isBatchRetranslationWaiting && (
          <Text style={[styles.statusText, { color: colors.primary }]}>
            {t("queue.status.waitingRange", {
              start: formatTimeRange(item.rangeStart || 0),
              end: formatTimeRange(item.rangeEnd || item.duration || 0),
            })}
            {queuePosition && totalInQueue
              ? ` (${queuePosition}/${totalInQueue})`
              : ""}
          </Text>
        )}
      {isWaitingInQueue && isBatchRetranslationWaiting && (
        <Text style={[styles.statusText, { color: colors.primary }]}>
          {item.retranslateBatchIndices?.length
            ? t("queue.status.waitingBatchSelected", {
                count: item.retranslateBatchIndices.length,
              })
            : item.retranslateMode === "single"
            ? t("queue.status.waitingBatchSingle", {
                batch: (item.retranslateBatchIndex || 0) + 1,
              })
            : t("queue.status.waitingBatchFrom", {
                batch: (item.retranslateBatchIndex || 0) + 1,
              })}
          {queuePosition && totalInQueue
            ? ` (${queuePosition}/${totalInQueue})`
            : ""}
        </Text>
      )}
      {item.status === "completed" && !isTimeRangeTranslation && (
        <Text style={[styles.statusText, { color: colors.success }]}>
          {t("queue.status.completed", {
            date: formatDate(item.completedAt),
          })}
        </Text>
      )}
      {item.status === "completed" && isTimeRangeTranslation && (
        <Text style={[styles.statusText, { color: colors.success }]}>
          {t("queue.status.completedRange", {
            start: formatTimeRange(item.rangeStart || 0),
            end: formatTimeRange(item.rangeEnd || item.duration || 0),
            date: formatDate(item.completedAt),
          })}
        </Text>
      )}
      {item.status === "error" && (
        <Text
          style={[styles.statusText, { color: colors.error }]}
          numberOfLines={1}
        >
          {item.error || t("common.error")}
        </Text>
      )}
    </View>
  );
};

export default QueueItemStatusText;

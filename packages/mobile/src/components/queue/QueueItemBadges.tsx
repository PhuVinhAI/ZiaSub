/**
 * Queue Item Badges
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
import { formatTimeRange } from "./queueFormatters";

interface QueueItemBadgesProps {
  item: QueueItem;
  state: QueueItemState;
  styles: any;
}

const QueueItemBadges: React.FC<QueueItemBadgesProps> = ({
  item,
  state,
  styles,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    presetName,
    batchSettingsInfo,
    isTimeRangeTranslation,
    isBatchRetranslation,
  } = state;

  if (!(
    item.configName ||
    presetName ||
    batchSettingsInfo ||
    isTimeRangeTranslation ||
    isBatchRetranslation
  )) {
    return null;
  }

  return (
    <View style={styles.configRow}>
      {item.configName && (
        <View style={styles.configBadge}>
          <MaterialCommunityIcons
            name="creation"
            size={10}
            color={colors.primary}
          />
          <Text style={styles.configText} numberOfLines={1}>
            {item.configName}
          </Text>
        </View>
      )}
      {presetName && (
        <View style={styles.presetBadge}>
          <MaterialCommunityIcons
            name="tag-outline"
            size={10}
            color={colors.primary}
          />
          <Text style={styles.presetBadgeText} numberOfLines={1}>
            {presetName}
          </Text>
        </View>
      )}
      {batchSettingsInfo && (
        <View style={styles.settingsBadge}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={10}
            color={colors.textMuted}
          />
          <Text style={styles.settingsBadgeText} numberOfLines={1}>
            {batchSettingsInfo}
          </Text>
        </View>
      )}
      {/* Batch retranslation mode badge */}
      {isBatchRetranslation && (
        <View
          style={[styles.settingsBadge, { backgroundColor: colors.warningBg }]}
        >
          <MaterialCommunityIcons
            name={
              item.retranslateBatchIndices?.length
                ? "checkbox-multiple-marked-outline"
                : item.retranslateMode === "single"
                ? "numeric-1-box"
                : "arrow-right-bold"
            }
            size={10}
            color={colors.warning}
          />
          <Text
            style={[styles.settingsBadgeText, { color: colors.warning }]}
            numberOfLines={1}
          >
            {item.retranslateBatchIndices?.length
              ? t("queue.batchSelected", {
                  count: item.retranslateBatchIndices.length,
                })
              : item.retranslateMode === "single"
              ? t("queue.batchSingle", {
                  batch: (item.retranslateBatchIndex || 0) + 1,
                })
              : t("queue.batchFromHere", {
                  batch: (item.retranslateBatchIndex || 0) + 1,
                })}
          </Text>
        </View>
      )}
      {/* Time range translation mode badge */}
      {isTimeRangeTranslation && !isBatchRetranslation && (
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
            style={[styles.settingsBadgeText, { color: colors.primary }]}
            numberOfLines={1}
          >
            {formatTimeRange(item.rangeStart || 0)} -{" "}
            {formatTimeRange(item.rangeEnd || item.duration || 0)}
          </Text>
        </View>
      )}
    </View>
  );
};

export default QueueItemBadges;

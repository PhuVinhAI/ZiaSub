import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import { useThemedStyles } from "@hooks/useThemedStyles";
import type { QueueItem } from "@src/types";
import { formatDuration } from "./queueFormatters";
import { deriveQueueItemState, getStatusStyle } from "./queueItemState";
import { queueItemCardStyles } from "./queueItemCardStyles";
import QueueItemBadges from "./QueueItemBadges";
import QueueItemStatusText from "./QueueItemStatusText";
import QueueItemActions from "./QueueItemActions";

interface QueueItemCardProps {
  item: QueueItem;
  hasApiKey: boolean;
  queuePosition?: number; // Position in translating queue (1-based)
  totalInQueue?: number; // Total items in translating queue
  onSelect: (item: QueueItem) => void;
  onStart: (item: QueueItem) => void;
  onResume?: (item: QueueItem) => void;
  onRequeue: (item: QueueItem) => void;
  onRemove: (item: QueueItem) => void;
  onStop?: (item: QueueItem) => void;
  onAbort?: (item: QueueItem) => void;
}

const QueueItemCard: React.FC<QueueItemCardProps> = ({
  item,
  hasApiKey,
  queuePosition,
  totalInQueue,
  onSelect,
  onStart,
  onResume,
  onRequeue,
  onRemove,
  onStop,
  onAbort,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(queueItemCardStyles);

  const state = deriveQueueItemState(item);
  const statusStyle = getStatusStyle(state, colors, item);
  const { progressPercent, showProgressBar } = state;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelect(item)}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      {/* Progress bar at bottom */}
      {showProgressBar && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPercent}%`,
                backgroundColor: statusStyle.color,
              },
            ]}
          />
        </View>
      )}

      <View style={styles.cardContent}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />

          {showProgressBar && (
            <View style={styles.progressPercentBadge}>
              <Text style={styles.progressPercentText}>
                {Math.round(progressPercent)}%
              </Text>
            </View>
          )}

          {/* Duration badge - bottom right */}
          {item.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          )}

          {/* Status badge - top left */}
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.color }]}
          >
            <MaterialCommunityIcons
              name={statusStyle.icon}
              size={14}
              color={statusStyle.onColor}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <QueueItemBadges item={item} state={state} styles={styles} />

          <QueueItemStatusText
            item={item}
            state={state}
            queuePosition={queuePosition}
            totalInQueue={totalInQueue}
            statusStyle={statusStyle}
            styles={styles}
          />
        </View>

        {/* Actions */}
        <QueueItemActions
          item={item}
          state={state}
          hasApiKey={hasApiKey}
          onStart={onStart}
          onResume={onResume}
          onRequeue={onRequeue}
          onRemove={onRemove}
          onStop={onStop}
          onAbort={onAbort}
          styles={styles}
        />
      </View>
    </TouchableOpacity>
  );
};

export default QueueItemCard;

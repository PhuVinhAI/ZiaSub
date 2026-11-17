import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { BottomSheetModal, ControlSlider } from "@components/common";
import Button3D from "../common/Button3D";
import type { VideoTimeRange } from "@src/types";

interface VideoTimeRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (range: VideoTimeRange | null) => void;
  currentRange?: VideoTimeRange | null;
  videoDuration?: number;
}

// Format seconds to mm:ss or hh:mm:ss
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const VideoTimeRangePicker: React.FC<VideoTimeRangePickerProps> = ({
  visible,
  onClose,
  onConfirm,
  currentRange,
  videoDuration = 600,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(videoTimeRangePickerThemedStyles);

  const [startValue, setStartValue] = useState(0);
  const [endValue, setEndValue] = useState(videoDuration);
  const minimumGap = Math.min(5, videoDuration);

  useEffect(() => {
    if (visible) {
      if (currentRange) {
        setStartValue(currentRange.startTime);
        setEndValue(currentRange.endTime);
      } else {
        setStartValue(0);
        setEndValue(videoDuration);
      }
    }
  }, [visible, currentRange, videoDuration]);

  const handleStartChange = (value: number) => {
    const maxStart = Math.max(0, endValue - minimumGap);
    setStartValue(Math.min(value, maxStart));
  };

  const handleEndChange = (value: number) => {
    const minEnd = Math.min(videoDuration, startValue + minimumGap);
    setEndValue(Math.max(value, minEnd));
  };

  const handleConfirm = () => {
    if (startValue === 0 && endValue === videoDuration) {
      onConfirm(null);
    } else {
      onConfirm({
        startTime: Math.round(startValue),
        endTime: Math.round(endValue),
      });
    }
    onClose();
  };

  const handleClear = () => {
    onConfirm(null);
    onClose();
  };

  const handleReset = () => {
    setStartValue(0);
    setEndValue(videoDuration);
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t("chat.selectTimeRange")}
      subtitle={t("chat.timeRangeHint")}
      iconName="clock-outline"
      maxHeightRatio={0.82}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={themedStyles.timeBox}>
          <View style={styles.timeItem}>
            <View style={themedStyles.timeIcon}>
              <MaterialCommunityIcons
                name="play"
                size={16}
                color={colors.success}
              />
            </View>
            <Text style={themedStyles.timeLabel}>{t("chat.startTime")}</Text>
            <Text style={themedStyles.timeValue}>{formatTime(startValue)}</Text>
          </View>
          <View style={styles.durationSummary}>
            <View style={themedStyles.durationLine} />
            <Text style={themedStyles.durationValue}>
              {formatTime(endValue - startValue)}
            </Text>
            <View style={themedStyles.durationLine} />
          </View>
          <View style={styles.timeItem}>
            <View style={themedStyles.timeIcon}>
              <MaterialCommunityIcons
                name="stop"
                size={14}
                color={colors.accent}
              />
            </View>
            <Text style={themedStyles.timeLabel}>{t("chat.endTime")}</Text>
            <Text style={themedStyles.timeValue}>{formatTime(endValue)}</Text>
          </View>
        </View>

        <View style={themedStyles.sliderGroup}>
          <ControlSlider
            label={t("chat.startTime")}
            icon="play-outline"
            minimumValue={0}
            maximumValue={Math.max(0, endValue - minimumGap)}
            value={startValue}
            onValueChange={handleStartChange}
            onSlidingComplete={handleStartChange}
            formatValue={formatTime}
            minimumLabel={formatTime(0)}
            maximumLabel={formatTime(Math.max(0, endValue - minimumGap))}
            accentColor={colors.success}
            step={1}
          />
          <ControlSlider
            label={t("chat.endTime")}
            icon="stop-circle-outline"
            minimumValue={Math.min(videoDuration, startValue + minimumGap)}
            maximumValue={videoDuration}
            value={endValue}
            onValueChange={handleEndChange}
            onSlidingComplete={handleEndChange}
            formatValue={formatTime}
            minimumLabel={formatTime(
              Math.min(videoDuration, startValue + minimumGap),
            )}
            maximumLabel={formatTime(videoDuration)}
            accentColor={colors.accent}
            step={1}
          />
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="timeline-clock-outline"
              size={18}
              color={colors.accent}
            />
            <Text style={themedStyles.infoLabel}>
              {t("chat.selectedDuration")}
            </Text>
            <Text style={themedStyles.infoValue}>
              {formatTime(endValue - startValue)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleReset}
            style={themedStyles.resetBtn}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="refresh"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={themedStyles.resetText}>{t("common.reset")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Button3D
              title={t("chat.clearRange")}
              variant="outline"
              onPress={handleClear}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button3D
              title={t("common.confirm")}
              icon="check"
              variant="primary"
              onPress={handleConfirm}
            />
          </View>
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 4 },
  timeItem: {
    alignItems: "center",
    minWidth: 76,
  },
  durationSummary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonRow: {
    flexDirection: "row",
    paddingTop: 8,
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
});

const videoTimeRangePickerThemedStyles = createThemedStyles((colors) => ({
  timeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    gap: 10,
  },
  timeIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 5,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  durationLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  durationValue: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  sliderGroup: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 9,
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accent,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
  },
  resetText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
}));

export default VideoTimeRangePicker;

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { BottomSheetModal } from "@components/common";
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
    const maxStart = Math.max(0, endValue - 5);
    setStartValue(Math.min(value, maxStart));
  };

  const handleEndChange = (value: number) => {
    const minEnd = Math.min(videoDuration, startValue + 5);
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
      maxHeightRatio={0.75}
    >
      {/* Time display */}
      <View style={themedStyles.timeBox}>
        <View style={styles.timeItem}>
          <Text style={themedStyles.timeLabel}>{t("chat.startTime")}</Text>
          <Text style={themedStyles.timeValue}>{formatTime(startValue)}</Text>
        </View>
        <MaterialCommunityIcons
          name="arrow-right"
          size={20}
          color={colors.textMuted}
        />
        <View style={styles.timeItem}>
          <Text style={themedStyles.timeLabel}>{t("chat.endTime")}</Text>
          <Text style={themedStyles.timeValue}>{formatTime(endValue)}</Text>
        </View>
      </View>

      {/* Start Slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderRow}>
          <Text style={themedStyles.sliderTitle}>{t("chat.startTime")}</Text>
          <Text style={themedStyles.sliderValue}>{formatTime(startValue)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={videoDuration}
          value={startValue}
          onValueChange={handleStartChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          step={1}
        />
      </View>

      {/* End Slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderRow}>
          <Text style={themedStyles.sliderTitle}>{t("chat.endTime")}</Text>
          <Text style={themedStyles.sliderValue}>{formatTime(endValue)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={videoDuration}
          value={endValue}
          onValueChange={handleEndChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          step={1}
        />
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
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
        >
          <MaterialCommunityIcons
            name="refresh"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={themedStyles.resetText}>{t("common.reset")}</Text>
        </TouchableOpacity>
      </View>

      {/* Buttons */}
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
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  timeItem: {
    alignItems: "center",
    minWidth: 80,
  },
  sliderSection: {
    marginHorizontal: 4,
    marginTop: 8,
  },
  sliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 8,
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
    marginVertical: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    gap: 16,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sliderTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
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

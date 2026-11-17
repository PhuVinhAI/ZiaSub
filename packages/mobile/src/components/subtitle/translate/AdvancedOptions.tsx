import React, { useCallback } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles } from "@hooks/useThemedStyles";
import {
  BottomSheetModal,
  OptionPickerButton,
  ToggleSettingRow,
} from "@components/common";
import { formatDuration } from "@utils/videoUtils";
import { createTranslateStyles } from "./translateStyles";

// Helper: parse time string to seconds
// Supports: "5" (5 min), "5:30" (5m30s), "1:05:30" (1h5m30s)
const parseTimeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  // Remove non-numeric except ":"
  const cleaned = timeStr.replace(/[^\d:]/g, "");
  const parts = cleaned.split(":").map((p) => parseInt(p, 10) || 0);
  if (parts.length === 1) return parts[0] * 60; // Just minutes
  if (parts.length === 2) return parts[0] * 60 + parts[1]; // m:ss
  return parts[0] * 3600 + parts[1] * 60 + parts[2]; // h:mm:ss
};

// Helper: format seconds to time string
// Under 1 hour: "m:ss", 1 hour+: "h:mm:ss"
const formatSecondsToTime = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
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

// Auto-format time input as user types
// "5" -> "5" (typing minutes)
// "530" -> "5:30" (auto add colon)
// "10530" -> "1:05:30" (with hours)
const formatTimeInput = (input: string): string => {
  // Only keep digits
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  const len = digits.length;

  // 1-2 digits: just minutes (e.g., "5" or "12")
  if (len <= 2) return digits;

  // 3-4 digits: m:ss or mm:ss (e.g., "530" -> "5:30", "1230" -> "12:30")
  if (len <= 4) {
    const secs = digits.slice(-2);
    const mins = digits.slice(0, -2);
    return `${mins}:${secs}`;
  }

  // 5-6 digits: h:mm:ss or hh:mm:ss (e.g., "10530" -> "1:05:30")
  const secs = digits.slice(-2);
  const mins = digits.slice(-4, -2);
  const hours = digits.slice(0, -4);
  return `${hours}:${mins}:${secs}`;
};

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxSeconds?: number;
  colors: any;
  styles: any;
}

const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  placeholder,
  maxSeconds,
  colors,
  styles,
}) => {
  const adjustTime = useCallback(
    (delta: number) => {
      const currentSeconds = parseTimeToSeconds(value || "0:00");
      let newSeconds = currentSeconds + delta;
      if (newSeconds < 0) newSeconds = 0;
      if (maxSeconds !== undefined && newSeconds > maxSeconds) {
        newSeconds = maxSeconds;
      }
      onChange(formatSecondsToTime(newSeconds));
    },
    [value, onChange, maxSeconds]
  );

  const handleTextChange = useCallback(
    (text: string) => {
      const formatted = formatTimeInput(text);
      onChange(formatted);
    },
    [onChange]
  );

  // Format on blur to ensure valid time
  const handleBlur = useCallback(() => {
    if (!value) return;
    let seconds = parseTimeToSeconds(value);
    if (maxSeconds !== undefined && seconds > maxSeconds) {
      seconds = maxSeconds;
    }
    onChange(formatSecondsToTime(seconds));
  }, [value, onChange, maxSeconds]);

  return (
    <View style={styles.timeInputWrapper}>
      <TouchableOpacity
        style={styles.timeAdjustBtn}
        onPress={() => adjustTime(-10)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="minus" size={18} color={colors.text} />
      </TouchableOpacity>
      <TextInput
        style={styles.timeInputField}
        value={value}
        onChangeText={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        maxLength={8}
      />
      <TouchableOpacity
        style={styles.timeAdjustBtn}
        onPress={() => adjustTime(10)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="plus" size={18} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

interface AdvancedOptionsProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  streamingMode: boolean;
  onStreamingModeChange: (value: boolean) => void;
  presubMode: boolean;
  onPresubModeChange: (value: boolean) => void;
  useCustomRange: boolean;
  onUseCustomRangeChange: (value: boolean) => void;
  rangeStartStr: string;
  onRangeStartChange: (value: string) => void;
  rangeEndStr: string;
  onRangeEndChange: (value: string) => void;
  videoDuration?: number;
}

const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  showAdvanced,
  onToggleAdvanced,
  streamingMode,
  onStreamingModeChange,
  presubMode,
  onPresubModeChange,
  useCustomRange,
  onUseCustomRangeChange,
  rangeStartStr,
  onRangeStartChange,
  rangeEndStr,
  onRangeEndChange,
  videoDuration,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(() => createTranslateStyles(colors));
  const activeOptionCount = [streamingMode, presubMode, useCustomRange].filter(
    Boolean,
  ).length;
  const summary =
    activeOptionCount > 0
      ? t("subtitleModal.translate.advancedActiveSummary", {
          count: activeOptionCount,
        })
      : t("subtitleModal.translate.advancedDefaultSummary");

  return (
    <>
      <OptionPickerButton
        label={t("subtitleModal.translate.advancedOptions")}
        value={summary}
        description={t("subtitleModal.translate.advancedDescription")}
        icon="tune-variant"
        onPress={onToggleAdvanced}
        style={styles.advancedLauncher}
      />

      <BottomSheetModal
        visible={showAdvanced}
        onClose={onToggleAdvanced}
        title={t("subtitleModal.translate.advancedOptions")}
        subtitle={t("subtitleModal.translate.advancedDescription")}
        maxHeightRatio={0.8}
        fixedHeight
      >
        <KeyboardAwareScrollView
          style={styles.advancedScroll}
          contentContainerStyle={styles.advancedScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
        >
          <View style={styles.advancedSettingsGroup}>
            <ToggleSettingRow
              value={streamingMode}
              onValueChange={onStreamingModeChange}
              label={t("subtitleModal.translate.streamingMode")}
              description={t("subtitleModal.translate.streamingModeHint")}
              icon="play-speed"
              activeIcon="play-speed"
              divider
            />
            <ToggleSettingRow
              value={presubMode}
              onValueChange={onPresubModeChange}
              label={t("subtitleModal.translate.presubMode")}
              description={t("subtitleModal.translate.presubModeHint")}
              icon="lightning-bolt-outline"
              activeIcon="lightning-bolt"
              activeColor={colors.warning}
              activeBackgroundColor={colors.warningBg}
              divider
            />
            <ToggleSettingRow
              value={useCustomRange}
              onValueChange={onUseCustomRangeChange}
              label={t("subtitleModal.translate.customRange")}
              description={t("subtitleModal.translate.customRangeHint")}
              icon="clock-outline"
              activeIcon="clock-check-outline"
            />
          </View>

          {useCustomRange && (
            <>
              <View style={styles.divider} />
              <View style={styles.rangeSection}>
                <Text style={styles.rangeSectionTitle}>
                  {t("subtitleModal.translate.customRange")}
                </Text>
                <Text style={styles.rangeSectionDescription}>
                  {t("subtitleModal.translate.customRangeEditHint")}
                </Text>

                <View style={styles.rangeInputContainer}>
                  <View style={styles.rangeInputGroup}>
                    <Text style={styles.rangeLabel}>
                      {t("subtitleModal.translate.rangeFrom")}
                    </Text>
                    <TimeInput
                      value={rangeStartStr}
                      onChange={onRangeStartChange}
                      placeholder="0:00"
                      maxSeconds={videoDuration}
                      colors={colors}
                      styles={styles}
                    />
                  </View>
                  <View style={styles.rangeInputGroup}>
                    <Text style={styles.rangeLabel}>
                      {t("subtitleModal.translate.rangeTo")}
                    </Text>
                    <TimeInput
                      value={rangeEndStr}
                      onChange={onRangeEndChange}
                      placeholder={
                        videoDuration
                          ? formatDuration(videoDuration)
                          : t("subtitleModal.translate.rangeEnd")
                      }
                      maxSeconds={videoDuration}
                      colors={colors}
                      styles={styles}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {videoDuration && (
            <>
              <View style={styles.divider} />
              <View style={styles.durationHintContainer}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={17}
                  color={colors.textMuted}
                />
                <Text style={styles.durationHint}>
                  {t("subtitleModal.translate.videoDuration", {
                    duration: formatDuration(videoDuration),
                  })}
                </Text>
              </View>
            </>
          )}
        </KeyboardAwareScrollView>
      </BottomSheetModal>
    </>
  );
};

export default AdvancedOptions;

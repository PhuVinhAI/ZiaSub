import React from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  type LayoutChangeEvent,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import type { VideoTimeRange } from "@src/types";

import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChatInputProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading: boolean;
  videoUrl?: string;
  videoTitle?: string;
  attachVideo: boolean;
  onToggleVideo: () => void;
  configName: string;
  onOpenConfig: () => void;
  onStop?: () => void;
  disabled?: boolean;
  videoTimeRange?: VideoTimeRange | null;
  onOpenTimeRange?: () => void;
  onHeightChange?: (height: number) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  onChangeText,
  onSend,
  isLoading,
  videoUrl,
  videoTitle,
  attachVideo,
  onToggleVideo,
  configName,
  onOpenConfig,
  onStop,
  disabled,
  videoTimeRange,
  onOpenTimeRange,
  onHeightChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(chatInputThemedStyles);
  const insets = useSafeAreaInsets();

  // Format time range for display
  const formatTimeRange = (range: VideoTimeRange) => {
    const formatTime = (seconds: number) => {
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
    return `${formatTime(range.startTime)} - ${formatTime(range.endTime)}`;
  };

  return (
    <View
      onLayout={(event: LayoutChangeEvent) =>
        onHeightChange?.(event.nativeEvent.layout.height)
      }
      style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 14) }]}
    >
      <View style={themedStyles.inputBox}>
        {attachVideo && videoUrl && (
          <View style={themedStyles.attachmentBar}>
            <View style={themedStyles.attachmentIcon}>
              <MaterialCommunityIcons
                name="youtube"
                size={17}
                color={colors.error}
              />
            </View>
            <Text style={themedStyles.attachmentText} numberOfLines={1}>
              {videoTitle || t("chat.video")}
            </Text>
            {videoTimeRange && (
              <TouchableOpacity
                style={themedStyles.timeRangeBadge}
                onPress={onOpenTimeRange}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel={t("chat.selectTimeRange")}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={12}
                  color={colors.accent}
                />
                <Text style={themedStyles.timeRangeText}>
                  {formatTimeRange(videoTimeRange)}
                </Text>
              </TouchableOpacity>
            )}
            {!videoTimeRange && (
              <TouchableOpacity
                style={themedStyles.timeRangeBtn}
                onPress={onOpenTimeRange}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel={t("chat.selectTimeRange")}
              >
                <MaterialCommunityIcons
                  name="clock-plus-outline"
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={themedStyles.attachmentCancelBtn}
              onPress={onToggleVideo}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          style={[themedStyles.input, disabled && styles.inputDisabled]}
          value={inputText}
          onChangeText={onChangeText}
          placeholder={
            disabled
              ? t("chat.inputPlaceholderDisabled")
              : t("chat.inputPlaceholder")
          }
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={4000}
          editable={!disabled}
        />
        <View style={styles.inputBottomRow}>
          {videoUrl && !attachVideo && (
            <TouchableOpacity
              style={themedStyles.videoBtn}
              onPress={onToggleVideo}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={t("chat.video")}
            >
              <MaterialCommunityIcons
                name="youtube"
                size={20}
                color={colors.error}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={themedStyles.modelSelector}
            onPress={onOpenConfig}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t("chat.selectConfig")}
          >
            <MaterialCommunityIcons
              name="creation"
              size={14}
              color={colors.primary}
            />
            <Text style={themedStyles.modelText} numberOfLines={1}>
              {configName}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={15}
              color={colors.textMuted}
            />
          </TouchableOpacity>
          <View style={styles.inputSpacer} />
          {isLoading ? (
            <TouchableOpacity
              style={themedStyles.stopBtn}
              onPress={onStop}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={t("chat.stopGeneration")}
            >
              <MaterialCommunityIcons
                name="stop"
                size={18}
                color={colors.onError}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                themedStyles.sendBtn,
                (!inputText.trim() || disabled) && themedStyles.sendBtnDisabled,
              ]}
              onPress={onSend}
              disabled={!inputText.trim() || disabled}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={t("chat.send")}
            >
              <MaterialCommunityIcons
                name="arrow-up"
                size={20}
                color={
                  inputText.trim() && !disabled
                    ? colors.onPrimary
                    : colors.textMuted
                }
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputArea: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  inputDisabled: { opacity: 0.5 },
  inputBottomRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  inputSpacer: { flex: 1 },
});

const chatInputThemedStyles = createThemedStyles((colors) => ({
  inputBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 9,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  attachmentBar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 42,
    paddingBottom: 8,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 7,
  },
  attachmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.errorBg,
  },
  attachmentText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  attachmentCancelBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
  },
  timeRangeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 30,
    paddingHorizontal: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
  },
  timeRangeText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: "700",
  },
  timeRangeBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 30,
    maxHeight: 120,
    paddingHorizontal: 2,
    paddingVertical: 3,
    marginBottom: 7,
  },
  videoBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.errorBg,
  },
  modelSelector: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    maxWidth: 150,
  },
  modelText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.disabled },
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
}));

export default ChatInput;

import React, { useState, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Markdown from "react-native-markdown-display";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { confirmDestructive } from "../common/CustomAlert";
import type { VideoTimeRange } from "@src/types";

export interface TaskItem {
  id: string;
  command: string;
  result?: string;
  hasVideo?: boolean;
  videoTitle?: string;
  videoUrl?: string;
  videoTimeRange?: VideoTimeRange;
  timestamp: number;
  status: "pending" | "done" | "error";
}

interface TaskCardProps {
  task: TaskItem;
  defaultExpanded?: boolean;
  onCopy?: (text: string) => void;
  onRegenerate?: (task: TaskItem) => void;
  onDelete?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  defaultExpanded = false,
  onCopy,
  onRegenerate,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(taskCardThemedStyles);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const rotateAnim = useRef(
    new Animated.Value(defaultExpanded ? 1 : 0),
  ).current;

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

  const markdownStyles = useMemo(
    () => ({
      body: {
        color: colors.text,
        fontSize: 15,
        lineHeight: 24,
        maxWidth: "100%" as const,
        flexShrink: 1,
      },
      heading1: {
        color: colors.text,
        fontSize: 20,
        fontWeight: "bold" as const,
        marginVertical: 8,
        flexShrink: 1,
      },
      heading2: {
        color: colors.text,
        fontSize: 18,
        fontWeight: "bold" as const,
        marginVertical: 6,
        flexShrink: 1,
      },
      heading3: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "600" as const,
        marginVertical: 4,
        flexShrink: 1,
      },
      paragraph: {
        color: colors.text,
        marginVertical: 4,
        flexShrink: 1,
      },
      link: { color: colors.accent },
      blockquote: {
        backgroundColor: colors.surface,
        borderLeftColor: colors.primary,
        borderLeftWidth: 3,
        paddingLeft: 12,
        paddingVertical: 4,
        marginVertical: 8,
      },
      code_inline: {
        backgroundColor: colors.surface,
        color: colors.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 13,
      },
      code_block: {
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
      },
      fence: {
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 13,
        color: colors.text,
        flexShrink: 1,
      },
      list_item: { color: colors.text, marginVertical: 2 },
      bullet_list: { marginVertical: 4 },
      ordered_list: { marginVertical: 4 },
      strong: { color: colors.text, fontWeight: "bold" as const },
      em: { color: colors.text, fontStyle: "italic" as const },
      hr: { backgroundColor: colors.border, height: 1, marginVertical: 12 },
    }),
    [colors],
  );

  const markdownRules = useMemo(
    () => ({
      paragraph: (node: any, children: any, parent: any, styles: any) => (
        <Text key={node.key} selectable style={styles.paragraph}>
          {children}
        </Text>
      ),
      heading1: (node: any, children: any, parent: any, styles: any) => (
        <Text key={node.key} selectable style={styles.heading1}>
          {children}
        </Text>
      ),
      heading2: (node: any, children: any, parent: any, styles: any) => (
        <Text key={node.key} selectable style={styles.heading2}>
          {children}
        </Text>
      ),
      heading3: (node: any, children: any, parent: any, styles: any) => (
        <Text key={node.key} selectable style={styles.heading3}>
          {children}
        </Text>
      ),
      fence: (node: any, children: any, parent: any, styles: any) => (
        <Text key={node.key} selectable style={styles.fence}>
          {node.content}
        </Text>
      ),
      code_inline: (node: any, children: any, parent: any, styles: any) => (
        <Text key={node.key} selectable style={styles.code_inline}>
          {children}
        </Text>
      ),
    }),
    [],
  );

  const toggleExpand = () => {
    if (!task.result) return;
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["90deg", "180deg"],
  });
  const time = new Date(task.timestamp).toLocaleTimeString(
    i18n.language.startsWith("vi") ? "vi-VN" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  const statusIcon =
    task.status === "done"
      ? "check"
      : task.status === "error"
        ? "alert-outline"
        : "clock-outline";
  const statusColor =
    task.status === "done"
      ? colors.success
      : task.status === "error"
        ? colors.error
        : colors.primary;
  const statusBackground =
    task.status === "done"
      ? colors.successBg
      : task.status === "error"
        ? colors.errorBg
        : colors.primarySoft;
  const statusLabel = t(`chat.taskStatus.${task.status}`);

  return (
    <View style={themedStyles.taskCard}>
      <TouchableOpacity
        style={styles.taskHeader}
        onPress={toggleExpand}
        activeOpacity={task.result ? 0.72 : 1}
        disabled={!task.result}
        accessibilityRole={task.result ? "button" : undefined}
        accessibilityLabel={
          task.result ? `${task.command}. ${statusLabel}` : undefined
        }
        accessibilityState={{ expanded: task.result ? expanded : undefined }}
      >
        <View style={styles.taskHeaderLeft}>
          <View
            style={[
              styles.statusIconContainer,
              { backgroundColor: statusBackground },
            ]}
          >
            <MaterialCommunityIcons
              name={statusIcon}
              size={19}
              color={statusColor}
            />
          </View>
          <View style={styles.taskInfo}>
            <Text
              selectable
              style={themedStyles.taskCommand}
              numberOfLines={expanded ? undefined : 2}
            >
              {task.command}
            </Text>
            <View style={styles.taskMeta}>
              <Text style={themedStyles.taskTime}>{time}</Text>
              {task.status !== "pending" && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusBackground },
                  ]}
                >
                  <Text
                    style={[styles.statusBadgeText, { color: statusColor }]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              )}
              {task.hasVideo && (
                <View style={themedStyles.videoTag}>
                  <MaterialCommunityIcons
                    name="youtube"
                    size={10}
                    color={colors.error}
                  />
                  <Text style={themedStyles.videoTagText} numberOfLines={1}>
                    {task.videoTitle || "Video"}
                  </Text>
                </View>
              )}
              {task.hasVideo && task.videoTimeRange && (
                <View style={themedStyles.timeRangeTag}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={10}
                    color={colors.accent}
                  />
                  <Text style={themedStyles.timeRangeTagText}>
                    {formatTimeRange(task.videoTimeRange)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {task.result && (
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <MaterialCommunityIcons
              name="chevron-up"
              size={20}
              color={colors.textMuted}
            />
          </Animated.View>
        )}
      </TouchableOpacity>
      {expanded && task.result && (
        <View
          style={[
            themedStyles.taskResult,
            task.status === "error" && themedStyles.taskResultError,
          ]}
        >
          <View style={styles.responseHeader}>
            <View
              style={[
                themedStyles.responseIcon,
                task.status === "error" && themedStyles.responseIconError,
              ]}
            >
              <MaterialCommunityIcons
                name="creation"
                size={16}
                color={task.status === "error" ? colors.error : colors.primary}
              />
            </View>
            <Text style={themedStyles.responseLabel}>
              {t("chat.responseLabel")}
            </Text>
          </View>
          <Markdown style={markdownStyles} rules={markdownRules}>
            {task.result}
          </Markdown>
          <View
            style={[
              themedStyles.actionButtons,
              task.status === "pending" && styles.hidden,
            ]}
          >
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={async () => {
                if (task.result) {
                  await Clipboard.setStringAsync(task.result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  onCopy?.(task.result);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={t("common.copy")}
            >
              <MaterialCommunityIcons
                name={copied ? "check" : "content-copy"}
                size={16}
                color={copied ? colors.success : colors.textMuted}
              />
              <Text
                style={[
                  themedStyles.actionText,
                  copied && themedStyles.actionTextSuccess,
                ]}
              >
                {copied ? t("common.copied") : t("common.copy")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onRegenerate?.(task)}
              accessibilityRole="button"
              accessibilityLabel={t("common.regenerate")}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={16}
                color={colors.textMuted}
              />
              <Text style={themedStyles.actionText}>
                {t("common.regenerate")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteActionBtn]}
              onPress={() =>
                confirmDestructive(
                  t("chat.deleteTask"),
                  t("chat.deleteTaskConfirm"),
                  () => onDelete?.(task.id),
                )
              }
              accessibilityRole="button"
              accessibilityLabel={t("common.delete")}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={16}
                color={colors.error}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {task.status === "pending" && (
        <View style={themedStyles.taskLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={themedStyles.loadingText}>{t("common.processing")}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 13,
    gap: 10,
  },
  taskHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  taskInfo: { flex: 1 },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  statusBadge: {
    minHeight: 20,
    justifyContent: "center",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  deleteActionBtn: { width: 44, paddingHorizontal: 0, marginLeft: "auto" },
  hidden: { display: "none" },
});

const taskCardThemedStyles = createThemedStyles((colors) => ({
  taskCard: {
    maxWidth: "100%",
    alignSelf: "stretch",
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  taskCommand: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  taskTime: { color: colors.textMuted, fontSize: 12 },
  videoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: colors.surfaceLight,
    borderRadius: 6,
    maxWidth: 180,
  },
  videoTagText: { color: colors.textMuted, fontSize: 11, flexShrink: 1 },
  timeRangeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: colors.accentSoft,
    borderRadius: 6,
  },
  timeRangeTagText: { color: colors.accent, fontSize: 10, fontWeight: "700" },
  taskResult: {
    maxWidth: "100%",
    minWidth: 0,
    padding: 14,
    backgroundColor: colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  taskResultError: { backgroundColor: colors.errorBg },
  responseIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  responseIconError: { backgroundColor: colors.surface },
  responseLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  taskLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.primarySoft,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  actionTextSuccess: { color: colors.success },
}));

export default TaskCard;

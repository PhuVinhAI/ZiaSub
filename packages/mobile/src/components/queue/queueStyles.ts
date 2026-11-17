import { StyleSheet } from "react-native";
import { ThemeColors } from "@src/contexts";

export const createQueueStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // Queue item styles
    queueItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 10,
      overflow: "hidden",
      minHeight: 78,
    },
    thumbnail: {
      width: 120,
      height: 68,
      backgroundColor: colors.surfaceLight,
      flexShrink: 0,
    },
    progressOverlay: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 120,
      height: 68,
      backgroundColor: colors.scrim,
      justifyContent: "center",
      alignItems: "center",
    },
    progressText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
    itemInfo: { flex: 1, padding: 10 },
    itemTitle: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 16,
    },
    itemMeta: { flexDirection: "row", gap: 6, marginTop: 4 },
    metaText: { color: colors.textMuted, fontSize: 11 },
    itemFooter: { marginTop: 4 },
    dateText: { color: colors.textMuted, fontSize: 11 },
    itemActions: { justifyContent: "center", paddingRight: 8, gap: 4 },
    actionBtn: { padding: 6 },
    actionBtnDisabled: { opacity: 0.5 },

    // Action section styles
    actionSection: { paddingHorizontal: 12, marginBottom: 10, flexShrink: 0 },
    actionButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
    actionButtonPrimary: { flex: 1 },
    clearAllBtn: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: colors.errorBg,
      justifyContent: "center",
      alignItems: "center",
    },
    clearAllBtnFull: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.errorBg,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      gap: 8,
    },
    clearAllText: { color: colors.error, fontSize: 13, fontWeight: "700" },
    warningContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.warningBg,
      borderRadius: 8,
      padding: 11,
      marginBottom: 8,
      gap: 8,
    },
    warningText: { color: colors.warning, fontSize: 12, flex: 1 },

    // Empty & pagination styles
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 28,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceLight,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600",
      textAlign: "center",
    },
    pagination: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      gap: 12,
    },
    pageBtn: {
      width: 40,
      height: 40,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceLight,
    },
    pageBtnDisabled: { opacity: 0.4 },
    pageText: {
      minWidth: 64,
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
  });

// Hook for using queue styles with theme
export const useQueueStyles = () => {
  const { useTheme } = require("@src/contexts");
  const { useThemedStyles } = require("@hooks/useThemedStyles");
  const { colors } = useTheme();
  return useThemedStyles(() => createQueueStyles(colors));
};

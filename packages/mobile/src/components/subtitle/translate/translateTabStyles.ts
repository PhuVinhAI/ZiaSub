/**
 * TranslateTab styles
 *
 * Tách từ TranslateTab.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { StyleSheet } from "react-native";
import { createThemedStyles } from "@hooks/useThemedStyles";

export const styles = StyleSheet.create({
  tabContent: { flex: 1 },
  scrollContent: { flex: 1 },
  scrollContentContainer: { paddingBottom: 8 },
  translateButtonContainer: { marginTop: 8, marginBottom: 8 },
});

export const translateTabThemedStyles = createThemedStyles((colors) => ({
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: { color: colors.warning, fontSize: 13, flex: 1 },
  longVideoWarningContainer: {
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  longVideoWarningContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  waitingContainer: {
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  waitingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  waitingText: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  pausedContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pausedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pausedText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
}));

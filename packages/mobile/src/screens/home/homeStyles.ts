/**
 * homeStyles
 *
 * Tách từ HomeScreen.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { StyleSheet } from "react-native";
import { createThemedStyles } from "@hooks/useThemedStyles";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerWorkspace: {
    flex: 1,
    backgroundColor: "#000000",
  },
  normalVideoPane: {
    flex: 1,
    minHeight: 0,
  },
  visualVideoPane: {
    width: "100%",
    minHeight: 0,
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  headerContainer: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    height: 44,
    gap: 8,
  },
  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  modeToggleBtn: {
    marginLeft: 2,
  },
  urlBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  urlInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  urlInputIcon: {
    marginRight: 6,
  },
  urlInput: {
    flex: 1,
    height: 34,
    fontSize: 14,
    paddingVertical: 0,
  },
  urlInputClose: {
    padding: 4,
    marginLeft: 4,
  },
  urlInputAction: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  urlText: {
    flex: 1,
    fontSize: 13,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logoContainer: {
    width: 20,
    height: 20,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export const homeThemedStyles = createThemedStyles((colors, isDark) => ({
  container: { backgroundColor: colors.background },
  headerContainer: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
  },
  logoContainer: { backgroundColor: colors.primary },
  urlBar: {
    backgroundColor: isDark ? colors.surfaceLight : colors.surfaceElevated,
  },
  urlInputContainer: {
    backgroundColor: isDark ? colors.surfaceLight : colors.surfaceElevated,
  },
  urlInput: { color: colors.text },
  urlText: { color: colors.textSecondary },
  brandText: { color: colors.primary },
  modeToggleBtnActive: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
  },
}));

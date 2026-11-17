/**
 * ChatModal styles
 *
 * Tách từ ChatModal.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { StyleSheet } from "react-native";
import { createThemedStyles } from "@hooks/useThemedStyles";

export const styles = StyleSheet.create({
  modalOverlay: { flex: 1 },
  container: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleGroup: { flex: 1, minWidth: 0 },
  taskList: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 0,
    flexGrow: 1,
  },
  inputFloatingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 10,
  },
});

export const chatModalThemedStyles = createThemedStyles((colors) => ({
  container: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { backgroundColor: colors.surfaceLight },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
}));

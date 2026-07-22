/**
 * ChatModal styles
 *
 * Tách từ ChatModal.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { StyleSheet } from "react-native";
import { createThemedStyles } from "@hooks/useThemedStyles";

export const QUICK_ACTION_MAP: Record<string, string> = {
  summary: "Tóm tắt nội dung video này",
  analyze: "Phân tích chi tiết video này",
  keypoints: "Liệt kê các điểm chính trong video",
  translate: "Dịch nội dung video sang tiếng Việt",
};

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
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  taskList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export const chatModalThemedStyles = createThemedStyles((colors) => ({
  container: { backgroundColor: colors.background },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
}));

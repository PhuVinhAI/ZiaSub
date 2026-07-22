import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import Button3D from "./Button3D";

interface WebViewErrorViewProps {
  errorDomain?: string;
  errorCode?: number;
  errorDescription?: string;
  onRetry: () => void;
  onGoHome?: () => void;
}

export const WebViewErrorView: React.FC<WebViewErrorViewProps> = ({
  errorDomain,
  errorCode,
  errorDescription,
  onRetry,
  onGoHome,
}) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(errorThemedStyles);

  const getFriendlyErrorMessage = (desc?: string) => {
    if (!desc) return "Không thể kết nối đến trang web này. Vui lòng kiểm tra lại đường truyền mạng.";
    const lower = desc.toLowerCase();
    if (lower.includes("err_connection_refused")) {
      return "Không thể kết nối đến máy chủ. Trang web có thể tạm ngưng hoạt động hoặc địa chỉ không đúng.";
    }
    if (
      lower.includes("err_internet_disconnected") ||
      lower.includes("err_name_not_resolved") ||
      lower.includes("err_network_changed")
    ) {
      return "Không có kết nối Internet. Vui lòng kiểm tra lại Wi-Fi hoặc dữ liệu di động (4G/5G).";
    }
    if (lower.includes("err_timed_out")) {
      return "Thời gian phản hồi quá lâu. Trang web phản hồi chậm hoặc tạm thời không khả dụng.";
    }
    return "Không thể kết nối đến trang web. Vui lòng thử lại sau.";
  };

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.card}>
        <View style={themedStyles.iconCircle}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={36}
            color={colors.error}
          />
        </View>

        <Text style={themedStyles.title}>Không thể kết nối trang web</Text>

        <Text style={themedStyles.description}>
          {getFriendlyErrorMessage(errorDescription)}
        </Text>

        {!!errorDescription && (
          <View style={themedStyles.errorCodeChip}>
            <Text style={themedStyles.errorCodeText}>
              {errorDescription} {errorCode ? `(${errorCode})` : ""}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Button3D
            icon="reload"
            title="Thử lại"
            variant="primary"
            onPress={onRetry}
            style={styles.actionBtn}
          />
          {onGoHome && (
            <Button3D
              icon="youtube"
              title="YouTube"
              variant="secondary"
              onPress={onGoHome}
              style={styles.actionBtn}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
  },
});

const errorThemedStyles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorBg || "rgba(255, 59, 48, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
  },
  errorCodeChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorCodeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
}));

export default WebViewErrorView;

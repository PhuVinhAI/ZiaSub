import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import QuickActions from "./QuickActions";

interface ChatEmptyStateProps {
  hasApiKey: boolean;
  hasVideo: boolean;
  isLoading: boolean;
  onQuickAction: (actionId: string) => void;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  hasApiKey,
  hasVideo,
  isLoading,
  onQuickAction,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(chatEmptyThemedStyles);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={themedStyles.brandMark}>
          <MaterialCommunityIcons
            name="creation"
            size={24}
            color={colors.primary}
          />
        </View>
        <Text style={themedStyles.greeting}>{t("chat.greeting")}</Text>
        <Text style={themedStyles.greetingSubtitle}>
          {t("chat.greetingSubtitle")}
        </Text>
        {!hasApiKey && (
          <View style={themedStyles.warningContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={colors.warning}
            />
            <Text style={themedStyles.warningText}>{t("chat.noApiKey")}</Text>
          </View>
        )}
        {hasVideo && (
          <QuickActions
            onAction={onQuickAction}
            disabled={isLoading || !hasApiKey}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 24,
    paddingBottom: 32,
  },
  content: { width: "100%", maxWidth: 560 },
});

const chatEmptyThemedStyles = createThemedStyles((colors) => ({
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginBottom: 18,
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 21,
    marginBottom: 3,
  },
  greetingSubtitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    marginBottom: 26,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningBg,
    borderRadius: 8,
    padding: 13,
    marginBottom: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.warning,
    alignSelf: "stretch",
  },
  warningText: { color: colors.warning, fontSize: 13, lineHeight: 18, flex: 1 },
}));

export default ChatEmptyState;

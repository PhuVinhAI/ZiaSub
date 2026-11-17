import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";

const QUICK_ACTIONS = [
  {
    id: "summary",
    labelKey: "chat.quickActions.summarize",
    icon: "text-box-outline",
  },
  {
    id: "analyze",
    labelKey: "chat.quickActions.analyze",
    icon: "chart-box-outline",
  },
  {
    id: "keypoints",
    labelKey: "chat.quickActions.keyPoints",
    icon: "format-list-bulleted",
  },
  {
    id: "translate",
    labelKey: "chat.quickActions.translate",
    icon: "translate",
  },
];

interface QuickActionsProps {
  onAction: (actionId: string) => void;
  disabled?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction, disabled }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(quickActionsThemedStyles);
  const iconColors = [
    colors.primary,
    colors.accent,
    colors.success,
    colors.warning,
  ];
  const iconBackgrounds = [
    colors.primarySoft,
    colors.accentSoft,
    colors.successBg,
    colors.warningBg,
  ];

  return (
    <View style={styles.container}>
      <Text style={themedStyles.title}>{t("chat.quickActionsTitle")}</Text>
      <View style={styles.grid}>
        {QUICK_ACTIONS.map((action, index) => {
          return (
            <TouchableOpacity
              key={action.id}
              style={[
                themedStyles.actionBtn,
                disabled && styles.actionDisabled,
              ]}
              onPress={() => onAction(action.id)}
              disabled={disabled}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={t(action.labelKey)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: iconBackgrounds[index] },
                ]}
              >
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={20}
                  color={iconColors[index]}
                />
              </View>
              <Text style={themedStyles.actionLabel} numberOfLines={2}>
                {t(action.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDisabled: { opacity: 0.5 },
});

const quickActionsThemedStyles = createThemedStyles((colors) => ({
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  actionBtn: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 88,
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
}));

export default QuickActions;

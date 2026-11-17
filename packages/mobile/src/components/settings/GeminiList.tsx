import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import * as Clipboard from "expo-clipboard";
import { alert } from "../common/CustomAlert";
import type { GeminiConfig } from "@src/types";
import {
  getEffectiveChatSystemPrompt,
  getEffectiveSystemPrompt,
} from "@services/geminiModelConfig";
import { DEFAULT_CHAT_CONFIG_ID } from "@constants/defaults";
import { DEFAULT_PRESUB_CONFIG_ID } from "@utils/storage";
import Button3D from "../common/Button3D";

interface GeminiListProps {
  configs: GeminiConfig[];
  onEdit: (config: GeminiConfig) => void;
  onDelete: (config: GeminiConfig) => void;
  onAdd: () => void;
}

const GeminiList: React.FC<GeminiListProps> = ({
  configs,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(geminiListThemedStyles);
  const translationStyleCount = configs.filter(
    (config) =>
      config.id !== DEFAULT_CHAT_CONFIG_ID &&
      config.id !== DEFAULT_PRESUB_CONFIG_ID
  ).length;

  const handleCopyPrompt = async (config: GeminiConfig) => {
    // Use the same resolver as the corresponding Gemini request so copied
    // content stays identical to the effective systemInstruction.
    const promptText =
      config.id === DEFAULT_CHAT_CONFIG_ID
        ? getEffectiveChatSystemPrompt(config)
        : getEffectiveSystemPrompt(config);

    try {
      await Clipboard.setStringAsync(promptText);
      alert(
        t("common.success"),
        t("settings.geminiConfig.copyPromptSuccess", { name: config.name })
      );
    } catch {
      alert(
        t("common.error"),
        t("settings.geminiConfig.copyPromptError")
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {configs.length === 0 ? (
          <View style={[styles.emptyState, themedStyles.emptyState]}>
            <MaterialCommunityIcons
              name="text-box-search-outline"
              size={32}
              color={colors.textMuted}
            />
            <Text style={themedStyles.emptyTitle}>
              {t("settings.geminiConfig.emptyTitle")}
            </Text>
            <Text style={themedStyles.emptyDescription}>
              {t("settings.geminiConfig.emptyDescription")}
            </Text>
          </View>
        ) : null}

        {configs.map((config) => {
          const isChat = config.id === DEFAULT_CHAT_CONFIG_ID;
          const isPresub = config.id === DEFAULT_PRESUB_CONFIG_ID;
          const isProtected = isChat || isPresub;
          const isLastTranslation = !isProtected && translationStyleCount <= 1;
          const typeLabel = isChat
            ? t("settings.geminiConfig.chatBadge")
            : isPresub
              ? t("settings.geminiConfig.previewBadge")
              : t("settings.geminiConfig.translationBadge");

          return (
            <TouchableOpacity
              key={config.id}
              style={themedStyles.configItem}
              onPress={() => onEdit(config)}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={config.name}
              accessibilityHint={t("settings.geminiConfig.editAction")}
            >
              <View style={styles.itemTopRow}>
                <View style={[styles.itemIcon, themedStyles.itemIcon]}>
                  <MaterialCommunityIcons
                    name={isChat ? "chat-processing-outline" : isPresub ? "lightning-bolt-outline" : "translate"}
                    size={21}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.configInfo}>
                  <View style={styles.nameRow}>
                    <Text style={themedStyles.configName} numberOfLines={1}>
                      {config.name}
                    </Text>
                    <View style={themedStyles.typeBadge}>
                      <Text style={themedStyles.typeBadgeText}>{typeLabel}</Text>
                    </View>
                  </View>
                  <Text style={themedStyles.configModel} numberOfLines={1}>
                    {config.model.replace("models/", "")}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={23}
                  color={colors.textMuted}
                />
              </View>

              <View style={[styles.actionRow, themedStyles.actionRow]}>
                <TouchableOpacity
                  style={[styles.actionButton, themedStyles.actionButton]}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleCopyPrompt(config);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t("settings.geminiConfig.copyAction")}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={themedStyles.copyActionText}>
                    {t("settings.geminiConfig.copyAction")}
                  </Text>
                </TouchableOpacity>

                {isProtected || isLastTranslation ? (
                  <View style={[styles.actionButton, themedStyles.lockedAction]}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={18}
                      color={colors.textMuted}
                    />
                    <Text style={themedStyles.lockedActionText}>
                      {isProtected
                        ? t("settings.geminiConfig.builtIn")
                        : t("settings.geminiConfig.keepOne")}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.deleteButton, themedStyles.deleteButton]}
                    onPress={(event) => {
                      event.stopPropagation();
                      onDelete(config);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t("settings.geminiConfig.deleteAction")}
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={19}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Button3D
        onPress={onAdd}
        icon="plus"
        title={t("settings.geminiConfig.addNew")}
        variant="primary"
        style={styles.addButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  configInfo: { flex: 1 },
  listContent: { paddingBottom: 4 },
  itemTopRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 11,
    paddingHorizontal: 12,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  emptyState: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 26,
    marginBottom: 10,
  },
  addButton: { marginTop: 12 },
});

const geminiListThemedStyles = createThemedStyles((colors) => ({
  configItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemIcon: { backgroundColor: colors.primarySoft },
  configName: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: "700" },
  configModel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: "monospace",
  },
  typeBadge: {
    flexShrink: 0,
    backgroundColor: colors.surfaceLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: { color: colors.textSecondary, fontSize: 10, fontWeight: "700" },
  actionRow: { borderTopColor: colors.border },
  actionButton: { flex: 1, backgroundColor: colors.primarySoft },
  copyActionText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  lockedAction: { flex: 1, backgroundColor: colors.surfaceLight },
  lockedActionText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  deleteButton: { backgroundColor: colors.errorBg },
  emptyState: { backgroundColor: colors.surface, borderColor: colors.border },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 10 },
  emptyDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },
}));

export default GeminiList;

import React, { useState } from "react";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { alert, confirmDestructive } from "@components/common/CustomAlert";
import Button3D from "@components/common/Button3D";
import { keyManager } from "@services/keyManager";
import { isValidApiKey } from "@utils/keyUtils";
import {
  SettingsCard,
  SettingsSectionHeader,
  SettingsValuePill,
} from "../SettingsPrimitives";

interface ApiKeysSectionProps {
  apiKeys: string[];
  onApiKeysChange: (keys: string[]) => void;
  onNavigateToUrl?: (url: string) => void;
}

const maskKey = (key: string) => {
  if (key.length < 12) return "***";
  return key.substring(0, 8) + "..." + key.substring(key.length - 4);
};

const ApiKeysSection: React.FC<ApiKeysSectionProps> = ({
  apiKeys,
  onApiKeysChange,
  onNavigateToUrl,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(apiKeysThemedStyles);
  const [showKeys, setShowKeys] = useState(false);
  const [isAddingKey, setIsAddingKey] = useState(false);

  const handleAddKeyFromClipboard = async () => {
    if (isAddingKey) return;
    setIsAddingKey(true);
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      const key = clipboardContent?.trim();
      if (!key) {
        alert(
          t("settings.apiKeys.clipboardEmpty"),
          t("settings.apiKeys.clipboardEmptyMessage")
        );
        return;
      }
      if (!isValidApiKey(key)) {
        alert(
          t("settings.apiKeys.invalid"),
          t("settings.apiKeys.invalidMessage")
        );
        return;
      }
      if (apiKeys.includes(key)) {
        alert(
          t("settings.apiKeys.duplicate"),
          t("settings.apiKeys.duplicateMessage")
        );
        return;
      }
      onApiKeysChange([...apiKeys, key]);
      alert(t("common.success"), t("settings.apiKeys.added"));
    } catch {
      alert(t("common.error"), t("settings.apiKeys.clipboardError"));
    } finally {
      setIsAddingKey(false);
    }
  };

  const handleDeleteKey = (index: number) => {
    confirmDestructive(
      t("settings.apiKeys.deleteTitle"),
      t("settings.apiKeys.deleteConfirm"),
      () => onApiKeysChange(apiKeys.filter((_, keyIndex) => keyIndex !== index))
    );
  };

  const handleOpenKeyPage = () => {
    const url = "https://aistudio.google.com/app/apikey";
    if (onNavigateToUrl) {
      onNavigateToUrl(url);
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <SettingsSectionHeader
          icon="shield-key-outline"
          title={t("settings.apiKeys.manageTitle")}
          description={t("settings.apiKeys.description")}
          trailing={
            <SettingsValuePill
              value={t("settings.apiKeys.keyCount", { count: apiKeys.length })}
            />
          }
        />
        <SettingsCard style={styles.actionCard}>
          <View style={styles.actionInfo}>
            <View style={[styles.actionIcon, themedStyles.actionIcon]}>
              <MaterialCommunityIcons
                name="google"
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.flex}>
              <Text style={themedStyles.actionTitle}>
                {t("settings.apiKeys.needKeyTitle")}
              </Text>
              <Text style={themedStyles.actionDescription}>
                {t("settings.apiKeys.needKeyDescription")}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.getKeyButton, themedStyles.getKeyButton]}
            onPress={handleOpenKeyPage}
          >
            <Text style={themedStyles.getKeyText}>
              {t("settings.apiKeys.getKey")}
            </Text>
            <MaterialCommunityIcons
              name="open-in-new"
              size={17}
              color={colors.primary}
            />
          </TouchableOpacity>
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="key-chain-variant"
          title={t("settings.apiKeys.savedKeys")}
          description={t("settings.apiKeys.savedKeysDescription")}
          trailing={
            apiKeys.length > 0 ? (
              <TouchableOpacity
                onPress={() => setShowKeys(!showKeys)}
                style={[styles.eyeButton, themedStyles.eyeButton]}
                accessibilityRole="button"
                accessibilityLabel={
                  showKeys
                    ? t("settings.apiKeys.hideKeys")
                    : t("settings.apiKeys.showKeys")
                }
              >
                <MaterialCommunityIcons
                  name={showKeys ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            ) : null
          }
        />

        <SettingsCard style={styles.keysCard}>
          {apiKeys.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, themedStyles.emptyIcon]}>
                <MaterialCommunityIcons
                  name="key-plus"
                  size={28}
                  color={colors.textMuted}
                />
              </View>
              <Text style={themedStyles.emptyTitle}>
                {t("settings.apiKeys.empty")}
              </Text>
              <Text style={themedStyles.emptyDescription}>
                {t("settings.apiKeys.emptyHint")}
              </Text>
            </View>
          ) : (
            apiKeys.map((key, index) => {
              const isActive = index === keyManager.getCurrentKeyIndex() - 1;
              return (
                <View
                  key={key + "-" + index}
                  style={[
                    themedStyles.apiKeyItem,
                    index < apiKeys.length - 1 && themedStyles.itemDivider,
                  ]}
                >
                  <View
                    style={[
                      styles.keyIcon,
                      isActive
                        ? themedStyles.keyIconActive
                        : themedStyles.keyIcon,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isActive ? "key-variant" : "key-outline"}
                      size={18}
                      color={isActive ? colors.success : colors.primary}
                    />
                  </View>
                  <View style={styles.keyTextWrapper}>
                    <Text style={themedStyles.apiKeyText} numberOfLines={1}>
                      {showKeys ? key : maskKey(key)}
                    </Text>
                    {isActive && (
                      <Text style={themedStyles.activeKeyText}>
                        {t("settings.apiKeys.active")}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteKey(index)}
                    style={[styles.deleteKeyBtn, themedStyles.deleteKeyBtn]}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={19}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <View style={styles.addButtonWrapper}>
            <Button3D
              icon="clipboard-plus-outline"
              title={
                isAddingKey
                  ? t("settings.apiKeys.adding")
                  : t("settings.apiKeys.addFromClipboard")
              }
              variant="primary"
              onPress={handleAddKeyFromClipboard}
              disabled={isAddingKey}
            />
          </View>
        </SettingsCard>

        <View style={[styles.securityHint, themedStyles.securityHint]}>
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={17}
            color={colors.success}
          />
          <Text style={themedStyles.securityHintText}>
            {t("settings.apiKeys.securityHint")}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 24 },
  flex: { flex: 1 },
  actionCard: { gap: 14 },
  actionInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  getKeyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 44,
    borderRadius: 11,
  },
  eyeButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  keysCard: { padding: 6 },
  emptyState: { alignItems: "center", paddingHorizontal: 18, paddingVertical: 24 },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  keyIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  keyTextWrapper: { flex: 1 },
  deleteKeyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonWrapper: { padding: 10 },
  securityHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
});

const apiKeysThemedStyles = createThemedStyles((colors) => ({
  actionIcon: { backgroundColor: colors.primarySoft },
  actionTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  actionDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  getKeyButton: {
    backgroundColor: colors.primarySoft,
  },
  getKeyText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  eyeButton: { backgroundColor: colors.primarySoft },
  emptyIcon: { backgroundColor: colors.surfaceLight },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  emptyDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },
  apiKeyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 62,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  keyIcon: { backgroundColor: colors.primarySoft },
  keyIconActive: { backgroundColor: colors.successBg },
  apiKeyText: { color: colors.text, fontSize: 13, fontFamily: "monospace" },
  activeKeyText: { color: colors.success, fontSize: 11, marginTop: 2 },
  deleteKeyBtn: { backgroundColor: colors.errorBg },
  securityHint: { backgroundColor: colors.successBg },
  securityHintText: {
    flex: 1,
    color: colors.success,
    fontSize: 11,
    lineHeight: 16,
  },
}));

export default ApiKeysSection;

import React, { useMemo } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme, useUpdate } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { confirmDestructive } from "@components/common/CustomAlert";
import Button3D from "@components/common/Button3D";
import type {
  BatchSettings,
  DebugSettings,
  FloatingUISettings,
  NotificationSettings,
  SubtitleSettings,
} from "@src/types";
import {
  DEFAULT_BATCH_SETTINGS,
  DEFAULT_DEBUG_SETTINGS,
  DEFAULT_FLOATING_UI_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_SUBTITLE_SETTINGS,
} from "@constants/defaults";

export type SettingPage =
  | "appearance"
  | "apiKeys"
  | "subtitle"
  | "batch"
  | "floatingUI"
  | "notification"
  | "data"
  | "debug"
  | "support";

type SettingsIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface MenuItem {
  page: SettingPage;
  icon: SettingsIcon;
  title: string;
  description: string;
  showUpdateBadge?: boolean;
}

interface MenuSection {
  title: string;
  icon: SettingsIcon;
  items: MenuItem[];
}

interface GeneralTabProps {
  apiKeyCount: number;
  notificationSettings: NotificationSettings;
  debugSettings: DebugSettings;
  onSelectPage: (page: SettingPage) => void;
  onSubtitleChange: (settings: SubtitleSettings) => void;
  onBatchChange: (settings: BatchSettings) => void;
  onFloatingUIChange: (settings: FloatingUISettings) => void;
  onNotificationChange: (settings: NotificationSettings) => void;
  onDebugChange: (settings: DebugSettings) => void;
}

const GeneralTab: React.FC<GeneralTabProps> = ({
  apiKeyCount,
  notificationSettings,
  debugSettings,
  onSelectPage,
  onSubtitleChange,
  onBatchChange,
  onFloatingUIChange,
  onNotificationChange,
  onDebugChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { hasUpdate, updateResult } = useUpdate();
  const themedStyles = useThemedStyles(generalThemedStyles);

  const sections = useMemo<MenuSection[]>(
    () => [
      {
        title: t("settings.menu.translation"),
        icon: "translate",
        items: [
          {
            page: "apiKeys",
            icon: "key-variant",
            title: t("settings.apiKeys.title"),
            description: t("settings.groups.apiKeysDesc", {
              count: apiKeyCount,
            }),
          },
          {
            page: "batch",
            icon: "playlist-play",
            title: t("settings.batch.title"),
            description: t("settings.groups.batchDesc"),
          },
        ],
      },
      {
        title: t("settings.menu.display"),
        icon: "monitor-dashboard",
        items: [
          {
            page: "appearance",
            icon: "palette-outline",
            title: t("settings.groups.appearance"),
            description: t("settings.groups.appearanceDesc"),
          },
          {
            page: "subtitle",
            icon: "subtitles-outline",
            title: t("settings.subtitle.title"),
            description: t("settings.groups.subtitleDesc"),
          },
          {
            page: "floatingUI",
            icon: "gesture-tap-button",
            title: t("settings.floatingUI.title"),
            description: t("settings.groups.floatingUIDesc"),
          },
        ],
      },
      {
        title: t("settings.menu.app"),
        icon: "cellphone-cog",
        items: [
          {
            page: "notification",
            icon: "bell-outline",
            title: t("settings.notification.title"),
            description: t("settings.groups.notificationDesc", {
              status: notificationSettings.enabled
                ? t("settings.groups.enabled")
                : t("settings.groups.disabled"),
            }),
          },
          {
            page: "data",
            icon: "database-outline",
            title: t("settings.data.title"),
            description: t("settings.data.description"),
          },
          {
            page: "debug",
            icon: "bug-outline",
            title: t("settings.debug.title"),
            description: t("settings.groups.debugDesc", {
              status: debugSettings.enabled
                ? t("settings.groups.enabled")
                : t("settings.groups.disabled"),
            }),
          },
        ],
      },
      {
        title: t("settings.menu.support"),
        icon: "lifebuoy",
        items: [
          {
            page: "support",
            icon: "help-circle-outline",
            title: t("settings.support.title"),
            description:
              hasUpdate && updateResult?.latestRelease
                ? t("settings.support.updateAvailable", {
                    version: updateResult.latestRelease.version,
                  })
                : t("settings.support.description"),
            showUpdateBadge: hasUpdate,
          },
        ],
      },
    ],
    [
      apiKeyCount,
      debugSettings.enabled,
      hasUpdate,
      notificationSettings.enabled,
      t,
      updateResult?.latestRelease,
    ]
  );

  const handleResetAllSettings = () => {
    confirmDestructive(
      t("settings.resetAll.title"),
      t("settings.resetAll.message"),
      () => {
        onSubtitleChange({ ...DEFAULT_SUBTITLE_SETTINGS });
        onBatchChange({ ...DEFAULT_BATCH_SETTINGS });
        onFloatingUIChange({ ...DEFAULT_FLOATING_UI_SETTINGS });
        onNotificationChange({ ...DEFAULT_NOTIFICATION_SETTINGS });
        onDebugChange({ ...DEFAULT_DEBUG_SETTINGS });
      },
      t("settings.resetAll.confirm")
    );
  };

  return (
    <ScrollView
      style={staticStyles.container}
      contentContainerStyle={staticStyles.content}
      showsVerticalScrollIndicator={false}
    >
      {sections.map((section) => (
        <View key={section.title} style={staticStyles.section}>
          <View style={staticStyles.sectionHeader}>
            <View style={[staticStyles.sectionHeaderIcon, themedStyles.sectionHeaderIcon]}>
              <MaterialCommunityIcons
                name={section.icon}
                size={16}
                color={colors.primary}
              />
            </View>
            <Text style={[themedStyles.sectionLabel, staticStyles.sectionTitleFlex]}>
              {section.title}
            </Text>
            <View style={themedStyles.sectionCount}>
              <Text style={themedStyles.sectionCountText}>{section.items.length}</Text>
            </View>
          </View>
          <View style={themedStyles.menuCard}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.page}
                style={[
                  staticStyles.menuRow,
                  index < section.items.length - 1 && themedStyles.menuDivider,
                ]}
                onPress={() => onSelectPage(item.page)}
                activeOpacity={0.65}
                accessibilityRole="button"
              >
                <View style={staticStyles.iconWrapper}>
                  <View style={[staticStyles.menuIcon, themedStyles.menuIcon]}>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={20}
                      color={item.showUpdateBadge ? colors.error : colors.primary}
                    />
                  </View>
                  {item.showUpdateBadge && (
                    <View
                      style={[
                        staticStyles.updateBadge,
                        {
                          backgroundColor: colors.error,
                          borderColor: colors.surface,
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={staticStyles.menuText}>
                  <Text
                    style={[
                      themedStyles.menuTitle,
                      item.showUpdateBadge && { color: colors.error },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      themedStyles.menuDescription,
                      item.showUpdateBadge && { color: colors.error },
                    ]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                </View>
                <View style={[staticStyles.chevronBox, themedStyles.chevronBox]}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={21}
                    color={colors.textMuted}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={staticStyles.resetContainer}>
        <Button3D
          title={t("settings.resetAll.button")}
          icon="restore"
          onPress={handleResetAllSettings}
          variant="outline"
        />
        <Text style={themedStyles.resetHint}>{t("settings.resetAll.hint")}</Text>
      </View>
    </ScrollView>
  );
};

const staticStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 16 },
  section: { marginBottom: 19 },
  sectionHeader: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 3,
    marginBottom: 8,
  },
  sectionHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleFlex: { flex: 1 },
  menuRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 12,
  },
  iconWrapper: { position: "relative" },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  updateBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  menuText: { flex: 1 },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resetContainer: { gap: 8, marginBottom: 8 },
});

const generalThemedStyles = createThemedStyles((colors) => ({
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  sectionHeaderIcon: { backgroundColor: colors.primarySoft },
  sectionCount: {
    minWidth: 26,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
  },
  sectionCountText: { color: colors.textMuted, fontSize: 10, fontWeight: "800" },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { backgroundColor: colors.primarySoft },
  menuTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  menuDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  chevronBox: { backgroundColor: colors.surfaceLight },
  resetHint: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
}));

export default GeneralTab;

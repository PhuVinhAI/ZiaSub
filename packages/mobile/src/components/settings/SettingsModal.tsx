import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { SegmentedTabs } from "@components/common";
import { alert, confirmDestructive } from "@components/common/CustomAlert";
import type {
  SubtitleSettings,
  BatchSettings,
  GeminiConfig,
  FloatingUISettings,
  NotificationSettings,
  DebugSettings,
} from "@src/types";
import {
  DEFAULT_PRESUB_CONFIG_ID,
  getGeminiConfigs,
  saveGeminiConfigs,
} from "@utils/storage";
import { MODEL_GEMINI_4_HYDROGEN } from "@services/geminiModelConfig";
import { DEFAULT_CHAT_CONFIG_ID } from "@constants/defaults";
import GeneralTab, { type SettingPage } from "./GeneralTab";
import GeminiList from "./GeminiList";
import GeminiEdit from "./GeminiEdit";
import { SettingsPageIntro, type SettingsGlyph } from "./SettingsPrimitives";
import {
  ApiKeysSection,
  BatchSection,
  DataSection,
  DebugSection,
  FloatingUISection,
  LanguageSection,
  NotificationSection,
  SubtitleSection,
  SupportSection,
  ThemeSection,
} from "./sections";

type TabType = "general" | "gemini";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  subtitleSettings: SubtitleSettings;
  onSubtitleSettingsChange: (settings: SubtitleSettings) => void;
  batchSettings: BatchSettings;
  onBatchSettingsChange: (settings: BatchSettings) => void;
  apiKeys: string[];
  onApiKeysChange: (keys: string[]) => void;
  floatingUISettings: FloatingUISettings;
  onFloatingUISettingsChange: (settings: FloatingUISettings) => void;
  notificationSettings: NotificationSettings;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
  debugSettings: DebugSettings;
  onDebugSettingsChange: (settings: DebugSettings) => void;
  onNavigateToUrl?: (url: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  subtitleSettings,
  onSubtitleSettingsChange,
  batchSettings,
  onBatchSettingsChange,
  apiKeys,
  onApiKeysChange,
  floatingUISettings,
  onFloatingUISettingsChange,
  notificationSettings,
  onNotificationSettingsChange,
  debugSettings,
  onDebugSettingsChange,
  onNavigateToUrl,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const themedStyles = useThemedStyles(settingsThemedStyles);
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [detailPage, setDetailPage] = useState<SettingPage | null>(null);
  const [geminiConfigs, setGeminiConfigs] = useState<GeminiConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<GeminiConfig | null>(null);
  const [isContentReady, setIsContentReady] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDetailPage(null);
      setEditingConfig(null);
      setIsContentReady(false);
      return;
    }

    getGeminiConfigs().then(setGeminiConfigs);
    const task = setTimeout(() => {
      setIsContentReady(true);
    }, 0);
    return () => clearTimeout(task);
  }, [visible]);

  const handleNavigateToUrl = useCallback(
    (url: string) => {
      setDetailPage(null);
      onClose();
      setTimeout(() => {
        if (onNavigateToUrl) {
          onNavigateToUrl(url);
        } else {
          Linking.openURL(url);
        }
      }, 250);
    },
    [onClose, onNavigateToUrl],
  );

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    if (!editingConfig.name.trim()) {
      alert(
        t("settings.geminiConfig.validationTitle"),
        t("settings.geminiConfig.validationNameEmpty"),
      );
      return;
    }

    const exists = geminiConfigs.some(
      (config) => config.id === editingConfig.id,
    );
    const updated = exists
      ? geminiConfigs.map((config) =>
          config.id === editingConfig.id ? editingConfig : config,
        )
      : [...geminiConfigs, { ...editingConfig, id: `config-${Date.now()}` }];

    await saveGeminiConfigs(updated);
    setGeminiConfigs(updated);
    setEditingConfig(null);
  };

  const handleDeleteConfig = (configToDelete: GeminiConfig) => {
    const id = configToDelete.id;
    if (id === DEFAULT_CHAT_CONFIG_ID || id === DEFAULT_PRESUB_CONFIG_ID) {
      alert(
        t("settings.geminiConfig.cannotDeleteTitle"),
        t("settings.geminiConfig.cannotDeleteDefault"),
      );
      return;
    }

    const translationConfigs = geminiConfigs.filter(
      (config) =>
        config.id !== DEFAULT_CHAT_CONFIG_ID &&
        config.id !== DEFAULT_PRESUB_CONFIG_ID,
    );
    if (translationConfigs.length <= 1) {
      alert(
        t("settings.geminiConfig.cannotDelete"),
        t("settings.geminiConfig.cannotDeleteMessage"),
      );
      return;
    }

    confirmDestructive(
      t("settings.geminiConfig.deleteTitle"),
      t("settings.geminiConfig.deleteConfirm", {
        name: configToDelete.name,
      }),
      async () => {
        const updated = geminiConfigs.filter((config) => config.id !== id);
        await saveGeminiConfigs(updated);
        setGeminiConfigs(updated);
      },
    );
  };

  const detailTitles: Record<SettingPage, string> = {
    appearance: t("settings.groups.appearance"),
    apiKeys: t("settings.apiKeys.title"),
    subtitle: t("settings.subtitle.title"),
    batch: t("settings.batch.title"),
    floatingUI: t("settings.floatingUI.title"),
    notification: t("settings.notification.title"),
    data: t("settings.data.title"),
    debug: t("settings.debug.title"),
    support: t("settings.support.title"),
  };

  const detailDescriptions: Record<SettingPage, string> = {
    appearance: t("settings.pages.appearance"),
    apiKeys: t("settings.pages.apiKeys"),
    subtitle: t("settings.pages.subtitle"),
    batch: t("settings.pages.batch"),
    floatingUI: t("settings.pages.floatingUI"),
    notification: t("settings.pages.notification"),
    data: t("settings.pages.data"),
    debug: t("settings.pages.debug"),
    support: t("settings.pages.support"),
  };

  const detailIcons: Record<SettingPage, SettingsGlyph> = {
    appearance: "palette-outline",
    apiKeys: "key-variant",
    subtitle: "subtitles-outline",
    batch: "playlist-play",
    floatingUI: "gesture-tap-button",
    notification: "bell-outline",
    data: "database-outline",
    debug: "bug-outline",
    support: "help-circle-outline",
  };

  const renderDetailContent = () => {
    switch (detailPage) {
      case "appearance":
        return (
          <>
            <ThemeSection />
            <LanguageSection />
          </>
        );
      case "apiKeys":
        return (
          <ApiKeysSection
            apiKeys={apiKeys}
            onApiKeysChange={onApiKeysChange}
            onNavigateToUrl={handleNavigateToUrl}
          />
        );
      case "subtitle":
        return (
          <SubtitleSection
            subtitleSettings={subtitleSettings}
            onSubtitleChange={onSubtitleSettingsChange}
          />
        );
      case "batch":
        return (
          <BatchSection
            batchSettings={batchSettings}
            onBatchChange={onBatchSettingsChange}
          />
        );
      case "floatingUI":
        return (
          <FloatingUISection
            floatingUISettings={floatingUISettings}
            onFloatingUIChange={onFloatingUISettingsChange}
          />
        );
      case "notification":
        return (
          <NotificationSection
            notificationSettings={notificationSettings}
            onNotificationChange={onNotificationSettingsChange}
          />
        );
      case "data":
        return <DataSection />;
      case "debug":
        return (
          <DebugSection
            debugSettings={debugSettings}
            onDebugChange={onDebugSettingsChange}
          />
        );
      case "support":
        return <SupportSection />;
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={themedStyles.rootScreen}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
          />
          <View
            style={{
              height: Math.max(insets.top, StatusBar.currentHeight || 0),
            }}
          />
          <View style={themedStyles.rootHeader}>
            <View style={staticStyles.headerButton}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={themedStyles.rootTitle} numberOfLines={1}>
              {t("settings.title")}
            </Text>
            <TouchableOpacity
              style={staticStyles.headerButton}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={staticStyles.rootTabs}>
            <SegmentedTabs<TabType>
              value={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "general",
                  label: t("settings.tabs.general"),
                  icon: "cog-outline",
                },
                {
                  key: "gemini",
                  label: t("settings.tabs.geminiConfigs"),
                  icon: "robot-outline",
                  badge: geminiConfigs.length || undefined,
                },
              ]}
            />
          </View>

          <View
            style={[
              staticStyles.rootContent,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            {!isContentReady ? (
              <View style={staticStyles.flex} />
            ) : activeTab === "general" ? (
              <GeneralTab
                apiKeyCount={apiKeys.length}
                notificationSettings={notificationSettings}
                debugSettings={debugSettings}
                onSelectPage={setDetailPage}
                onSubtitleChange={onSubtitleSettingsChange}
                onBatchChange={onBatchSettingsChange}
                onFloatingUIChange={onFloatingUISettingsChange}
                onNotificationChange={onNotificationSettingsChange}
                onDebugChange={onDebugSettingsChange}
              />
            ) : (
              <GeminiList
                configs={geminiConfigs}
                onEdit={(config) => setEditingConfig({ ...config })}
                onDelete={handleDeleteConfig}
                onAdd={() =>
                  setEditingConfig({
                    id: "",
                    name: "",
                    model: MODEL_GEMINI_4_HYDROGEN,
                    temperature: 0.7,
                    systemPrompt: "",
                  })
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(detailPage)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setDetailPage(null)}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={themedStyles.detailScreen}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
          />
          <View
            style={{
              height: Math.max(insets.top, StatusBar.currentHeight || 0),
            }}
          />
          <View style={themedStyles.detailHeader}>
            <TouchableOpacity
              style={staticStyles.headerButton}
              onPress={() => setDetailPage(null)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={25}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={themedStyles.detailTitle} numberOfLines={1}>
              {detailPage ? detailTitles[detailPage] : ""}
            </Text>
            <View style={staticStyles.headerButton} />
          </View>
          <ScrollView
            style={staticStyles.flex}
            contentContainerStyle={[
              staticStyles.detailContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 20 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {detailPage && (
              <View style={staticStyles.detailContentInner}>
                <SettingsPageIntro
                  icon={detailIcons[detailPage]}
                  title={detailTitles[detailPage]}
                  description={detailDescriptions[detailPage]}
                />
                {renderDetailContent()}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {editingConfig && (
        <GeminiEdit
          visible={Boolean(editingConfig)}
          config={editingConfig}
          onChange={setEditingConfig}
          onSave={handleSaveConfig}
          onCancel={() => setEditingConfig(null)}
        />
      )}
    </>
  );
};

const staticStyles = StyleSheet.create({
  flex: { flex: 1 },
  rootTabs: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  rootContent: {
    flex: 1,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: { padding: 16 },
  detailContentInner: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
});

const settingsThemedStyles = createThemedStyles((colors) => ({
  rootScreen: { flex: 1, backgroundColor: colors.background },
  rootHeader: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rootTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  detailScreen: { flex: 1, backgroundColor: colors.background },
  detailHeader: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
}));

export default SettingsModal;

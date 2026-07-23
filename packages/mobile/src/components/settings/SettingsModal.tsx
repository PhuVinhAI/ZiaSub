import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { alert, confirmDestructive } from "../common/CustomAlert";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { BottomSheetModal } from "@components/common";
import type {
  SubtitleSettings,
  BatchSettings,
  TTSSettings,
  GeminiConfig,
  FloatingUISettings,
  NotificationSettings,
  DebugSettings,
} from "@src/types";
import {
  getGeminiConfigs,
  saveGeminiConfigs,
} from "@utils/storage";
import GeneralTab from "./GeneralTab";
import GeminiList from "./GeminiList";
import GeminiEdit from "./GeminiEdit";

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
  ttsSettings: TTSSettings;
  onTTSSettingsChange: (settings: TTSSettings) => void;
  floatingUISettings: FloatingUISettings;
  onFloatingUISettingsChange: (settings: FloatingUISettings) => void;
  notificationSettings: NotificationSettings;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
  debugSettings: DebugSettings;
  onDebugSettingsChange: (settings: DebugSettings) => void;
  onShowFAQ?: () => void;
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
  ttsSettings,
  onTTSSettingsChange,
  floatingUISettings,
  onFloatingUISettingsChange,
  notificationSettings,
  onNotificationSettingsChange,
  debugSettings,
  onDebugSettingsChange,
  onShowFAQ,
  onNavigateToUrl,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [geminiConfigs, setGeminiConfigs] = useState<GeminiConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<GeminiConfig | null>(
    null
  );
  const themedStyles = useThemedStyles(settingsThemedStyles);

  useEffect(() => {
    if (visible) {
      loadConfigs();
    } else {
      setEditingConfig(null);
    }
  }, [visible]);

  const loadConfigs = async () => {
    const configs = await getGeminiConfigs();
    setGeminiConfigs(configs);
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    if (!editingConfig.name.trim()) {
      alert(
        t("settings.geminiConfig.validationTitle"),
        t("settings.geminiConfig.validationNameEmpty")
      );
      return;
    }

    let updated: GeminiConfig[];
    const isNew = !geminiConfigs.some((c) => c.id === editingConfig.id);
    if (isNew) {
      const newConfig = { ...editingConfig, id: `config-${Date.now()}` };
      updated = [...geminiConfigs, newConfig];
    } else {
      updated = geminiConfigs.map((c) =>
        c.id === editingConfig.id ? editingConfig : c
      );
    }
    await saveGeminiConfigs(updated);
    setGeminiConfigs(updated);
    setEditingConfig(null);
  };

  const handleDeleteConfig = (id: string) => {
    if (id === "default-config") {
      alert(
        t("settings.geminiConfig.cannotDeleteTitle"),
        t("settings.geminiConfig.cannotDeleteDefault")
      );
      return;
    }
    confirmDestructive(
      t("settings.geminiConfig.deleteTitle"),
      t("settings.geminiConfig.deleteConfirm"),
      async () => {
        const updated = geminiConfigs.filter((c) => c.id !== id);
        await saveGeminiConfigs(updated);
        setGeminiConfigs(updated);
      }
    );
  };

  const handleAddConfig = () => {
    setEditingConfig({
      id: "",
      name: "",
      model: "models/gemini-2.0-flash",
      temperature: 0.3,
      systemPrompt: "",
    });
  };

  const renderTabContent = () => {
    if (activeTab === "general") {
      return (
        <GeneralTab
          subtitleSettings={subtitleSettings}
          onSubtitleChange={onSubtitleSettingsChange}
          batchSettings={batchSettings}
          onBatchChange={onBatchSettingsChange}
          apiKeys={apiKeys}
          onApiKeysChange={onApiKeysChange}
          ttsSettings={ttsSettings}
          onTTSChange={onTTSSettingsChange}
          floatingUISettings={floatingUISettings}
          onFloatingUIChange={onFloatingUISettingsChange}
          notificationSettings={notificationSettings}
          onNotificationChange={onNotificationSettingsChange}
          debugSettings={debugSettings}
          onDebugChange={onDebugSettingsChange}
          onNavigateToUrl={onNavigateToUrl}
        />
      );
    }
    return (
      <GeminiList
        configs={geminiConfigs}
        onEdit={(c) => setEditingConfig({ ...c })}
        onDelete={handleDeleteConfig}
        onAdd={handleAddConfig}
      />
    );
  };

  return (
    <>
      <BottomSheetModal
        visible={visible}
        onClose={onClose}
        title={t("settings.title")}
        maxHeightRatio={0.85}
        fixedHeight={true}
      >
        <View style={[styles.tabBar, themedStyles.tabBar]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "general" && themedStyles.tabActive,
            ]}
            onPress={() => setActiveTab("general")}
          >
            <MaterialCommunityIcons
              name="cog"
              size={18}
              color={
                activeTab === "general" ? colors.text : colors.textMuted
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "general"
                  ? themedStyles.tabTextActive
                  : themedStyles.tabText,
              ]}
            >
              {t("settings.tabs.general")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "gemini" && themedStyles.tabActive,
            ]}
            onPress={() => setActiveTab("gemini")}
          >
            <MaterialCommunityIcons
              name="robot"
              size={18}
              color={activeTab === "gemini" ? colors.text : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "gemini"
                  ? themedStyles.tabTextActive
                  : themedStyles.tabText,
              ]}
            >
              {t("settings.tabs.geminiConfigs")}
            </Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </BottomSheetModal>

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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: "500" },
});

const settingsThemedStyles = createThemedStyles((colors) => ({
  tabBar: { backgroundColor: colors.surfaceLight },
  tabActive: { backgroundColor: colors.surfaceElevated },
  tabText: { color: colors.textMuted },
  tabTextActive: { color: colors.text },
}));

export default SettingsModal;

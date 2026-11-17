import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import type { DebugSettings } from "@src/types";
import Button3D from "@components/common/Button3D";
import ToggleSettingRow from "@components/common/ToggleSettingRow";
import { logger, LogFileInfo } from "@services/loggerService";
import { storageService } from "@services/storageService";
import { showAlert } from "@components/common/CustomAlert";
import {
  SettingsCard,
  SettingsSectionHeader,
  SettingsValuePill,
} from "../SettingsPrimitives";

interface DebugSectionProps {
  debugSettings: DebugSettings;
  onDebugChange: (settings: DebugSettings) => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const DebugSection: React.FC<DebugSectionProps> = ({
  debugSettings,
  onDebugChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const themedStyles = useThemedStyles(debugThemedStyles);
  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [storagePath, setStoragePath] = useState<string>("");

  useEffect(() => {
    loadInfo();
  }, [debugSettings.enabled]);

  const loadInfo = async () => {
    const files = await logger.getLogFiles();
    setLogFiles(files);
    const path =
      (await storageService.getBackupPath()) ||
      t("settings.debug.defaultStorage");
    setStoragePath(path);
  };

  const isSafPath = storagePath.startsWith("content://");
  const logDirPath = isSafPath ? storagePath : `${storagePath}/debug`;

  const handleToggleEnabled = (value: boolean) => {
    onDebugChange({ ...debugSettings, enabled: value });
  };

  const handleClearLogs = () => {
    showAlert(
      t("settings.debug.clearLogs"),
      t("settings.debug.clearLogsConfirm"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await logger.clearLogs();
            await loadInfo();
            showAlert(t("common.success"), t("settings.debug.clearLogsSuccess"), [
              { text: t("common.ok") },
            ]);
          },
        },
      ],
      "warning"
    );
  };

  const handleDeleteSingleLog = (file: LogFileInfo) => {
    showAlert(
      t("common.delete"),
      `${t("common.delete")} ${file.name}?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await logger.deleteLogFile(file.path);
            await loadInfo();
          },
        },
      ],
      "warning"
    );
  };

  const handleViewLog = async (file: LogFileInfo) => {
    setSelectedFile(file.name);
    const content = await logger.readLogFile(file.path);
    setFileContent(content);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View>
        <SettingsSectionHeader
          icon="power"
          title={t("settings.debug.statusTitle")}
          description={t("settings.debug.statusDescription")}
        />
        <SettingsCard style={styles.toggleCard}>
          <ToggleSettingRow
            value={debugSettings.enabled}
            onValueChange={handleToggleEnabled}
            label={
              debugSettings.enabled
                ? t("settings.debug.statusOn")
                : t("settings.debug.statusOff")
            }
            description={t("settings.debug.enabledHint")}
            icon="bug-outline"
            activeIcon="bug-check-outline"
            activeColor={colors.success}
            activeBackgroundColor={colors.successBg}
          />
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="folder-cog-outline"
          title={t("settings.debug.storageTitle")}
          description={t("settings.debug.storageDescription")}
        />
        <View style={themedStyles.infoCard}>
          <View style={[styles.pathIcon, themedStyles.pathIcon]}>
            <MaterialCommunityIcons
              name="folder-text-outline"
              size={21}
              color={colors.primary}
            />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={themedStyles.infoTitle}>
              {t("settings.debug.pathInfo")}
            </Text>
            <Text style={themedStyles.infoPath} numberOfLines={3}>
              {logDirPath}/
            </Text>
          </View>
        </View>
      </View>

      <View>
        <SettingsSectionHeader
          icon="file-document-multiple-outline"
          title={t("settings.debug.viewLogs")}
          description={t("settings.debug.logsDescription")}
          trailing={
            <SettingsValuePill
              value={t("settings.debug.logCount", { count: logFiles.length })}
            />
          }
        />
        {logFiles.length > 0 ? (
          <View style={styles.logListContainer}>
            {logFiles.map((file) => (
              <View key={file.name} style={themedStyles.logFileItem}>
                <TouchableOpacity
                  style={styles.fileItemMain}
                  onPress={() => handleViewLog(file)}
                >
                  <View style={[styles.fileIcon, themedStyles.fileIcon]}>
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.fileNameContainer}>
                    <Text style={themedStyles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    {file.size > 0 && (
                      <Text
                        style={[
                          styles.fileSizeText,
                          { color: colors.textMuted },
                        ]}
                      >
                        {formatBytes(file.size)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteSingleBtn, themedStyles.deleteSingleBtn]}
                  onPress={() => handleDeleteSingleLog(file)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.actionRow}>
              <Button3D
                title={t("settings.debug.clearLogs")}
                onPress={handleClearLogs}
                variant="destructive"
                size="small"
                icon="delete-outline"
              />
            </View>
          </View>
        ) : (
          <View style={[styles.emptyState, themedStyles.emptyState]}>
            <View style={[styles.emptyIcon, themedStyles.emptyIcon]}>
              <MaterialCommunityIcons
                name="file-check-outline"
                size={27}
                color={colors.textMuted}
              />
            </View>
            <Text style={themedStyles.emptyTitle}>
              {t("settings.debug.noLogs")}
            </Text>
            <Text style={themedStyles.emptyDescription}>
              {t("settings.debug.noLogsDescription")}
            </Text>
          </View>
        )}
      </View>

      {/* Viewer Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.surfaceElevated,
                borderBottomColor: colors.border,
                paddingTop: Math.max(insets.top + 8, 20),
              },
            ]}
          >
            <View style={styles.headerTitleWrapper}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedFile}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeHeaderBtn}
              onPress={() => setModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <Text selectable style={[styles.logText, { color: colors.textSecondary }]}>
              {fileContent || t("common.loading")}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 26,
    paddingBottom: 24,
  },
  toggleCard: {
    padding: 6,
  },
  infoTextWrapper: {
    flex: 1,
  },
  pathIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logListContainer: {
    gap: 9,
  },
  fileItemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  fileNameContainer: {
    flex: 1,
  },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  fileSizeText: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteSingleBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionRow: {
    marginTop: 5,
    alignItems: "stretch",
  },
  emptyState: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  closeHeaderBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  logText: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
});

const debugThemedStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pathIcon: { backgroundColor: colors.primarySoft },
    infoTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.text,
    },
    infoPath: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 2,
      fontFamily: "monospace",
    },
    logFileItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fileIcon: { backgroundColor: colors.primarySoft },
    deleteSingleBtn: { backgroundColor: colors.errorBg },
    fileName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    emptyIcon: { backgroundColor: colors.surfaceLight },
    emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
    emptyDescription: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 4,
    },
  })
);

import React, { useState, useEffect } from "react";
import { View, StyleSheet, Switch, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import type { DebugSettings } from "@src/types";
import Button3D from "@components/common/Button3D";
import { logger, LogFileInfo } from "@services/loggerService";
import { storageService } from "@services/storageService";
import { showAlert } from "@components/common/CustomAlert";

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
    const path = (await storageService.getBackupPath()) || "Mặc định (Default)";
    setStoragePath(path);
  };

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
      {/* Switch Toggle */}
      <View style={themedStyles.rowContainer}>
        <View style={styles.toggleInfo}>
          <MaterialCommunityIcons
            name="bug-outline"
            size={22}
            color={debugSettings.enabled ? colors.success : colors.textMuted}
          />
          <View style={styles.textContainer}>
            <Text style={themedStyles.settingLabel}>
              {t("settings.debug.enabled")}
            </Text>
            <Text style={themedStyles.settingHint}>
              {t("settings.debug.enabledHint")}
            </Text>
          </View>
        </View>
        <Switch
          value={debugSettings.enabled}
          onValueChange={handleToggleEnabled}
          trackColor={{ false: colors.border, true: colors.success }}
          thumbColor={debugSettings.enabled ? "#FFFFFF" : colors.surfaceElevated}
        />
      </View>

      {/* Path Info */}
      <View style={themedStyles.infoCard}>
        <MaterialCommunityIcons name="folder-text-outline" size={20} color={colors.primary} />
        <View style={styles.infoTextWrapper}>
          <Text style={themedStyles.infoTitle}>{t("settings.debug.pathInfo")}</Text>
          <Text style={themedStyles.infoPath} numberOfLines={2}>
            {storagePath}/debug/
          </Text>
          <Text style={themedStyles.infoCount}>
            {t("settings.debug.logCount", { count: logFiles.length })}
          </Text>
        </View>
      </View>

      {/* Log Files list */}
      {logFiles.length > 0 && (
        <View style={styles.logListContainer}>
          <Text style={themedStyles.sectionSubtitle}>{t("settings.debug.viewLogs")}</Text>
          {logFiles.map((file) => (
            <View key={file.name} style={themedStyles.logFileItem}>
              <TouchableOpacity
                style={styles.fileItemMain}
                onPress={() => handleViewLog(file)}
              >
                <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
                <View style={styles.fileNameContainer}>
                  <Text style={themedStyles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  {file.size > 0 && (
                    <Text style={styles.fileSizeText}>{formatBytes(file.size)}</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteSingleBtn}
                onPress={() => handleDeleteSingleLog(file)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {logFiles.length > 0 && (
        <View style={styles.actionRow}>
          <Button3D
            title={t("settings.debug.clearLogs")}
            onPress={handleClearLogs}
            variant="destructive"
            size="small"
            icon="delete-outline"
          />
        </View>
      )}

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
    paddingVertical: 8,
    paddingBottom: 24,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTextWrapper: {
    marginLeft: 10,
    flex: 1,
  },
  logListContainer: {
    marginTop: 16,
  },
  fileItemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  fileNameContainer: {
    flex: 1,
    marginLeft: 10,
  },
  fileSizeText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  deleteSingleBtn: {
    padding: 6,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  actionRow: {
    marginTop: 16,
    alignItems: "stretch",
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
    rowContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    settingHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.surfaceElevated,
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
    },
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
    infoCount: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
    },
    sectionSubtitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.textMuted,
      marginBottom: 8,
      textTransform: "uppercase",
    },
    logFileItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceElevated,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    fileName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
  })
);

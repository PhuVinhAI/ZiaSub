import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { Text } from "react-native-paper";
import { alert } from "../common/CustomAlert";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import Button3D from "../common/Button3D";
import SubtitleTextEditor from "./SubtitleTextEditor";

interface SrtTabProps {
  srtContent: string;
  setSrtContent: (text: string) => void;
  onLoadSubtitles: () => void;
  onOpenVisualEditor?: (content: string) => void;
  videoTitle?: string;
  configName?: string;
  presetName?: string;
}

export const SrtTab: React.FC<SrtTabProps> = ({
  srtContent,
  setSrtContent,
  onLoadSubtitles,
  onOpenVisualEditor,
  videoTitle,
  configName,
  presetName,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(srtTabThemedStyles);
  const [showEditor, setShowEditor] = useState(false);
  const lineCount = useMemo(
    () => (srtContent.length > 0 ? srtContent.split(/\r?\n/).length : 0),
    [srtContent],
  );

  const sanitizeFileName = (name: string): string => {
    // Remove invalid characters for file names
    return name.replace(/[<>:"/\\|?*]/g, "_").trim();
  };

  const handleExportSrt = async () => {
    if (!srtContent.trim()) {
      alert(t("common.notice"), t("subtitleModal.srt.noContent"));
      return;
    }

    try {
      // Build file name: videoTitle + configName + presetName.srt
      const parts: string[] = [];
      if (videoTitle) parts.push(sanitizeFileName(videoTitle));
      if (configName) parts.push(sanitizeFileName(configName));
      if (presetName) parts.push(sanitizeFileName(presetName));

      const fileName =
        parts.length > 0 ? `${parts.join("_")}.srt` : "subtitle.srt";

      // Write to temp file
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, srtContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share/export the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/x-subrip",
          dialogTitle: t("subtitleModal.srt.export"),
        });
      } else {
        alert(t("common.error"), t("subtitleModal.srt.exportError"));
      }
    } catch (error) {
      alert(t("common.error"), t("subtitleModal.srt.exportError"));
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset) {
        const content = await FileSystem.readAsStringAsync(asset.uri);
        setSrtContent(content);
      }
    } catch (error) {
      alert(t("common.error"), t("subtitleModal.srt.fileError"));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.buttonRow}>
          <Button3D
            onPress={handlePickFile}
            icon="file-document-outline"
            title={t("common.file")}
            variant="outline"
            style={styles.rowButton}
          />
          <Button3D
            onPress={handleExportSrt}
            icon="export"
            title={t("subtitleModal.srt.export")}
            variant="outline"
            style={styles.rowButton}
          />
        </View>
        <View style={[styles.previewContainer, themedStyles.previewContainer]}>
          <View style={styles.previewHeader}>
            <View style={styles.previewTitleGroup}>
              <View style={themedStyles.previewIcon}>
                <MaterialCommunityIcons
                  name="subtitles-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.previewTitleText}>
                <Text style={themedStyles.previewTitle}>
                  {t("subtitleModal.srt.contentTitle")}
                </Text>
                <Text style={themedStyles.previewMeta}>
                  {t("subtitleModal.srt.editorStats", {
                    lines: lineCount,
                    characters: srtContent.length,
                  })}
                </Text>
              </View>
            </View>
            {srtContent.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSrtContent("")}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.previewBody}
            onPress={() => setShowEditor(true)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t("subtitleModal.srt.editFullscreen")}
          >
            <Text
              style={[
                themedStyles.previewText,
                !srtContent && themedStyles.previewPlaceholder,
              ]}
              numberOfLines={10}
            >
              {srtContent || t("subtitleModal.srt.placeholder")}
            </Text>
            <View style={styles.previewFooter}>
              <Text style={themedStyles.previewHint}>
                {t("subtitleModal.srt.editFullscreen")}
              </Text>
              <MaterialCommunityIcons
                name="fullscreen"
                size={20}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.buttonWrapper}>
        <Button3D
          onPress={onLoadSubtitles}
          title={t("subtitleModal.srt.load")}
          variant="primary"
        />
      </View>
      <SubtitleTextEditor
        visible={showEditor}
        value={srtContent}
        onSave={setSrtContent}
        onOpenVisualEditor={
          onOpenVisualEditor
            ? (content) => {
                setSrtContent(content);
                setShowEditor(false);
                onOpenVisualEditor(content);
              }
            : undefined
        }
        onClose={() => setShowEditor(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContent: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  buttonRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  rowButton: { flex: 1 },
  previewContainer: {
    flex: 1,
    marginBottom: 16,
    minHeight: 200,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  previewHeader: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  previewTitleGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewTitleText: { flex: 1, minWidth: 0 },
  clearButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBody: { flex: 1, minHeight: 150, padding: 14 },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
  },
  buttonWrapper: { paddingTop: 12 },
});

const srtTabThemedStyles = createThemedStyles((colors) => ({
  previewContainer: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  previewTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  previewMeta: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  previewText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  previewPlaceholder: { color: colors.textMuted },
  previewHint: {
    flex: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
}));

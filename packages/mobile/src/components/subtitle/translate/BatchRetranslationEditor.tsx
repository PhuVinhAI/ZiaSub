import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
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

import Button3D from "@components/common/Button3D";
import { useTheme } from "@src/contexts";
import { createThemedStyles, useThemedStyles } from "@hooks/useThemedStyles";
import type { GeminiConfig, SavedTranslation } from "@src/types";
import TranslateConfigPicker from "./TranslateConfigPicker";
import type { BatchInfo } from "./translationListUtils";
import { formatTime, getBatchSettingsInfo } from "./translationListUtils";

interface BatchRetranslationEditorProps {
  visible: boolean;
  translation: SavedTranslation | null;
  batches: BatchInfo[];
  configs: GeminiConfig[];
  defaultConfigId: string;
  canStart: boolean;
  onClose: () => void;
  onStart: (
    translation: SavedTranslation,
    batchIndices: number[],
    configId: string,
  ) => void | Promise<void>;
}

const BatchRetranslationEditor: React.FC<
  BatchRetranslationEditorProps
> = ({
  visible,
  translation,
  batches,
  configs,
  defaultConfigId,
  canStart,
  onClose,
  onStart,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const themedStyles = useThemedStyles(editorThemedStyles);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState(defaultConfigId);
  const [showConfigPicker, setShowConfigPicker] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!visible || !translation) return;
    const savedConfig = configs.find(
      (config) => config.name === translation.configName,
    );
    setSelectedConfigId(savedConfig?.id || defaultConfigId);
    setSelectedIndices([]);
    setShowConfigPicker(false);
    setIsStarting(false);
  }, [configs, defaultConfigId, translation, visible]);

  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight);
  const errorBatchIndices = useMemo(
    () => batches.filter((batch) => batch.status === "error").map((b) => b.index),
    [batches],
  );
  const selectedSet = useMemo(
    () => new Set(selectedIndices),
    [selectedIndices],
  );

  const toggleBatch = (batchIndex: number) => {
    setSelectedIndices((current) =>
      current.includes(batchIndex)
        ? current.filter((index) => index !== batchIndex)
        : [...current, batchIndex].sort((a, b) => a - b),
    );
  };

  const handleStart = async () => {
    if (
      !translation ||
      selectedIndices.length === 0 ||
      !selectedConfigId ||
      isStarting
    ) {
      return;
    }
    setIsStarting(true);
    try {
      await onStart(translation, selectedIndices, selectedConfigId);
    } finally {
      setIsStarting(false);
    }
  };

  if (!translation) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[themedStyles.screen, { paddingTop }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />

        <View style={themedStyles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={themedStyles.headerTitle} numberOfLines={1}>
              {t("subtitleModal.translate.batchEditor.title")}
            </Text>
            <Text style={themedStyles.headerSubtitle} numberOfLines={1}>
              {translation.configName}
            </Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentInner}>
            <View style={[styles.hero, themedStyles.hero]}>
              <View style={themedStyles.heroIcon}>
                <MaterialCommunityIcons
                  name="playlist-edit"
                  size={25}
                  color={colors.primary}
                />
              </View>
              <View style={styles.heroText}>
                <Text style={themedStyles.heroTitle}>
                  {t("subtitleModal.translate.batchEditor.heroTitle")}
                </Text>
                <Text style={themedStyles.heroDescription}>
                  {t("subtitleModal.translate.batchEditor.heroDescription")}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryItem, themedStyles.summaryItem]}>
                <MaterialCommunityIcons
                  name="robot-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.summaryText}>
                  <Text style={themedStyles.summaryLabel}>
                    {t("subtitleModal.translate.batchEditor.originalConfig")}
                  </Text>
                  <Text style={themedStyles.summaryValue} numberOfLines={1}>
                    {translation.configName}
                  </Text>
                </View>
              </View>
              <View style={[styles.summaryItem, themedStyles.summaryItem]}>
                <MaterialCommunityIcons
                  name="view-grid-outline"
                  size={18}
                  color={colors.success}
                />
                <View style={styles.summaryText}>
                  <Text style={themedStyles.summaryLabel}>
                    {t("subtitleModal.translate.batchEditor.totalBatches")}
                  </Text>
                  <Text style={themedStyles.summaryValue}>{batches.length}</Text>
                </View>
              </View>
            </View>

            {getBatchSettingsInfo(translation) ? (
              <View style={[styles.infoStrip, themedStyles.infoStrip]}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={17}
                  color={colors.textMuted}
                />
                <Text style={themedStyles.infoStripText}>
                  {getBatchSettingsInfo(translation)}
                </Text>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleGroup}>
                <Text style={themedStyles.sectionTitle}>
                  {t("subtitleModal.translate.batchEditor.configTitle")}
                </Text>
                <Text style={themedStyles.sectionDescription}>
                  {t("subtitleModal.translate.batchEditor.configDescription")}
                </Text>
              </View>
            </View>
            <TranslateConfigPicker
              configs={configs}
              selectedConfigId={selectedConfigId}
              showPicker={showConfigPicker}
              onTogglePicker={() => setShowConfigPicker((current) => !current)}
              onSelectConfig={setSelectedConfigId}
            />

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleGroup}>
                <Text style={themedStyles.sectionTitle}>
                  {t("subtitleModal.translate.batchEditor.selectionTitle")}
                </Text>
                <Text style={themedStyles.sectionDescription}>
                  {t("subtitleModal.translate.batchEditor.selectionDescription")}
                </Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickAction, themedStyles.quickAction]}
                onPress={() => setSelectedIndices(batches.map((batch) => batch.index))}
                activeOpacity={0.72}
              >
                <MaterialCommunityIcons
                  name="checkbox-multiple-marked-outline"
                  size={17}
                  color={colors.primary}
                />
                <Text style={themedStyles.quickActionText}>
                  {t("subtitleModal.translate.batchEditor.selectAll")}
                </Text>
              </TouchableOpacity>
              {errorBatchIndices.length > 0 ? (
                <TouchableOpacity
                  style={[styles.quickAction, themedStyles.quickActionError]}
                  onPress={() => setSelectedIndices(errorBatchIndices)}
                  activeOpacity={0.72}
                >
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={17}
                    color={colors.error}
                  />
                  <Text style={themedStyles.quickActionErrorText}>
                    {t("subtitleModal.translate.batchEditor.selectErrors")}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.quickAction, themedStyles.quickAction]}
                onPress={() => setSelectedIndices([])}
                activeOpacity={0.72}
              >
                <MaterialCommunityIcons
                  name="selection-remove"
                  size={17}
                  color={colors.textMuted}
                />
                <Text style={themedStyles.quickActionText}>
                  {t("subtitleModal.translate.batchEditor.clearSelection")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.batchGrid}>
              {batches.map((batch) => {
                const selected = selectedSet.has(batch.index);
                const statusColor =
                  batch.status === "error"
                    ? colors.error
                    : batch.status === "completed"
                      ? colors.success
                      : colors.textMuted;
                return (
                  <TouchableOpacity
                    key={batch.index}
                    style={[
                      styles.batchCard,
                      themedStyles.batchCard,
                      selected && themedStyles.batchCardSelected,
                    ]}
                    onPress={() => toggleBatch(batch.index)}
                    activeOpacity={0.72}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <View style={styles.batchCardHeader}>
                      <View
                        style={[
                          styles.checkbox,
                          themedStyles.checkbox,
                          selected && themedStyles.checkboxSelected,
                        ]}
                      >
                        {selected ? (
                          <MaterialCommunityIcons
                            name="check"
                            size={16}
                            color={colors.onPrimary}
                          />
                        ) : null}
                      </View>
                      <View style={styles.batchNumberGroup}>
                        <Text style={themedStyles.batchNumber}>
                          {t("subtitleModal.translate.batchEditor.batchNumber", {
                            batch: batch.index + 1,
                          })}
                        </Text>
                        <MaterialCommunityIcons
                          name={
                            batch.status === "error"
                              ? "alert-circle"
                              : batch.status === "completed"
                                ? "check-circle"
                                : "clock-outline"
                          }
                          size={16}
                          color={statusColor}
                        />
                      </View>
                    </View>
                    <Text style={themedStyles.batchTime}>
                      {formatTime(batch.startTime)} – {formatTime(batch.endTime)}
                    </Text>
                    <Text style={themedStyles.batchMeta}>
                      {t("subtitleModal.translate.batchEditor.subtitleCount", {
                        count: batch.subtitleCount,
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.mergeNote, themedStyles.mergeNote]}>
              <MaterialCommunityIcons
                name="source-merge"
                size={19}
                color={colors.primary}
              />
              <Text style={themedStyles.mergeNoteText}>
                {t("subtitleModal.translate.batchEditor.mergeNote")}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            themedStyles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.footerSummary}>
            <Text style={themedStyles.footerTitle} numberOfLines={2}>
              {selectedIndices.length > 0
                ? t("subtitleModal.translate.batchEditor.readyTitle", {
                    count: selectedIndices.length,
                  })
                : t("subtitleModal.translate.batchEditor.noneSelected")}
            </Text>
          </View>
          <View style={styles.footerButton}>
            <Button3D
              title={t("subtitleModal.translate.batchEditor.start")}
              icon="refresh"
              onPress={handleStart}
              loading={isStarting}
              disabled={
                !canStart ||
                selectedIndices.length === 0 ||
                !selectedConfigId ||
                isStarting
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleGroup: { flex: 1, minWidth: 0, alignItems: "center" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  contentInner: { width: "100%", maxWidth: 720, alignSelf: "center" },
  hero: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  heroText: { flex: 1 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  summaryItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 10,
    borderRadius: 8,
  },
  summaryText: { flex: 1, minWidth: 0 },
  infoStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 11,
    borderRadius: 8,
  },
  sectionHeader: { marginTop: 24, marginBottom: 10 },
  sectionTitleGroup: { flex: 1 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  quickAction: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    borderRadius: 8,
  },
  batchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  batchCard: {
    width: "48.7%",
    minHeight: 104,
    padding: 11,
    borderRadius: 9,
    borderWidth: 2,
  },
  batchCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  batchNumberGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  mergeNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 11,
  },
  footerSummary: { flex: 1, minWidth: 0 },
  footerButton: { width: 176 },
});

const editorThemedStyles = createThemedStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 60,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: "700" as const },
  headerSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  hero: { backgroundColor: colors.primarySoft },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.surface,
  },
  heroTitle: { color: colors.text, fontSize: 15, fontWeight: "700" as const },
  heroDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  summaryItem: { backgroundColor: colors.surfaceLight },
  summaryLabel: { color: colors.textMuted, fontSize: 10 },
  summaryValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700" as const,
    marginTop: 2,
  },
  infoStrip: { backgroundColor: colors.surfaceLight },
  infoStripText: { flex: 1, color: colors.textSecondary, fontSize: 11 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "700" as const },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  quickAction: { backgroundColor: colors.surfaceLight },
  quickActionText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" as const },
  quickActionError: { backgroundColor: colors.errorBg },
  quickActionErrorText: { color: colors.error, fontSize: 12, fontWeight: "600" as const },
  batchCard: {
    backgroundColor: colors.surfaceLight,
    borderColor: "transparent",
  },
  batchCardSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  checkbox: { backgroundColor: colors.surfaceElevated },
  checkboxSelected: { backgroundColor: colors.primary },
  batchNumber: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "700" as const },
  batchTime: { color: colors.textSecondary, fontSize: 11, marginTop: 10 },
  batchMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  mergeNote: { backgroundColor: colors.primarySoft },
  mergeNoteText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerTitle: { color: colors.text, fontSize: 13, fontWeight: "700" as const },
}));

export default BatchRetranslationEditor;

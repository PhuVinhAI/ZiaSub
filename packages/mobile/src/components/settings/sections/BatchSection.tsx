import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import {
  BottomSheetModal,
  ControlSlider,
  SelectionSettingRow,
} from "@components/common";
import type { BatchSettings, GeminiConfig } from "@src/types";
import { getGeminiConfigs } from "@utils/storage";
import {
  SettingsCard,
  SettingsSectionHeader,
} from "../SettingsPrimitives";

interface BatchSectionProps {
  batchSettings: BatchSettings;
  onBatchChange: (settings: BatchSettings) => void;
}

export const BatchSection: React.FC<BatchSectionProps> = ({
  batchSettings,
  onBatchChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(batchThemedStyles);
  const [geminiConfigs, setGeminiConfigs] = useState<GeminiConfig[]>([]);
  const [showConfigPicker, setShowConfigPicker] = useState(false);
  const [draft, setDraft] = useState(batchSettings);

  useEffect(() => {
    getGeminiConfigs().then(setGeminiConfigs);
  }, []);

  useEffect(() => {
    setDraft(batchSettings);
  }, [batchSettings]);

  const updateDraft = <K extends keyof BatchSettings>(
    key: K,
    value: BatchSettings[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const commitSetting = <K extends keyof BatchSettings>(
    key: K,
    value: BatchSettings[K]
  ) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onBatchChange(next);
  };

  const selectedPresubConfig = geminiConfigs.find(
    (config) => config.id === draft.presubConfigId
  );
  const presubConfigName =
    selectedPresubConfig?.name || t("settings.batch.presubConfigSame");

  const batchOffset = draft.batchOffset ?? 60;
  const presubDuration = draft.presubDuration ?? 120;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (minutes === 0) return `${remainingSeconds}s`;
    return `${minutes}m${remainingSeconds > 0 ? ` ${remainingSeconds}s` : ""}`;
  };

  const handlePresubConfigChange = (configId: string | undefined) => {
    const next = { ...draft, presubConfigId: configId };
    setDraft(next);
    onBatchChange(next);
    setShowConfigPicker(false);
  };

  return (
    <View style={styles.container}>
      <View>
        <SettingsSectionHeader
          icon="content-cut"
          title={t("settings.batch.splittingTitle")}
          description={t("settings.batch.splittingDescription")}
        />
        <SettingsCard>
          <ControlSlider
            label={t("settings.batch.partLength")}
            description={t("settings.batch.batchDurationHint")}
            icon="clock-outline"
            minimumValue={60}
            maximumValue={1800}
            step={60}
            value={draft.maxVideoDuration}
            formatValue={(value) =>
              `${Math.round(value / 60)} ${t("settings.batch.minutes")}`
            }
            minimumLabel={`1 ${t("settings.batch.minutes")}`}
            maximumLabel={`30 ${t("settings.batch.minutes")}`}
            onValueChange={(value) => updateDraft("maxVideoDuration", value)}
            onSlidingComplete={(value) =>
              commitSetting("maxVideoDuration", value)
            }
          />

          <View style={[styles.divider, themedStyles.divider]} />

          <ControlSlider
            label={t("settings.batch.tolerance")}
            description={t("settings.batch.offsetHint")}
            icon="timer-sand"
            minimumValue={0}
            maximumValue={300}
            step={15}
            value={batchOffset}
            formatValue={formatDuration}
            minimumLabel="0s"
            maximumLabel="5m"
            onValueChange={(value) => updateDraft("batchOffset", value)}
            onSlidingComplete={(value) => commitSetting("batchOffset", value)}
          />
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="speedometer"
          title={t("settings.batch.performanceTitle")}
          description={t("settings.batch.performanceDescription")}
        />
        <SettingsCard>
          <ControlSlider
            label={t("settings.batch.parallelParts")}
            description={t("settings.batch.maxConcurrentHint")}
            icon="layers-triple-outline"
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={draft.maxConcurrentBatches}
            formatValue={(value) => String(Math.round(value))}
            minimumLabel="1"
            maximumLabel="5"
            onValueChange={(value) =>
              updateDraft("maxConcurrentBatches", value)
            }
            onSlidingComplete={(value) =>
              commitSetting("maxConcurrentBatches", value)
            }
          />
          <View style={[styles.performanceHint, themedStyles.performanceHint]}>
            <MaterialCommunityIcons
              name="information-outline"
              size={17}
              color={colors.warning}
            />
            <Text style={themedStyles.performanceHintText}>
              {t("settings.batch.performanceHint")}
            </Text>
          </View>
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="lightning-bolt-outline"
          title={t("settings.batch.quickPreviewTitle")}
          description={t("settings.batch.quickPreviewDescription")}
        />
        <SettingsCard>
          <ControlSlider
            label={t("settings.batch.previewLength")}
            description={t("settings.batch.presubDurationHint")}
            icon="movie-open-outline"
            accentColor={colors.warning}
            minimumValue={30}
            maximumValue={300}
            step={15}
            value={presubDuration}
            formatValue={formatDuration}
            minimumLabel="30s"
            maximumLabel="5m"
            onValueChange={(value) => updateDraft("presubDuration", value)}
            onSlidingComplete={(value) =>
              commitSetting("presubDuration", value)
            }
          />

          <View style={[styles.divider, themedStyles.divider]} />

          <View>
            <Text style={themedStyles.settingLabel}>
              {t("settings.batch.presubConfig")}
            </Text>
            <Text style={themedStyles.settingHint}>
              {t("settings.batch.presubConfigHint")}
            </Text>
            <TouchableOpacity
              style={themedStyles.configPicker}
              onPress={() => setShowConfigPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.configPickerLeft}>
                <View style={[styles.configIcon, themedStyles.configIcon]}>
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={colors.warning}
                  />
                </View>
                <View style={styles.configText}>
                  <Text style={themedStyles.configPickerText} numberOfLines={1}>
                    {presubConfigName}
                  </Text>
                  <Text style={themedStyles.configPickerHint}>
                    {selectedPresubConfig
                      ? selectedPresubConfig.model.replace("models/", "")
                      : t("settings.batch.presubConfigSameHint")}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </SettingsCard>
      </View>

      <BottomSheetModal
        visible={showConfigPicker}
        onClose={() => setShowConfigPicker(false)}
        title={t("settings.batch.presubConfig")}
        maxHeightRatio={0.65}
      >
        <ScrollView
          style={sheetStyles.list}
          contentContainerStyle={sheetStyles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <SelectionSettingRow
            label={t("settings.batch.presubConfigSame")}
            description={t("settings.batch.presubConfigSameHint")}
            icon="link-variant"
            selected={!draft.presubConfigId}
            onPress={() => handlePresubConfigChange(undefined)}
          />
          {geminiConfigs.map((config) => {
            const isActive = draft.presubConfigId === config.id;
            return (
              <SelectionSettingRow
                key={config.id}
                label={config.name}
                description={config.model.replace("models/", "")}
                icon="lightning-bolt-outline"
                selected={isActive}
                onPress={() => handlePresubConfigChange(config.id)}
              />
            );
          })}
        </ScrollView>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 26 },
  divider: { height: 1, marginVertical: 18 },
  performanceHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 11,
    padding: 11,
    marginTop: 12,
  },
  configPickerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    flex: 1,
  },
  configIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  configText: { flex: 1 },
});

const sheetStyles = StyleSheet.create({
  list: { maxHeight: 380 },
  listContent: { gap: 4, paddingBottom: 12 },
});

const batchThemedStyles = createThemedStyles((colors) => ({
  settingLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  settingHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  divider: { backgroundColor: colors.border },
  performanceHint: { backgroundColor: colors.warningBg },
  performanceHintText: {
    flex: 1,
    color: colors.warning,
    fontSize: 11,
    lineHeight: 16,
  },
  configPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceLight,
    borderRadius: 13,
    padding: 12,
    marginTop: 12,
  },
  configIcon: { backgroundColor: colors.warningBg },
  configPickerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  configPickerHint: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
}));

export default BatchSection;

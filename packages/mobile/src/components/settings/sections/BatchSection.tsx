import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import Slider from "@react-native-community/slider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { BottomSheetModal } from "@components/common";
import type { BatchSettings, GeminiConfig } from "@src/types";
import { saveBatchSettings, getGeminiConfigs } from "@utils/storage";

interface BatchSectionProps {
  batchSettings: BatchSettings;
  onBatchChange: (settings: BatchSettings) => void;
}

const BatchSection: React.FC<BatchSectionProps> = ({
  batchSettings,
  onBatchChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(batchThemedStyles);
  const themedSheetStyles = useThemedStyles(sheetThemedStyles);
  const [geminiConfigs, setGeminiConfigs] = useState<GeminiConfig[]>([]);
  const [showConfigPicker, setShowConfigPicker] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    const configs = await getGeminiConfigs();
    setGeminiConfigs(configs);
  };

  // Get selected presub config name
  const selectedPresubConfig = geminiConfigs.find(
    (c) => c.id === batchSettings.presubConfigId
  );
  const presubConfigName =
    selectedPresubConfig?.name || t("settings.batch.presubConfigSame");

  const handleBatchDurationChange = (value: number) => {
    const newSettings = { ...batchSettings, maxVideoDuration: value };
    onBatchChange(newSettings);
    saveBatchSettings(newSettings);
  };

  const handleConcurrentChange = (value: number) => {
    const newSettings = { ...batchSettings, maxConcurrentBatches: value };
    onBatchChange(newSettings);
    saveBatchSettings(newSettings);
  };

  const handlePresubConfigChange = (configId: string | undefined) => {
    const newSettings = { ...batchSettings, presubConfigId: configId };
    onBatchChange(newSettings);
    saveBatchSettings(newSettings);
    setShowConfigPicker(false);
  };

  return (
    <>
      {/* Batch Duration Slider */}
      <View style={styles.settingGroup}>
        <Text style={themedStyles.settingLabel}>
          {t("settings.batch.batchDuration", {
            minutes: Math.round(batchSettings.maxVideoDuration / 60),
          })}
        </Text>
        <Text style={themedStyles.settingHint}>
          {t("settings.batch.batchDurationHint")}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={60}
          maximumValue={1800}
          step={60}
          value={batchSettings.maxVideoDuration}
          onSlidingComplete={handleBatchDurationChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
      </View>

      {/* Concurrent Batches Slider */}
      <View style={styles.settingGroup}>
        <Text style={themedStyles.settingLabel}>
          {t("settings.batch.maxConcurrent", {
            count: batchSettings.maxConcurrentBatches,
          })}
        </Text>
        <Text style={themedStyles.settingHint}>
          {t("settings.batch.maxConcurrentHint")}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={batchSettings.maxConcurrentBatches}
          onSlidingComplete={handleConcurrentChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
      </View>

      {/* Pre-sub Config Picker */}
      <View style={styles.settingGroup}>
        <Text style={themedStyles.settingLabel}>
          {t("settings.batch.presubConfig")}
        </Text>
        <Text style={themedStyles.settingHint}>
          {t("settings.batch.presubConfigHint")}
        </Text>
        <TouchableOpacity
          style={themedStyles.configPicker}
          onPress={() => setShowConfigPicker(!showConfigPicker)}
          activeOpacity={0.7}
        >
          <View style={styles.configPickerLeft}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={20}
              color={colors.warning}
            />
            <Text style={themedStyles.configPickerText} numberOfLines={1}>
              {presubConfigName}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={showConfigPicker ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        visible={showConfigPicker}
        onClose={() => setShowConfigPicker(false)}
        title={t("settings.batch.presubConfig")}
        maxHeightRatio={0.65}
      >
        <ScrollView style={sheetStyles.list} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              themedSheetStyles.item,
              !batchSettings.presubConfigId && themedSheetStyles.itemActive,
            ]}
            onPress={() => handlePresubConfigChange(undefined)}
          >
            <Text
              style={[
                themedSheetStyles.itemName,
                !batchSettings.presubConfigId &&
                  themedSheetStyles.itemNameActive,
              ]}
            >
              {t("settings.batch.presubConfigSame")}
            </Text>
            {!batchSettings.presubConfigId && (
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
          {geminiConfigs.map((config) => {
            const isActive = batchSettings.presubConfigId === config.id;
            return (
              <TouchableOpacity
                key={config.id}
                style={[
                  themedSheetStyles.item,
                  isActive && themedSheetStyles.itemActive,
                ]}
                onPress={() => handlePresubConfigChange(config.id)}
              >
                <View style={sheetStyles.itemContent}>
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={isActive ? colors.warning : colors.textMuted}
                  />
                  <View style={sheetStyles.itemText}>
                    <Text
                      style={[
                        themedSheetStyles.itemName,
                        isActive && themedSheetStyles.itemNameActive,
                      ]}
                    >
                      {config.name}
                    </Text>
                    <Text style={themedSheetStyles.itemModel}>
                      {config.model.replace("models/", "")}
                    </Text>
                  </View>
                </View>
                {isActive && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  settingGroup: { marginBottom: 16 },
  slider: { width: "100%", height: 40 },
  configPickerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
});

const sheetStyles = StyleSheet.create({
  list: { maxHeight: 380 },
  itemContent: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  itemText: { flex: 1 },
});

const sheetThemedStyles = createThemedStyles((colors) => ({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  itemName: { color: colors.text, fontSize: 15, fontWeight: "500" },
  itemNameActive: { color: colors.primary },
  itemModel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
}));

const batchThemedStyles = createThemedStyles((colors) => ({
  settingLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  settingHint: { color: colors.textMuted, fontSize: 12, marginBottom: 8 },
  configPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  configPickerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
}));

export default BatchSection;

import React, { useState, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
  Platform,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import {
  BottomSheetModal,
  ControlSlider,
  SelectionSettingRow,
} from "@components/common";
import type { GeminiConfig } from "@src/types";
import { supportsMinimalThinking } from "@services/geminiModelConfig";
import {
  SettingsCard,
  SettingsPageIntro,
  SettingsSectionHeader,
} from "./SettingsPrimitives";
import SystemPromptEditor from "./SystemPromptEditor";

// Model IDs
const MODEL_GEMINI_3_7_FLASH = "models/gemini-3.7-flash";
const MODEL_GEMINI_3_6_FLASH = "models/gemini-3.6-flash";
const MODEL_GEMINI_3_5_FLASH = "models/gemini-3.5-flash";
const MODEL_GEMINI_3_5_FLASH_LITE = "models/gemini-3.5-flash-lite";
const MODEL_GEMINI_3_FLASH = "models/gemini-3-flash-preview";
const MODEL_GEMINI_3_1_PRO = "models/gemini-3.1-pro-preview";
const MODEL_GEMINI_3_1_FLASH_LITE = "models/gemini-3.1-flash-lite";
const MODEL_GEMINI_PRO = "models/gemini-pro-latest";
const MODEL_GEMINI_FLASH = "models/gemini-flash-latest";
const MODEL_GEMINI_FLASH_LITE = "models/gemini-flash-lite-latest";

const AVAILABLE_MODELS = [
  { id: MODEL_GEMINI_FLASH, name: "Gemini Flash (Latest)" },
  { id: MODEL_GEMINI_FLASH_LITE, name: "Gemini Flash Lite (Latest)" },
  { id: MODEL_GEMINI_PRO, name: "Gemini Pro (Latest)" },
  { id: MODEL_GEMINI_3_7_FLASH, name: "Gemini 3.7 Flash" },
  { id: MODEL_GEMINI_3_6_FLASH, name: "Gemini 3.6 Flash" },
  { id: MODEL_GEMINI_3_5_FLASH, name: "Gemini 3.5 Flash" },
  { id: MODEL_GEMINI_3_5_FLASH_LITE, name: "Gemini 3.5 Flash Lite" },
  { id: MODEL_GEMINI_3_1_FLASH_LITE, name: "Gemini 3.1 Flash Lite" },
  { id: MODEL_GEMINI_3_FLASH, name: "Gemini 3 Flash (Preview)" },
  { id: MODEL_GEMINI_3_1_PRO, name: "Gemini 3.1 Pro (Preview)" },
];

interface SelectOption {
  id: string;
  name: string;
  subText?: string;
}

interface SelectBottomSheetProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const SelectBottomSheet: React.FC<SelectBottomSheetProps> = ({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}) => {
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      maxHeightRatio={0.65}
    >
      <ScrollView
        style={sheetStyles.list}
        contentContainerStyle={sheetStyles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option) => {
          const isActive = option.id === selectedId;
          return (
            <SelectionSettingRow
              key={option.id}
              label={option.name}
              description={option.subText}
              selected={isActive}
              onPress={() => {
                onSelect(option.id);
                onClose();
              }}
            />
          );
        })}
      </ScrollView>
    </BottomSheetModal>
  );
};

interface GeminiEditProps {
  visible: boolean;
  config: GeminiConfig;
  onChange: (config: GeminiConfig) => void;
  onSave: () => void;
  onCancel: () => void;
}

const GeminiEdit: React.FC<GeminiEditProps> = ({
  visible,
  config,
  onChange,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(themedStyles);

  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showResolutionPicker, setShowResolutionPicker] = useState(false);
  const [showThinkingPicker, setShowThinkingPicker] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === config.model);
  const modelDisplayName = selectedModel ? selectedModel.name : config.model;

  const noMinimalThinking = !supportsMinimalThinking(config.model);

  const mediaResolutionOptions = useMemo<SelectOption[]>(
    () => [
      {
        id: "MEDIA_RESOLUTION_HIGH",
        name: t("settings.geminiConfig.optionHigh"),
      },
      {
        id: "MEDIA_RESOLUTION_MEDIUM",
        name: t("settings.geminiConfig.optionMedium"),
      },
      {
        id: "MEDIA_RESOLUTION_LOW",
        name: t("settings.geminiConfig.optionLow"),
      },
      {
        id: "MEDIA_RESOLUTION_UNSPECIFIED",
        name: t("settings.geminiConfig.optionDefault"),
      },
    ],
    [t],
  );

  const thinkingLevelOptions = useMemo(() => {
    const high = { id: "HIGH", name: t("settings.geminiConfig.optionHigh") };
    const medium = {
      id: "MEDIUM",
      name: t("settings.geminiConfig.optionMedium"),
    };
    const low = { id: "LOW", name: t("settings.geminiConfig.optionLow") };
    if (noMinimalThinking) return [high, medium, low];
    return [
      high,
      medium,
      low,
      { id: "MINIMAL", name: t("settings.geminiConfig.optionMinimal") },
    ];
  }, [noMinimalThinking, t]);

  const selectedThinking = thinkingLevelOptions.find(
    (o) => o.id === (config.thinkingLevel || "HIGH"),
  );
  const thinkingDisplayName = selectedThinking
    ? selectedThinking.name
    : config.thinkingLevel || "HIGH";

  const selectedResolution = mediaResolutionOptions.find(
    (o) => o.id === (config.mediaResolution || "MEDIA_RESOLUTION_HIGH"),
  );
  const resolutionDisplayName = selectedResolution
    ? selectedResolution.name
    : config.mediaResolution || "High";

  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight, 20);
  const editorTitle = config.id
    ? t("settings.geminiConfig.editTitle")
    : t("settings.geminiConfig.addTitle");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={[styles.fullScreen, { paddingTop }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={t("common.cancel")}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.titleText}>{editorTitle}</Text>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              !config.name.trim() && styles.saveBtnDisabled,
            ]}
            onPress={onSave}
            disabled={!config.name.trim()}
            accessibilityRole="button"
            accessibilityLabel={t("common.save")}
          >
            <MaterialCommunityIcons
              name="content-save-outline"
              size={20}
              color={
                config.name.trim() ? colors.onPrimary : colors.disabledText
              }
            />
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentInner}>
            <SettingsPageIntro
              icon="robot-outline"
              title={editorTitle}
              description={t("settings.geminiConfig.editorDescription")}
            />

            <View style={styles.section}>
              <SettingsSectionHeader
                icon="card-text-outline"
                title={t("settings.geminiConfig.basicTitle")}
                description={t("settings.geminiConfig.basicDescription")}
              />
              <SettingsCard style={styles.formCard}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.settingLabel}>
                    {t("settings.geminiConfig.name")}
                  </Text>
                  <RNTextInput
                    style={styles.input}
                    value={config.name}
                    onChangeText={(text) => onChange({ ...config, name: text })}
                    placeholder={t("settings.geminiConfig.namePlaceholder")}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldGroup}>
                  <Text style={styles.settingLabel}>
                    {t("settings.geminiConfig.model")}
                  </Text>
                  <TouchableOpacity
                    style={styles.modelPicker}
                    onPress={() => setShowModelPicker(true)}
                    activeOpacity={0.72}
                  >
                    <View style={styles.pickerIcon}>
                      <MaterialCommunityIcons
                        name="memory"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.pickerTextContent}>
                      <Text style={styles.modelPickerText}>
                        {modelDisplayName}
                      </Text>
                      <Text style={styles.modelPickerHint} numberOfLines={1}>
                        {config.model}
                      </Text>
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

            <View style={styles.section}>
              <SettingsSectionHeader
                icon="tune-variant"
                title={t("settings.geminiConfig.behaviorTitle")}
                description={t("settings.geminiConfig.behaviorDescription")}
              />
              <SettingsCard style={styles.formCard}>
                <ControlSlider
                  label={t("settings.geminiConfig.temperatureLabel")}
                  description={t("settings.geminiConfig.temperatureHint")}
                  icon="creation-outline"
                  minimumValue={0.0}
                  maximumValue={2.0}
                  step={0.1}
                  value={config.temperature}
                  formatValue={(value) => value.toFixed(1)}
                  minimumLabel={t("settings.geminiConfig.temperaturePrecise")}
                  maximumLabel={t("settings.geminiConfig.temperatureCreative")}
                  onSlidingComplete={(value) =>
                    onChange({ ...config, temperature: value })
                  }
                />

                <View style={styles.divider} />

                <View style={styles.fieldGroup}>
                  <Text style={styles.settingLabel}>
                    {t("settings.geminiConfig.mediaResolution")}
                  </Text>
                  <TouchableOpacity
                    style={styles.modelPicker}
                    onPress={() => setShowResolutionPicker(true)}
                    activeOpacity={0.72}
                  >
                    <View style={styles.pickerIcon}>
                      <MaterialCommunityIcons
                        name="video-high-definition"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[styles.modelPickerText, styles.pickerTextContent]}
                    >
                      {resolutionDisplayName}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldGroup}>
                  <Text style={styles.settingLabel}>
                    {t("settings.geminiConfig.thinkingLevel")}
                  </Text>
                  <TouchableOpacity
                    style={styles.modelPicker}
                    onPress={() => setShowThinkingPicker(true)}
                    activeOpacity={0.72}
                  >
                    <View style={styles.pickerIcon}>
                      <MaterialCommunityIcons
                        name="head-cog-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[styles.modelPickerText, styles.pickerTextContent]}
                    >
                      {thinkingDisplayName}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </SettingsCard>
            </View>

            <View style={styles.section}>
              <SettingsSectionHeader
                icon="text-box-edit-outline"
                title={t("settings.geminiConfig.systemPrompt")}
                description={t("settings.geminiConfig.promptDescription")}
                trailing={
                  <View style={styles.characterPill}>
                    <Text style={styles.characterText}>
                      {t("settings.geminiConfig.characters", {
                        count: config.systemPrompt.length,
                      })}
                    </Text>
                  </View>
                }
              />
              <TouchableOpacity
                style={styles.promptPreview}
                onPress={() => setShowPromptEditor(true)}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel={t("common.edit")}
              >
                <View style={styles.promptPreviewIcon}>
                  <MaterialCommunityIcons
                    name="file-document-edit-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.promptPreviewText,
                    !config.systemPrompt.trim() &&
                      styles.promptPreviewPlaceholder,
                  ]}
                  numberOfLines={4}
                >
                  {config.systemPrompt.trim() ||
                    t("settings.geminiConfig.systemPromptPlaceholder")}
                </Text>
                <MaterialCommunityIcons
                  name="arrow-expand"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>

        <SystemPromptEditor
          visible={showPromptEditor}
          value={config.systemPrompt}
          onSave={(systemPrompt) => onChange({ ...config, systemPrompt })}
          onClose={() => setShowPromptEditor(false)}
        />

        {/* Model Picker Bottom Sheet */}
        <SelectBottomSheet
          visible={showModelPicker}
          title={t("settings.geminiConfig.model")}
          options={AVAILABLE_MODELS.map((m) => ({
            id: m.id,
            name: m.name,
            subText: m.id,
          }))}
          selectedId={config.model}
          onSelect={(modelId) => onChange({ ...config, model: modelId })}
          onClose={() => setShowModelPicker(false)}
        />

        {/* Resolution Picker Bottom Sheet */}
        <SelectBottomSheet
          visible={showResolutionPicker}
          title={t("settings.geminiConfig.mediaResolution")}
          options={mediaResolutionOptions}
          selectedId={config.mediaResolution || "MEDIA_RESOLUTION_HIGH"}
          onSelect={(resId) =>
            onChange({ ...config, mediaResolution: resId as any })
          }
          onClose={() => setShowResolutionPicker(false)}
        />

        {/* Thinking Level Picker Bottom Sheet */}
        <SelectBottomSheet
          visible={showThinkingPicker}
          title={t("settings.geminiConfig.thinkingLevel")}
          options={thinkingLevelOptions}
          selectedId={config.thinkingLevel || "HIGH"}
          onSelect={(levelId) =>
            onChange({ ...config, thinkingLevel: levelId as any })
          }
          onClose={() => setShowThinkingPicker(false)}
        />
      </View>
    </Modal>
  );
};

const sheetStyles = StyleSheet.create({
  list: { maxHeight: 380 },
  listContent: { gap: 4, paddingBottom: 12 },
});

const themedStyles = createThemedStyles((colors) => ({
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    minHeight: 60,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelBtn: {
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  titleText: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: "700" as const,
    textAlign: "center" as const,
  },
  saveBtn: {
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  container: { flex: 1 },
  content: { padding: 16 },
  contentInner: {
    width: "100%" as const,
    maxWidth: 720,
    alignSelf: "center" as const,
  },
  saveBtnDisabled: { backgroundColor: colors.disabled },
  section: { marginBottom: 26 },
  formCard: { padding: 16 },
  fieldGroup: { width: "100%" as const },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  settingLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 13,
    minHeight: 54,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 15,
  },
  promptPreview: {
    minHeight: 92,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  promptPreviewIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  promptPreviewText: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  promptPreviewPlaceholder: { color: colors.textMuted },
  modelPicker: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: colors.surfaceLight,
    minHeight: 64,
    gap: 11,
    borderRadius: 13,
    padding: 10,
  },
  pickerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.primarySoft,
  },
  pickerTextContent: { flex: 1 },
  modelPickerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  modelPickerHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 3,
  },
  characterPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  characterText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700" as const,
  },
}));

export default GeminiEdit;

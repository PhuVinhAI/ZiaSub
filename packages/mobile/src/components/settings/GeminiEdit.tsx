import React, { useState, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import type { GeminiConfig } from "@src/types";

// Model IDs
const MODEL_GEMINI_3_6_FLASH = "models/gemini-3.6-flash";
const MODEL_GEMINI_3_5_FLASH = "models/gemini-3.5-flash";
const MODEL_GEMINI_3_5_FLASH_LITE = "models/gemini-3.5-flash-lite";
const MODEL_GEMINI_3_FLASH = "models/gemini-3-flash-preview";
const MODEL_GEMINI_3_1_PRO = "models/gemini-3.1-pro-preview";
const MODEL_GEMINI_3_1_FLASH_LITE = "models/gemini-3.1-flash-lite";
const MODEL_GEMINI_FLASH = "models/gemini-flash-latest";
const MODEL_GEMINI_FLASH_LITE = "models/gemini-flash-lite-latest";

const AVAILABLE_MODELS = [
  { id: MODEL_GEMINI_FLASH, name: "Gemini Flash (Latest)" },
  { id: MODEL_GEMINI_FLASH_LITE, name: "Gemini Flash Lite (Latest)" },
  { id: MODEL_GEMINI_3_6_FLASH, name: "Gemini 3.6 Flash" },
  { id: MODEL_GEMINI_3_5_FLASH, name: "Gemini 3.5 Flash" },
  { id: MODEL_GEMINI_3_5_FLASH_LITE, name: "Gemini 3.5 Flash Lite" },
  { id: MODEL_GEMINI_3_1_FLASH_LITE, name: "Gemini 3.1 Flash Lite" },
  { id: MODEL_GEMINI_3_FLASH, name: "Gemini 3 Flash (Preview)" },
  { id: MODEL_GEMINI_3_1_PRO, name: "Gemini 3.1 Pro (Preview)" },
];

const MEDIA_RESOLUTION_OPTIONS = [
  { id: "MEDIA_RESOLUTION_HIGH", name: "Cao (High)" },
  { id: "MEDIA_RESOLUTION_MEDIUM", name: "Trung bình (Medium)" },
  { id: "MEDIA_RESOLUTION_LOW", name: "Thấp (Low)" },
  { id: "MEDIA_RESOLUTION_UNSPECIFIED", name: "Mặc định" },
];

// Thinking options for Gemini Flash models (MINIMAL, LOW, MEDIUM, HIGH)
const THINKING_LEVEL_OPTIONS_FULL = [
  { id: "HIGH", name: "Cao (High)" },
  { id: "MEDIUM", name: "Trung bình (Medium)" },
  { id: "LOW", name: "Thấp (Low)" },
  { id: "MINIMAL", name: "Tối thiểu (Minimal)" },
];

// Thinking options for Gemini 3 Pro Preview (only LOW, HIGH)
const THINKING_LEVEL_OPTIONS_LIMITED = [
  { id: "HIGH", name: "Cao (High)" },
  { id: "LOW", name: "Thấp (Low)" },
];

// Get thinking config type for a model
type ThinkingConfigMode = "level_full" | "level_limited";

const getThinkingConfigMode = (model: string): ThinkingConfigMode => {
  if (model === MODEL_GEMINI_3_1_PRO) {
    return "level_limited"; // LOW, HIGH only
  }
  return "level_full"; // MINIMAL, LOW, MEDIUM, HIGH
};

// Check if model supports mediaResolution
const supportsMediaResolution = (_model: string): boolean => {
  return true;
};

interface GeminiEditProps {
  config: GeminiConfig;
  onChange: (config: GeminiConfig) => void;
  onSave: () => void;
  onCancel: () => void;
}

const GeminiEdit: React.FC<GeminiEditProps> = ({
  config,
  onChange,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showResolutionPicker, setShowResolutionPicker] = useState(false);
  const [showThinkingPicker, setShowThinkingPicker] = useState(false);
  const styles = useThemedStyles(themedStyles);

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === config.model);
  const modelDisplayName = selectedModel?.name || config.model;

  const selectedResolution = MEDIA_RESOLUTION_OPTIONS.find(
    (r) => r.id === (config.mediaResolution || "MEDIA_RESOLUTION_HIGH")
  );
  const resolutionDisplayName = selectedResolution?.name || "Cao (High)";

  // Get thinking config mode based on selected model
  const thinkingMode = useMemo(
    () => getThinkingConfigMode(config.model),
    [config.model]
  );
  const showMediaResolution = useMemo(
    () => supportsMediaResolution(config.model),
    [config.model]
  );

  // Get appropriate thinking level options based on model
  const thinkingLevelOptions = useMemo(() => {
    if (thinkingMode === "level_limited") return THINKING_LEVEL_OPTIONS_LIMITED;
    return THINKING_LEVEL_OPTIONS_FULL;
  }, [thinkingMode]);

  const selectedThinking = thinkingLevelOptions.find(
    (t) => t.id === (config.thinkingLevel || "HIGH")
  );
  const thinkingDisplayName = selectedThinking?.name || "Cao (High)";

  // Tính toán padding top cho status bar
  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const topPadding = Math.max(insets.top, statusBarHeight);

  return (
    <View
      style={[
        styles.fullScreen,
        { paddingTop: topPadding, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={onCancel}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.editConfig")}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={onSave}>
          <MaterialCommunityIcons
            name="check"
            size={22}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <View style={styles.settingGroup}>
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
        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>
            {t("settings.geminiConfig.model")}
          </Text>
          <TouchableOpacity
            style={styles.modelPicker}
            onPress={() => setShowModelPicker(!showModelPicker)}
          >
            <Text style={styles.modelPickerText}>{modelDisplayName}</Text>
            <MaterialCommunityIcons
              name={showModelPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
          {showModelPicker && (
            <View style={styles.modelDropdown}>
              {AVAILABLE_MODELS.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelOption,
                    config.model === model.id && styles.modelOptionActive,
                  ]}
                  onPress={() => {
                    onChange({ ...config, model: model.id });
                    setShowModelPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modelOptionText,
                      config.model === model.id && styles.modelOptionTextActive,
                    ]}
                  >
                    {model.name}
                  </Text>
                  <Text style={styles.modelOptionId}>{model.id}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>
            {t("settings.geminiConfig.temperature", {
              value: config.temperature.toFixed(1),
            })}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={2}
            step={0.1}
            value={config.temperature}
            onValueChange={(value) =>
              onChange({ ...config, temperature: value })
            }
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>

        {/* Media Resolution - NOT available for Gemini Flash Lite */}
        {showMediaResolution && (
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>
              {t("settings.geminiConfig.mediaResolution")}
            </Text>
            <TouchableOpacity
              style={styles.modelPicker}
              onPress={() => setShowResolutionPicker(!showResolutionPicker)}
            >
              <Text style={styles.modelPickerText}>
                {resolutionDisplayName}
              </Text>
              <MaterialCommunityIcons
                name={showResolutionPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {showResolutionPicker && (
              <View style={styles.modelDropdown}>
                {MEDIA_RESOLUTION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.modelOption,
                      (config.mediaResolution || "MEDIA_RESOLUTION_HIGH") ===
                        option.id && styles.modelOptionActive,
                    ]}
                    onPress={() => {
                      onChange({
                        ...config,
                        mediaResolution: option.id as any,
                      });
                      setShowResolutionPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modelOptionText,
                        (config.mediaResolution || "MEDIA_RESOLUTION_HIGH") ===
                          option.id && styles.modelOptionTextActive,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Thinking Config - level-based for all supported models */}
        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>
            {t("settings.geminiConfig.thinkingLevel")}
          </Text>

          <TouchableOpacity
            style={styles.modelPicker}
            onPress={() => setShowThinkingPicker(!showThinkingPicker)}
          >
            <Text style={styles.modelPickerText}>{thinkingDisplayName}</Text>
            <MaterialCommunityIcons
              name={showThinkingPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
          {showThinkingPicker && (
            <View style={styles.modelDropdown}>
              {thinkingLevelOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.modelOption,
                    (config.thinkingLevel || "HIGH") === option.id &&
                      styles.modelOptionActive,
                  ]}
                  onPress={() => {
                    onChange({
                      ...config,
                      thinkingLevel: option.id as any,
                    });
                    setShowThinkingPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modelOptionText,
                      (config.thinkingLevel || "HIGH") === option.id &&
                        styles.modelOptionTextActive,
                    ]}
                  >
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>
            {t("settings.geminiConfig.systemPrompt")}
          </Text>
          <RNTextInput
            style={styles.promptInput}
            value={config.systemPrompt}
            onChangeText={(text) => onChange({ ...config, systemPrompt: text })}
            placeholder={t("settings.geminiConfig.systemPromptPlaceholder")}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const themedStyles = createThemedStyles((colors) => ({
  fullScreen: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    zIndex: 100,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 8,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "600" as const },
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  settingGroup: { marginBottom: 16 },
  settingLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500" as const,
    marginBottom: 8,
  },
  slider: { width: "100%" as const, height: 40 },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 200,
    maxHeight: 300,
  },
  modelPicker: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modelPickerText: { color: colors.text, fontSize: 14 },
  modelDropdown: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden" as const,
    zIndex: 10,
  },
  modelOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modelOptionActive: { backgroundColor: colors.surfaceElevated },
  modelOptionText: { color: colors.text, fontSize: 14 },
  modelOptionTextActive: { color: colors.primary, fontWeight: "600" as const },
  modelOptionId: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
}));

export { GeminiEdit };
export default GeminiEdit;

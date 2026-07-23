import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
  Platform,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

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

// Thinking options for Gemini 3.1 Pro (LOW, HIGH)
const THINKING_LEVEL_OPTIONS_PRO = [
  { id: "HIGH", name: "Cao (High)" },
  { id: "LOW", name: "Thấp (Low)" },
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const themedSheetStyles = useThemedStyles(sheetThemedStyles);

  const [modalVisible, setModalVisible] = useState(visible);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, slideAnim, fadeAnim]);

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={sheetStyles.modalContainer}>
        <Animated.View
          style={[
            sheetStyles.modalOverlay,
            themedSheetStyles.modalOverlay,
            { opacity: fadeAnim },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            sheetStyles.bottomSheet,
            themedSheetStyles.bottomSheet,
            {
              paddingBottom: Math.max(insets.bottom, 20),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={themedSheetStyles.dragHandle} />
          <View style={themedSheetStyles.sheetHeader}>
            <Text style={themedSheetStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={themedSheetStyles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={sheetStyles.list} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const isActive = option.id === selectedId;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    themedSheetStyles.item,
                    isActive && themedSheetStyles.itemActive,
                  ]}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                >
                  <View style={sheetStyles.itemContent}>
                    <View style={sheetStyles.itemText}>
                      <Text
                        style={[
                          themedSheetStyles.itemName,
                          isActive && themedSheetStyles.itemNameActive,
                        ]}
                      >
                        {option.name}
                      </Text>
                      {option.subText && (
                        <Text style={themedSheetStyles.itemSubText}>
                          {option.subText}
                        </Text>
                      )}
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
        </Animated.View>
      </View>
    </Modal>
  );
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
  const styles = useThemedStyles(themedStyles);

  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showResolutionPicker, setShowResolutionPicker] = useState(false);
  const [showThinkingPicker, setShowThinkingPicker] = useState(false);

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === config.model);
  const modelDisplayName = selectedModel ? selectedModel.name : config.model;

  const is31Pro = config.model === MODEL_GEMINI_3_1_PRO;
  const isFlash35 = config.model === MODEL_GEMINI_3_5_FLASH;

  const isFlashLite =
    config.model === MODEL_GEMINI_3_1_FLASH_LITE ||
    config.model === MODEL_GEMINI_3_5_FLASH_LITE ||
    config.model === MODEL_GEMINI_FLASH_LITE;

  const thinkingLevelOptions = useMemo(() => {
    if (is31Pro) return THINKING_LEVEL_OPTIONS_PRO;
    return THINKING_LEVEL_OPTIONS_FULL;
  }, [is31Pro]);

  const selectedThinking = thinkingLevelOptions.find(
    (o) => o.id === (config.thinkingLevel || "HIGH")
  );
  const thinkingDisplayName = selectedThinking
    ? selectedThinking.name
    : config.thinkingLevel || "HIGH";

  const selectedResolution = MEDIA_RESOLUTION_OPTIONS.find(
    (o) => o.id === (config.mediaResolution || "MEDIA_RESOLUTION_HIGH")
  );
  const resolutionDisplayName = selectedResolution
    ? selectedResolution.name
    : config.mediaResolution || "High";

  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight, 20);

  return (
    <View style={[styles.fullScreen, { paddingTop }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>
          {config.id
            ? t("settings.geminiConfig.editTitle")
            : t("settings.geminiConfig.addTitle")}
        </Text>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveBtnText}>{t("common.save")}</Text>
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
        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>
            {t("settings.geminiConfig.configName")}
          </Text>
          <RNTextInput
            style={styles.input}
            value={config.name}
            onChangeText={(text) => onChange({ ...config, name: text })}
            placeholder={t("settings.geminiConfig.configNamePlaceholder")}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>
            {t("settings.geminiConfig.model")}
          </Text>
          <TouchableOpacity
            style={styles.modelPicker}
            onPress={() => setShowModelPicker(true)}
          >
            <Text style={styles.modelPickerText}>{modelDisplayName}</Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>
            {t("settings.geminiConfig.temperature", {
              value: config.temperature.toFixed(1),
            })}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0.0}
            maximumValue={2.0}
            step={0.1}
            value={config.temperature}
            onSlidingComplete={(value) =>
              onChange({ ...config, temperature: value })
            }
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>

        {!isFlashLite && (
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>
              {t("settings.geminiConfig.mediaResolution")}
            </Text>
            <TouchableOpacity
              style={styles.modelPicker}
              onPress={() => setShowResolutionPicker(true)}
            >
              <Text style={styles.modelPickerText}>
                {resolutionDisplayName}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Thinking Config */}
        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>
            {t("settings.geminiConfig.thinkingLevel")}
          </Text>

          <TouchableOpacity
            style={styles.modelPicker}
            onPress={() => setShowThinkingPicker(true)}
          >
            <Text style={styles.modelPickerText}>{thinkingDisplayName}</Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
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

      {/* Model Picker Bottom Sheet */}
      <SelectBottomSheet
        visible={showModelPicker}
        title={t("settings.geminiConfig.model")}
        options={AVAILABLE_MODELS.map((m) => ({ id: m.id, name: m.name, subText: m.id }))}
        selectedId={config.model}
        onSelect={(modelId) => onChange({ ...config, model: modelId })}
        onClose={() => setShowModelPicker(false)}
      />

      {/* Resolution Picker Bottom Sheet */}
      <SelectBottomSheet
        visible={showResolutionPicker}
        title={t("settings.geminiConfig.mediaResolution")}
        options={MEDIA_RESOLUTION_OPTIONS}
        selectedId={config.mediaResolution || "MEDIA_RESOLUTION_HIGH"}
        onSelect={(resId) => onChange({ ...config, mediaResolution: resId as any })}
        onClose={() => setShowResolutionPicker(false)}
      />

      {/* Thinking Level Picker Bottom Sheet */}
      <SelectBottomSheet
        visible={showThinkingPicker}
        title={t("settings.geminiConfig.thinkingLevel")}
        options={thinkingLevelOptions}
        selectedId={config.thinkingLevel || "HIGH"}
        onSelect={(levelId) => onChange({ ...config, thinkingLevel: levelId as any })}
        onClose={() => setShowThinkingPicker(false)}
      />
    </View>
  );
};

const sheetStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: "100%",
    maxHeight: SHEET_HEIGHT,
  },
  list: { maxHeight: 380 },
  itemContent: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  itemText: { flex: 1 },
});

const sheetThemedStyles = createThemedStyles((colors) => ({
  modalOverlay: {
    backgroundColor: colors.overlay,
  },
  bottomSheet: {
    backgroundColor: colors.surface,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
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
  itemSubText: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
}));

const themedStyles = createThemedStyles((colors) => ({
  fullScreen: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelBtn: { padding: 8 },
  cancelBtnText: { color: colors.textMuted, fontSize: 15 },
  titleText: { color: colors.text, fontSize: 17, fontWeight: "600" as const },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  saveBtnText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  container: { flex: 1 },
  content: { padding: 16 },
  settingGroup: { marginBottom: 20 },
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
}));

export default GeminiEdit;

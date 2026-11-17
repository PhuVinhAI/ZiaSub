import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { ControlSlider, ToggleSettingRow } from "@components/common";
import { DEFAULT_SUBTITLE_SETTINGS } from "@constants/defaults";
import { SUBTITLE_PREVIEW_HTML } from "@constants/subtitleStyleRuntime";
import type {
  SubtitleAnimation,
  SubtitleBackgroundMode,
  SubtitleFontFamily,
  SubtitleHorizontalPosition,
  SubtitleSettings,
  SubtitleShadowStyle,
  SubtitleTextAlign,
  SubtitleWidthMode,
} from "@src/types";
import {
  SettingsCard,
  SettingsSectionHeader,
} from "../SettingsPrimitives";

interface SubtitleSectionProps {
  subtitleSettings: SubtitleSettings;
  onSubtitleChange: (settings: SubtitleSettings) => void;
}

type SettingsIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface Choice<T extends string> {
  value: T;
  label: string;
  icon?: SettingsIcon;
}

interface ChoiceRowProps<T extends string> {
  label?: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}

const COLOR_SWATCHES = [
  "#FFFFFF",
  "#FFF4B8",
  "#FFD54F",
  "#8BE9FD",
  "#50FA7B",
  "#FF79C6",
  "#FF6B6B",
  "#C4B5FD",
  "#000000",
  "#24304A",
  "#6B7280",
  "#7C2D12",
];

const HEX_COLOR_PATTERN = /^#?[0-9a-fA-F]{6}$/;

const normalizeHexColor = (value: string, fallback = "#FFFFFF") => {
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return fallback;
  return `${trimmed.startsWith("#") ? "" : "#"}${trimmed
    .replace("#", "")
    .toUpperCase()}`;
};

const SectionDivider = () => {
  const themedStyles = useThemedStyles(subtitleThemedStyles);
  return <View style={[styles.divider, themedStyles.divider]} />;
};

const ChoiceRow = <T extends string>({
  label,
  choices,
  value,
  onChange,
}: ChoiceRowProps<T>) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(subtitleThemedStyles);

  return (
    <View>
      {label ? <Text style={themedStyles.settingLabel}>{label}</Text> : null}
      <View style={[styles.choiceRow, label ? styles.choiceRowWithLabel : null]}>
        {choices.map((choice) => {
          const active = choice.value === value;
          return (
            <TouchableOpacity
              key={choice.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(choice.value)}
              activeOpacity={0.72}
              style={[
                styles.choiceButton,
                themedStyles.choiceButton,
                active && themedStyles.choiceButtonActive,
              ]}
            >
              {choice.icon ? (
                <MaterialCommunityIcons
                  name={choice.icon}
                  size={18}
                  color={active ? colors.primary : colors.textMuted}
                />
              ) : null}
              <Text
                numberOfLines={1}
                style={[
                  themedStyles.choiceText,
                  active && themedStyles.choiceTextActive,
                ]}
              >
                {choice.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface ColorControlProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorControl: React.FC<ColorControlProps> = ({
  label,
  description,
  value,
  onChange,
}) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(subtitleThemedStyles);
  const [hexInput, setHexInput] = useState(value);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const commitHex = () => {
    const normalized = normalizeHexColor(hexInput, value);
    setHexInput(normalized);
    if (normalized !== value) onChange(normalized);
  };

  return (
    <View>
      <View style={styles.colorHeader}>
        <View style={styles.flex}>
          <Text style={themedStyles.settingLabel}>{label}</Text>
          {description ? (
            <Text style={themedStyles.settingHint}>{description}</Text>
          ) : null}
        </View>
        <View
          style={[
            styles.currentColor,
            { backgroundColor: value, borderColor: colors.border },
          ]}
        />
      </View>
      <View style={styles.swatchGrid}>
        {COLOR_SWATCHES.map((color) => {
          const active = color === value.toUpperCase();
          return (
            <TouchableOpacity
              key={color}
              accessibilityRole="radio"
              accessibilityLabel={color}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(color)}
              activeOpacity={0.78}
              style={[
                styles.swatchButton,
                { backgroundColor: color, borderColor: colors.border },
                active && { borderColor: colors.primary, borderWidth: 3 },
              ]}
            >
              {active ? (
                <MaterialCommunityIcons
                  name="check"
                  size={17}
                  color={color === "#FFFFFF" ? "#111827" : "#FFFFFF"}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={[styles.hexInputRow, themedStyles.hexInputRow]}>
        <MaterialCommunityIcons
          name="eyedropper-variant"
          size={19}
          color={colors.textMuted}
        />
        <TextInput
          value={hexInput}
          onChangeText={setHexInput}
          onBlur={commitHex}
          onSubmitEditing={commitHex}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          placeholder="#FFFFFF"
          placeholderTextColor={colors.textMuted}
          style={themedStyles.hexInput}
        />
      </View>
    </View>
  );
};

const SubtitleSection: React.FC<SubtitleSectionProps> = ({
  subtitleSettings,
  onSubtitleChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(subtitleThemedStyles);
  const [draft, setDraft] = useState(subtitleSettings);
  const [previewPortrait, setPreviewPortrait] = useState(true);
  const previewWebViewRef = useRef<React.ComponentRef<typeof WebView>>(null);

  useEffect(() => {
    setDraft(subtitleSettings);
  }, [subtitleSettings]);

  const updateDraft = <K extends keyof SubtitleSettings>(
    key: K,
    value: SubtitleSettings[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const commitSetting = <K extends keyof SubtitleSettings>(
    key: K,
    value: SubtitleSettings[K]
  ) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onSubtitleChange(next);
  };

  const commitSettings = (next: SubtitleSettings) => {
    setDraft(next);
    onSubtitleChange(next);
  };

  const presets = useMemo(
    () => [
      {
        id: "classic",
        icon: "subtitles-outline" as SettingsIcon,
        name: t("settings.subtitle.presetClassic"),
        description: t("settings.subtitle.presetClassicHint"),
        settings: {},
      },
      {
        id: "cinema",
        icon: "movie-open-outline" as SettingsIcon,
        name: t("settings.subtitle.presetCinema"),
        description: t("settings.subtitle.presetCinemaHint"),
        settings: {
          fontSize: 18,
          fontFamily: "rounded" as SubtitleFontFamily,
          textColor: "#FFF4B8",
          letterSpacing: 0.2,
          lineHeight: 1.45,
          backgroundMode: "always" as SubtitleBackgroundMode,
          backgroundOpacity: 55,
          backgroundPaddingHorizontal: 18,
          backgroundPaddingVertical: 9,
          backgroundRadius: 10,
          outlineWidth: 1.1,
          shadowStyle: "custom" as SubtitleShadowStyle,
          shadowBlur: 6,
          widthMode: "fit" as SubtitleWidthMode,
          maxWidth: 86,
          animation: "fade" as SubtitleAnimation,
          animationDuration: 220,
        },
      },
      {
        id: "minimal",
        icon: "minus-box-outline" as SettingsIcon,
        name: t("settings.subtitle.presetMinimal"),
        description: t("settings.subtitle.presetMinimalHint"),
        settings: {
          fontSize: 14,
          fontWeight: "normal" as const,
          backgroundMode: "none" as SubtitleBackgroundMode,
          outlineEnabled: false,
          shadowEnabled: true,
          shadowStyle: "custom" as SubtitleShadowStyle,
          shadowOpacity: 80,
          shadowBlur: 3,
          widthMode: "fit" as SubtitleWidthMode,
          maxWidth: 82,
          animation: "none" as SubtitleAnimation,
        },
      },
      {
        id: "contrast",
        icon: "contrast-box" as SettingsIcon,
        name: t("settings.subtitle.presetContrast"),
        description: t("settings.subtitle.presetContrastHint"),
        settings: {
          fontSize: 18,
          fontWeight: "bold" as const,
          textColor: "#FFFFFF",
          backgroundMode: "always" as SubtitleBackgroundMode,
          backgroundColor: "#000000",
          backgroundOpacity: 92,
          outlineEnabled: true,
          outlineWidth: 1.5,
          shadowEnabled: false,
          widthMode: "full" as SubtitleWidthMode,
          maxWidth: 94,
          animation: "none" as SubtitleAnimation,
        },
      },
    ],
    [t]
  );

  const applyPreset = (
    settings: Partial<SubtitleSettings>,
    restoreLegacyPosition = false
  ) => {
    commitSettings({
      ...DEFAULT_SUBTITLE_SETTINGS,
      ...(restoreLegacyPosition
        ? {}
        : {
            portraitBottom: draft.portraitBottom,
            landscapeBottom: draft.landscapeBottom,
          }),
      ...settings,
    });
  };

  const isBold = draft.fontWeight === "bold";
  const isItalic = draft.fontStyle === "italic";
  const isUppercase = draft.textTransform === "uppercase";
  const previewMessage = useMemo(
    () =>
      JSON.stringify({
        type: "previewSubtitleStyle",
        settings: draft,
        isPortrait: previewPortrait,
        text: t("settings.subtitle.previewSample"),
      }),
    [draft, previewPortrait, t]
  );

  useEffect(() => {
    previewWebViewRef.current?.postMessage(previewMessage);
  }, [previewMessage]);

  const fontFamilyChoices: Choice<SubtitleFontFamily>[] = [
    { value: "system", label: t("settings.subtitle.fontSystem") },
    { value: "rounded", label: t("settings.subtitle.fontRounded") },
    { value: "serif", label: t("settings.subtitle.fontSerif") },
    { value: "monospace", label: t("settings.subtitle.fontMonospace") },
  ];

  const backgroundChoices: Choice<SubtitleBackgroundMode>[] = [
    {
      value: "none",
      label: t("settings.subtitle.backgroundNone"),
      icon: "close-box-outline",
    },
    {
      value: "portrait",
      label: t("settings.subtitle.backgroundPortrait"),
      icon: "cellphone",
    },
    {
      value: "always",
      label: t("settings.subtitle.backgroundAlways"),
      icon: "checkbox-blank",
    },
  ];

  const horizontalChoices: Choice<SubtitleHorizontalPosition>[] = [
    { value: "left", label: t("settings.subtitle.left"), icon: "arrow-left" },
    {
      value: "center",
      label: t("settings.subtitle.center"),
      icon: "arrow-collapse-horizontal",
    },
    { value: "right", label: t("settings.subtitle.right"), icon: "arrow-right" },
  ];

  const textAlignChoices: Choice<SubtitleTextAlign>[] = [
    {
      value: "left",
      label: t("settings.subtitle.left"),
      icon: "format-align-left",
    },
    {
      value: "center",
      label: t("settings.subtitle.center"),
      icon: "format-align-center",
    },
    {
      value: "right",
      label: t("settings.subtitle.right"),
      icon: "format-align-right",
    },
  ];

  const animationChoices: Choice<SubtitleAnimation>[] = [
    { value: "none", label: t("settings.subtitle.animationNone") },
    { value: "fade", label: t("settings.subtitle.animationFade") },
    { value: "pop", label: t("settings.subtitle.animationPop") },
  ];

  const shadowStyleChoices: Choice<SubtitleShadowStyle>[] = [
    {
      value: "classic",
      label: t("settings.subtitle.shadowClassic"),
      icon: "creation-outline",
    },
    {
      value: "custom",
      label: t("settings.subtitle.shadowCustom"),
      icon: "tune-variant",
    },
  ];

  const widthModeChoices: Choice<SubtitleWidthMode>[] = [
    {
      value: "full",
      label: t("settings.subtitle.widthFull"),
      icon: "arrow-expand-horizontal",
    },
    {
      value: "fit",
      label: t("settings.subtitle.widthFit"),
      icon: "arrow-collapse-horizontal",
    },
  ];

  return (
    <View style={styles.container}>
      <View>
        <SettingsSectionHeader
          icon="monitor-eye"
          title={t("settings.subtitle.previewTitle")}
          description={t("settings.subtitle.previewDescription")}
        />
        <View style={[styles.previewFrame, themedStyles.previewFrame]}>
          <View style={styles.previewTopBar}>
            <View style={styles.previewDots}>
              <View style={[styles.previewDot, { backgroundColor: colors.error }]} />
              <View style={[styles.previewDot, { backgroundColor: colors.warning }]} />
              <View style={[styles.previewDot, { backgroundColor: colors.success }]} />
            </View>
            <View style={styles.previewModeRow}>
              <TouchableOpacity
                onPress={() => setPreviewPortrait(true)}
                style={[
                  styles.previewModeButton,
                  previewPortrait && themedStyles.previewModeButtonActive,
                ]}
              >
                <MaterialCommunityIcons
                  name="cellphone"
                  size={15}
                  color={previewPortrait ? colors.primaryLight : colors.previewText}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPreviewPortrait(false)}
                style={[
                  styles.previewModeButton,
                  !previewPortrait && themedStyles.previewModeButtonActive,
                ]}
              >
                <MaterialCommunityIcons
                  name="monitor"
                  size={15}
                  color={!previewPortrait ? colors.primaryLight : colors.previewText}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={[
              styles.previewVideo,
              previewPortrait ? styles.previewPortrait : styles.previewLandscape,
            ]}
          >
            <WebView
              ref={previewWebViewRef}
              source={{ html: SUBTITLE_PREVIEW_HTML }}
              originWhitelist={["*"]}
              javaScriptEnabled
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              overScrollMode="never"
              bounces={false}
              pointerEvents="none"
              style={styles.previewWebView}
              onLoadEnd={() =>
                previewWebViewRef.current?.postMessage(previewMessage)
              }
            />
          </View>
          <View style={[styles.previewMeta, themedStyles.previewMeta]}>
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={themedStyles.previewMetaText}>
              {t("settings.subtitle.previewHint")}
            </Text>
          </View>
        </View>
      </View>

      <View>
        <SettingsSectionHeader
          icon="auto-fix"
          title={t("settings.subtitle.presetsTitle")}
          description={t("settings.subtitle.presetsDescription")}
        />
        <View style={styles.presetGrid}>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              onPress={() =>
                applyPreset(preset.settings, preset.id === "classic")
              }
              activeOpacity={0.72}
              style={[styles.presetCard, themedStyles.presetCard]}
            >
              <View style={[styles.presetIcon, themedStyles.presetIcon]}>
                <MaterialCommunityIcons
                  name={preset.icon}
                  size={21}
                  color={colors.primary}
                />
              </View>
              <Text style={themedStyles.presetTitle}>{preset.name}</Text>
              <Text style={themedStyles.presetDescription} numberOfLines={2}>
                {preset.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => commitSettings({ ...DEFAULT_SUBTITLE_SETTINGS })}
          activeOpacity={0.72}
          style={[styles.resetButton, themedStyles.resetButton]}
        >
          <MaterialCommunityIcons
            name="restore"
            size={19}
            color={colors.textSecondary}
          />
          <Text style={themedStyles.resetButtonText}>
            {t("settings.subtitle.resetDefault")}
          </Text>
        </TouchableOpacity>
      </View>

      <View>
        <SettingsSectionHeader
          icon="format-font"
          title={t("settings.subtitle.typographyTitle")}
          description={t("settings.subtitle.typographyDescription")}
        />
        <SettingsCard>
          <ControlSlider
            label={t("settings.subtitle.fontSize")}
            icon="format-size"
            minimumValue={10}
            maximumValue={40}
            step={1}
            value={draft.fontSize}
            formatValue={(value) => `${Math.round(value)} px`}
            minimumLabel="10 px"
            maximumLabel="40 px"
            onValueChange={(value) => updateDraft("fontSize", Math.round(value))}
            onSlidingComplete={(value) =>
              commitSetting("fontSize", Math.round(value))
            }
          />
          <SectionDivider />
          <ChoiceRow
            label={t("settings.subtitle.fontFamily")}
            choices={fontFamilyChoices}
            value={draft.fontFamily}
            onChange={(value) => commitSetting("fontFamily", value)}
          />
          <SectionDivider />
          <Text style={themedStyles.settingLabel}>
            {t("settings.subtitle.textStyle")}
          </Text>
          <View style={styles.styleButtonsRow}>
            {[
              {
                active: isBold,
                icon: "format-bold" as SettingsIcon,
                label: t("settings.subtitle.bold"),
                onPress: () =>
                  commitSetting("fontWeight", isBold ? "normal" : "bold"),
              },
              {
                active: isItalic,
                icon: "format-italic" as SettingsIcon,
                label: t("settings.subtitle.italic"),
                onPress: () =>
                  commitSetting("fontStyle", isItalic ? "normal" : "italic"),
              },
              {
                active: isUppercase,
                icon: "format-letter-case-upper" as SettingsIcon,
                label: t("settings.subtitle.uppercase"),
                onPress: () =>
                  commitSetting(
                    "textTransform",
                    isUppercase ? "none" : "uppercase"
                  ),
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                activeOpacity={0.72}
                style={[
                  styles.styleButton,
                  themedStyles.styleButton,
                  item.active && themedStyles.styleButtonActive,
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={21}
                  color={item.active ? colors.primary : colors.textMuted}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    themedStyles.styleButtonText,
                    item.active && themedStyles.styleButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <SectionDivider />
          <ControlSlider
            label={t("settings.subtitle.letterSpacing")}
            description={t("settings.subtitle.letterSpacingHint")}
            icon="format-letter-spacing"
            minimumValue={-1}
            maximumValue={4}
            step={0.1}
            value={draft.letterSpacing}
            formatValue={(value) => `${value.toFixed(1)} px`}
            minimumLabel="-1 px"
            maximumLabel="4 px"
            onValueChange={(value) => updateDraft("letterSpacing", value)}
            onSlidingComplete={(value) => commitSetting("letterSpacing", value)}
          />
          <SectionDivider />
          <ControlSlider
            label={t("settings.subtitle.lineHeight")}
            description={t("settings.subtitle.lineHeightHint")}
            icon="format-line-spacing"
            minimumValue={1}
            maximumValue={2}
            step={0.05}
            value={draft.lineHeight}
            formatValue={(value) => `${value.toFixed(2)}×`}
            minimumLabel="1×"
            maximumLabel="2×"
            onValueChange={(value) => updateDraft("lineHeight", value)}
            onSlidingComplete={(value) => commitSetting("lineHeight", value)}
          />
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="palette-outline"
          title={t("settings.subtitle.textColorTitle")}
          description={t("settings.subtitle.textColorDescription")}
        />
        <SettingsCard>
          <ColorControl
            label={t("settings.subtitle.textColor")}
            description={t("settings.subtitle.customHexHint")}
            value={draft.textColor}
            onChange={(value) => commitSetting("textColor", value)}
          />
          <SectionDivider />
          <ControlSlider
            label={t("settings.subtitle.textOpacity")}
            icon="opacity"
            minimumValue={20}
            maximumValue={100}
            step={5}
            value={draft.textOpacity}
            formatValue={(value) => `${Math.round(value)}%`}
            minimumLabel="20%"
            maximumLabel="100%"
            onValueChange={(value) => updateDraft("textOpacity", value)}
            onSlidingComplete={(value) => commitSetting("textOpacity", value)}
          />
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="checkbox-blank-outline"
          title={t("settings.subtitle.backgroundTitle")}
          description={t("settings.subtitle.backgroundDescription")}
        />
        <SettingsCard>
          <ChoiceRow
            label={t("settings.subtitle.backgroundDisplay")}
            choices={backgroundChoices}
            value={draft.backgroundMode}
            onChange={(value) => commitSetting("backgroundMode", value)}
          />
          {draft.backgroundMode !== "none" ? (
            <>
              <SectionDivider />
              <ColorControl
                label={t("settings.subtitle.backgroundColor")}
                value={draft.backgroundColor}
                onChange={(value) => commitSetting("backgroundColor", value)}
              />
              <SectionDivider />
              <ControlSlider
                label={t("settings.subtitle.backgroundOpacity")}
                icon="opacity"
                minimumValue={0}
                maximumValue={100}
                step={5}
                value={draft.backgroundOpacity}
                formatValue={(value) => `${Math.round(value)}%`}
                minimumLabel="0%"
                maximumLabel="100%"
                onValueChange={(value) => updateDraft("backgroundOpacity", value)}
                onSlidingComplete={(value) =>
                  commitSetting("backgroundOpacity", value)
                }
              />
              <SectionDivider />
              <ControlSlider
                label={t("settings.subtitle.horizontalPadding")}
                icon="arrow-expand-horizontal"
                minimumValue={0}
                maximumValue={32}
                step={1}
                value={draft.backgroundPaddingHorizontal}
                formatValue={(value) => `${Math.round(value)} px`}
                minimumLabel="0 px"
                maximumLabel="32 px"
                onValueChange={(value) =>
                  updateDraft("backgroundPaddingHorizontal", value)
                }
                onSlidingComplete={(value) =>
                  commitSetting("backgroundPaddingHorizontal", value)
                }
              />
              <SectionDivider />
              <ControlSlider
                label={t("settings.subtitle.verticalPadding")}
                icon="arrow-expand-vertical"
                minimumValue={0}
                maximumValue={24}
                step={1}
                value={draft.backgroundPaddingVertical}
                formatValue={(value) => `${Math.round(value)} px`}
                minimumLabel="0 px"
                maximumLabel="24 px"
                onValueChange={(value) =>
                  updateDraft("backgroundPaddingVertical", value)
                }
                onSlidingComplete={(value) =>
                  commitSetting("backgroundPaddingVertical", value)
                }
              />
              <SectionDivider />
              <ControlSlider
                label={t("settings.subtitle.cornerRadius")}
                icon="border-radius"
                minimumValue={0}
                maximumValue={24}
                step={1}
                value={draft.backgroundRadius}
                formatValue={(value) => `${Math.round(value)} px`}
                minimumLabel="0 px"
                maximumLabel="24 px"
                onValueChange={(value) => updateDraft("backgroundRadius", value)}
                onSlidingComplete={(value) =>
                  commitSetting("backgroundRadius", value)
                }
              />
            </>
          ) : null}
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="shield-sun-outline"
          title={t("settings.subtitle.readabilityTitle")}
          description={t("settings.subtitle.readabilityDescription")}
        />
        <SettingsCard>
          <ToggleSettingRow
            value={draft.outlineEnabled}
            onValueChange={(value) => commitSetting("outlineEnabled", value)}
            label={t("settings.subtitle.outline")}
            description={t("settings.subtitle.outlineHint")}
            icon="format-text-variant-outline"
            activeIcon="format-text-variant"
            style={styles.toggleRow}
          />
          {draft.outlineEnabled ? (
            <>
              <SectionDivider />
              <ColorControl
                label={t("settings.subtitle.outlineColor")}
                value={draft.outlineColor}
                onChange={(value) => commitSetting("outlineColor", value)}
              />
              <SectionDivider />
              <ControlSlider
                label={t("settings.subtitle.outlineWidth")}
                icon="border-style"
                minimumValue={0.2}
                maximumValue={4}
                step={0.2}
                value={draft.outlineWidth}
                formatValue={(value) => `${value.toFixed(1)} px`}
                minimumLabel="0.2 px"
                maximumLabel="4 px"
                onValueChange={(value) => updateDraft("outlineWidth", value)}
                onSlidingComplete={(value) =>
                  commitSetting("outlineWidth", value)
                }
              />
            </>
          ) : null}
          <SectionDivider />
          <ToggleSettingRow
            value={draft.shadowEnabled}
            onValueChange={(value) => commitSetting("shadowEnabled", value)}
            label={t("settings.subtitle.shadow")}
            description={t("settings.subtitle.shadowHint")}
            icon="blur-off"
            activeIcon="blur"
            style={styles.toggleRow}
          />
          {draft.shadowEnabled ? (
            <>
              <SectionDivider />
              <ChoiceRow
                label={t("settings.subtitle.shadowStyle")}
                choices={shadowStyleChoices}
                value={draft.shadowStyle}
                onChange={(value) => commitSetting("shadowStyle", value)}
              />
              {draft.shadowStyle === "classic" ? (
                <View style={[styles.classicHint, themedStyles.classicHint]}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={17}
                    color={colors.primary}
                  />
                  <Text style={themedStyles.classicHintText}>
                    {t("settings.subtitle.shadowClassicHint")}
                  </Text>
                </View>
              ) : (
                <>
                  <SectionDivider />
                  <ColorControl
                    label={t("settings.subtitle.shadowColor")}
                    value={draft.shadowColor}
                    onChange={(value) => commitSetting("shadowColor", value)}
                  />
                  <SectionDivider />
                  <ControlSlider
                    label={t("settings.subtitle.shadowOpacity")}
                    icon="opacity"
                    minimumValue={0}
                    maximumValue={100}
                    step={5}
                    value={draft.shadowOpacity}
                    formatValue={(value) => `${Math.round(value)}%`}
                    minimumLabel="0%"
                    maximumLabel="100%"
                    onValueChange={(value) =>
                      updateDraft("shadowOpacity", value)
                    }
                    onSlidingComplete={(value) =>
                      commitSetting("shadowOpacity", value)
                    }
                  />
                  <SectionDivider />
                  <ControlSlider
                    label={t("settings.subtitle.shadowBlur")}
                    icon="blur"
                    minimumValue={0}
                    maximumValue={16}
                    step={1}
                    value={draft.shadowBlur}
                    formatValue={(value) => `${Math.round(value)} px`}
                    minimumLabel="0 px"
                    maximumLabel="16 px"
                    onValueChange={(value) => updateDraft("shadowBlur", value)}
                    onSlidingComplete={(value) =>
                      commitSetting("shadowBlur", value)
                    }
                  />
                  <SectionDivider />
                  <ControlSlider
                    label={t("settings.subtitle.shadowOffsetX")}
                    icon="arrow-left-right"
                    minimumValue={-8}
                    maximumValue={8}
                    step={1}
                    value={draft.shadowOffsetX}
                    formatValue={(value) => `${Math.round(value)} px`}
                    minimumLabel="-8 px"
                    maximumLabel="8 px"
                    onValueChange={(value) =>
                      updateDraft("shadowOffsetX", value)
                    }
                    onSlidingComplete={(value) =>
                      commitSetting("shadowOffsetX", value)
                    }
                  />
                  <SectionDivider />
                  <ControlSlider
                    label={t("settings.subtitle.shadowOffsetY")}
                    icon="arrow-up-down"
                    minimumValue={-8}
                    maximumValue={8}
                    step={1}
                    value={draft.shadowOffsetY}
                    formatValue={(value) => `${Math.round(value)} px`}
                    minimumLabel="-8 px"
                    maximumLabel="8 px"
                    onValueChange={(value) =>
                      updateDraft("shadowOffsetY", value)
                    }
                    onSlidingComplete={(value) =>
                      commitSetting("shadowOffsetY", value)
                    }
                  />
                </>
              )}
            </>
          ) : null}
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="image-filter-center-focus"
          title={t("settings.subtitle.layoutTitle")}
          description={t("settings.subtitle.layoutDescription")}
        />
        <SettingsCard>
          <ChoiceRow
            label={t("settings.subtitle.widthMode")}
            choices={widthModeChoices}
            value={draft.widthMode}
            onChange={(value) => commitSetting("widthMode", value)}
          />
          <SectionDivider />
          <ControlSlider
            label={t("settings.subtitle.maxWidth")}
            description={t("settings.subtitle.maxWidthHint")}
            icon="arrow-expand-horizontal"
            minimumValue={50}
            maximumValue={100}
            step={2}
            value={draft.maxWidth}
            formatValue={(value) => `${Math.round(value)}%`}
            minimumLabel="50%"
            maximumLabel="100%"
            onValueChange={(value) => updateDraft("maxWidth", value)}
            onSlidingComplete={(value) => commitSetting("maxWidth", value)}
          />
          {draft.widthMode === "fit" ? (
            <>
              <SectionDivider />
              <ChoiceRow
                label={t("settings.subtitle.horizontalPosition")}
                choices={horizontalChoices}
                value={draft.horizontalPosition}
                onChange={(value) =>
                  commitSetting("horizontalPosition", value)
                }
              />
            </>
          ) : null}
          <SectionDivider />
          <ChoiceRow
            label={t("settings.subtitle.textAlignment")}
            choices={textAlignChoices}
            value={draft.textAlign}
            onChange={(value) => commitSetting("textAlign", value)}
          />
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="arrow-expand-vertical"
          title={t("settings.subtitle.positionTitle")}
          description={t("settings.subtitle.positionDescription")}
        />
        <SettingsCard>
          <ControlSlider
            label={t("settings.subtitle.portrait")}
            description={t("settings.subtitle.portraitHint")}
            icon="cellphone"
            minimumValue={0}
            maximumValue={500}
            step={10}
            value={draft.portraitBottom}
            formatValue={(value) => `${Math.round(value)} px`}
            minimumLabel="0 px"
            maximumLabel="500 px"
            onValueChange={(value) => updateDraft("portraitBottom", value)}
            onSlidingComplete={(value) => commitSetting("portraitBottom", value)}
          />
          <SectionDivider />
          <ControlSlider
            label={t("settings.subtitle.landscape")}
            description={t("settings.subtitle.landscapeHint")}
            icon="monitor"
            minimumValue={0}
            maximumValue={160}
            step={2}
            value={draft.landscapeBottom}
            formatValue={(value) => `${Math.round(value)} px`}
            minimumLabel="0 px"
            maximumLabel="160 px"
            onValueChange={(value) => updateDraft("landscapeBottom", value)}
            onSlidingComplete={(value) =>
              commitSetting("landscapeBottom", value)
            }
          />
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="transition"
          title={t("settings.subtitle.motionTitle")}
          description={t("settings.subtitle.motionDescription")}
        />
        <SettingsCard>
          <ChoiceRow
            label={t("settings.subtitle.animation")}
            choices={animationChoices}
            value={draft.animation}
            onChange={(value) => commitSetting("animation", value)}
          />
          {draft.animation !== "none" ? (
            <>
              <SectionDivider />
              <ControlSlider
                label={t("settings.subtitle.animationDuration")}
                icon="timer-outline"
                minimumValue={80}
                maximumValue={600}
                step={20}
                value={draft.animationDuration}
                formatValue={(value) => `${Math.round(value)} ms`}
                minimumLabel="80 ms"
                maximumLabel="600 ms"
                onValueChange={(value) => updateDraft("animationDuration", value)}
                onSlidingComplete={(value) =>
                  commitSetting("animationDuration", value)
                }
              />
            </>
          ) : null}
        </SettingsCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 28 },
  flex: { flex: 1 },
  previewFrame: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  previewTopBar: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  previewDots: { flexDirection: "row", gap: 5 },
  previewDot: { width: 7, height: 7, borderRadius: 4 },
  previewModeRow: { flexDirection: "row", gap: 6 },
  previewModeButton: {
    width: 31,
    height: 27,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  previewVideo: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#090B16",
  },
  previewPortrait: { height: 300 },
  previewLandscape: { height: 190 },
  previewWebView: { flex: 1, backgroundColor: "transparent" },
  previewMeta: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  presetCard: {
    width: "48.3%",
    minHeight: 128,
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
  },
  presetIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  resetButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 10,
  },
  divider: { height: 1, marginVertical: 18 },
  choiceRow: { flexDirection: "row", gap: 7 },
  choiceRowWithLabel: { marginTop: 10 },
  choiceButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 7,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  styleButtonsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  styleButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 5,
  },
  colorHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  currentColor: { width: 36, height: 36, borderRadius: 11, borderWidth: 1 },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 13,
  },
  swatchButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hexInputRow: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  classicHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 11,
    padding: 11,
    marginTop: 12,
  },
  toggleRow: { paddingHorizontal: 0, paddingVertical: 0, minHeight: 64 },
});

const subtitleThemedStyles = createThemedStyles((colors) => ({
  previewFrame: {
    backgroundColor: colors.previewBg,
    borderColor: colors.border,
  },
  previewModeButtonActive: { backgroundColor: "rgba(167,139,250,0.24)" },
  previewMeta: { backgroundColor: colors.surface },
  previewMetaText: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  settingLabel: { color: colors.text, fontSize: 14, fontWeight: "700" },
  settingHint: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  divider: { backgroundColor: colors.border },
  presetCard: { backgroundColor: colors.surface, borderColor: colors.border },
  presetIcon: { backgroundColor: colors.primarySoft },
  presetTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  presetDescription: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  resetButton: { backgroundColor: colors.surfaceLight, borderColor: colors.border },
  resetButtonText: { color: colors.textSecondary, fontSize: 13, fontWeight: "700" },
  choiceButton: { backgroundColor: colors.surfaceLight, borderColor: colors.border },
  choiceButtonActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  choiceText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  choiceTextActive: { color: colors.primary, fontWeight: "800" },
  styleButton: { backgroundColor: colors.surfaceLight },
  styleButtonActive: { backgroundColor: colors.primarySoft },
  styleButtonText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  styleButtonTextActive: { color: colors.primary, fontWeight: "800" },
  hexInputRow: { backgroundColor: colors.inputBackground, borderColor: colors.border },
  hexInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
    paddingVertical: 0,
  },
  classicHint: { backgroundColor: colors.primarySoft },
  classicHintText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
}));

export default SubtitleSection;

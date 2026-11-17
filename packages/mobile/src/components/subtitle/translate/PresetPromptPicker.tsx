import React, { useState } from "react";
import { ScrollView, StyleSheet, ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import {
  BottomSheetModal,
  OptionPickerButton,
  SelectionSettingRow,
} from "@components/common";
import { PRESET_PROMPTS, type PresetPromptType } from "@constants/defaults";

const CUSTOM_PRESET_ID = "custom" as PresetPromptType;

interface PresetPromptPickerProps {
  onSelectPreset: (prompt: string, presetId: PresetPromptType) => void;
  currentPresetId?: PresetPromptType;
  style?: ViewStyle;
}

const PresetPromptPicker: React.FC<PresetPromptPickerProps> = ({
  onSelectPreset,
  currentPresetId,
  style,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const currentPreset =
    currentPresetId && currentPresetId !== CUSTOM_PRESET_ID
      ? PRESET_PROMPTS.find((preset) => preset.id === currentPresetId)
      : null;
  const isCustomSelected =
    currentPresetId === CUSTOM_PRESET_ID || !currentPresetId;
  const currentName = currentPreset
    ? t(`settings.presetPrompts.${currentPreset.id}.name`)
    : t("subtitleModal.translate.customPrompt");

  const handleSelect = (preset: (typeof PRESET_PROMPTS)[number]) => {
    onSelectPreset(preset.prompt, preset.id);
    setVisible(false);
  };

  const handleSelectCustom = () => {
    onSelectPreset("", CUSTOM_PRESET_ID);
    setVisible(false);
  };

  return (
    <>
      <OptionPickerButton
        label={t("settings.geminiConfig.presetPrompts")}
        value={currentName}
        description={
          currentPreset
            ? t(`settings.presetPrompts.${currentPreset.id}.description`)
            : t("subtitleModal.translate.customPromptHint")
        }
        icon={(currentPreset?.icon as any) || "text-box-edit-outline"}
        onPress={() => setVisible(true)}
        style={style}
      />

      <BottomSheetModal
        visible={visible}
        onClose={() => setVisible(false)}
        title={t("settings.geminiConfig.selectPreset")}
        maxHeightRatio={0.75}
      >
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <SelectionSettingRow
            label={t("subtitleModal.translate.customPrompt")}
            description={t("subtitleModal.translate.customPromptHint")}
            icon="pencil-outline"
            selected={isCustomSelected}
            onPress={handleSelectCustom}
          />

          {PRESET_PROMPTS.map((preset) => (
            <SelectionSettingRow
              key={preset.id}
              label={t(`settings.presetPrompts.${preset.id}.name`)}
              description={t(
                `settings.presetPrompts.${preset.id}.description`,
              )}
              icon={preset.icon as any}
              selected={
                preset.id === currentPresetId && !isCustomSelected
              }
              onPress={() => handleSelect(preset)}
            />
          ))}
        </ScrollView>
      </BottomSheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  list: { maxHeight: 430 },
  listContent: { gap: 4, paddingBottom: 16 },
});

export default PresetPromptPicker;

import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import {
  BottomSheetModal,
  OptionPickerButton,
  SelectionSettingRow,
} from "@components/common";
import type { GeminiConfig } from "@src/types";

interface ConfigPickerProps {
  configs: GeminiConfig[];
  selectedConfigId: string;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onSelectConfig: (configId: string) => void;
}

const ConfigPicker: React.FC<ConfigPickerProps> = ({
  configs,
  selectedConfigId,
  showDropdown,
  onToggleDropdown,
  onSelectConfig,
}) => {
  const { t } = useTranslation();
  const selectedConfig = configs.find((c) => c.id === selectedConfigId);

  const handleSelect = (configId: string) => {
    onSelectConfig(configId);
    onToggleDropdown();
  };

  return (
    <>
      <OptionPickerButton
        label={t("settings.geminiConfig.selectType")}
        value={
          selectedConfig?.name || t("settings.geminiConfig.selectType")
        }
        description={selectedConfig?.model.replace("models/", "")}
        icon="creation"
        onPress={onToggleDropdown}
        style={sheetStyles.launcher}
      />

      <BottomSheetModal
        visible={showDropdown}
        onClose={onToggleDropdown}
        title={t("settings.geminiConfig.selectType")}
        maxHeightRatio={0.65}
      >
        <ScrollView
          style={sheetStyles.list}
          contentContainerStyle={sheetStyles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {configs.map((config) => {
            const isActive = config.id === selectedConfigId;
            return (
              <SelectionSettingRow
                key={config.id}
                label={config.name}
                description={config.model.replace("models/", "")}
                icon="creation"
                selected={isActive}
                onPress={() => handleSelect(config.id)}
              />
            );
          })}
        </ScrollView>
      </BottomSheetModal>
    </>
  );
};

const sheetStyles = StyleSheet.create({
  launcher: { marginBottom: 10 },
  list: { maxHeight: 380 },
  listContent: { gap: 4, paddingBottom: 12 },
});

export default ConfigPicker;

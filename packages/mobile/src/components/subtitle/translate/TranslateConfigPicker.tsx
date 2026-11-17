import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import {
  BottomSheetModal,
  OptionPickerButton,
  SelectionSettingRow,
} from "@components/common";
import type { GeminiConfig } from "@src/types";

interface TranslateConfigPickerProps {
  configs: GeminiConfig[];
  selectedConfigId: string;
  showPicker: boolean;
  onTogglePicker: () => void;
  onSelectConfig: (configId: string) => void;
}

const TranslateConfigPicker: React.FC<TranslateConfigPickerProps> = ({
  configs,
  selectedConfigId,
  showPicker,
  onTogglePicker,
  onSelectConfig,
}) => {
  const { t } = useTranslation();
  const selectedConfig = configs.find((c) => c.id === selectedConfigId);

  const handleSelect = (configId: string) => {
    onSelectConfig(configId);
    onTogglePicker();
  };

  return (
    <>
      <OptionPickerButton
        label={t("subtitleModal.translate.selectConfig")}
        value={
          selectedConfig?.name || t("subtitleModal.translate.notSelected")
        }
        description={selectedConfig?.model}
        icon="robot-outline"
        onPress={onTogglePicker}
        style={sheetStyles.launcher}
      />

      <BottomSheetModal
        visible={showPicker}
        onClose={onTogglePicker}
        title={t("subtitleModal.translate.selectConfig")}
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
                description={config.model}
                icon="robot-outline"
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

export default TranslateConfigPicker;

import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { BottomSheetModal, SelectionSettingRow } from "@components/common";
import type { GeminiConfig } from "@src/types";

interface ConfigSelectorProps {
  visible: boolean;
  configs: GeminiConfig[];
  activeConfig: GeminiConfig | null;
  onSelect: (config: GeminiConfig) => void;
  onClose: () => void;
}

const ConfigSelector: React.FC<ConfigSelectorProps> = ({
  visible,
  configs,
  activeConfig,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t("chat.selectConfig")}
      subtitle={t("chat.configHint")}
      iconName="tune-variant"
      maxHeightRatio={0.65}
    >
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {configs.map((config) => {
          const isActive = activeConfig?.id === config.id;
          const modelName = config.model.replace("models/", "");
          return (
            <SelectionSettingRow
              key={config.id}
              label={config.name}
              description={modelName}
              icon="creation"
              selected={isActive}
              onPress={() => onSelect(config)}
            />
          );
        })}
      </ScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  list: { maxHeight: 380 },
  listContent: { gap: 4, paddingBottom: 4 },
});

export default ConfigSelector;

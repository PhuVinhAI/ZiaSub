import React from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { BottomSheetModal } from "@components/common";
import type { GeminiConfig } from "@src/types";
import { createQueueStyles } from "./queueStyles";

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
  const { colors } = useTheme();
  const styles = useThemedStyles(() => createQueueStyles(colors));
  const themedSheetStyles = useThemedStyles(sheetThemedStyles);
  const selectedConfig = configs.find((c) => c.id === selectedConfigId);

  const handleSelect = (configId: string) => {
    onSelectConfig(configId);
    onToggleDropdown();
  };

  return (
    <>
      <TouchableOpacity style={styles.configPicker} onPress={onToggleDropdown}>
        <View style={styles.configPickerLeft}>
          <MaterialCommunityIcons
            name="robot"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.configPickerText} numberOfLines={1}>
            {selectedConfig?.name || t("settings.geminiConfig.selectType")}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={showDropdown ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      <BottomSheetModal
        visible={showDropdown}
        onClose={onToggleDropdown}
        title={t("settings.geminiConfig.selectType")}
        maxHeightRatio={0.65}
      >
        <ScrollView style={sheetStyles.list} showsVerticalScrollIndicator={false}>
          {configs.map((config) => {
            const isActive = config.id === selectedConfigId;
            return (
              <TouchableOpacity
                key={config.id}
                style={[
                  themedSheetStyles.item,
                  isActive && themedSheetStyles.itemActive,
                ]}
                onPress={() => handleSelect(config.id)}
              >
                <View style={sheetStyles.itemContent}>
                  <MaterialCommunityIcons
                    name="robot"
                    size={20}
                    color={isActive ? colors.primary : colors.textMuted}
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
                      {config.model}
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

export default ConfigPicker;

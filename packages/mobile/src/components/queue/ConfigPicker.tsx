import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import type { GeminiConfig } from "@src/types";
import { createQueueStyles } from "./queueStyles";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

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
  const insets = useSafeAreaInsets();
  const selectedConfig = configs.find((c) => c.id === selectedConfigId);

  const [modalVisible, setModalVisible] = useState(showDropdown);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showDropdown) {
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
  }, [showDropdown, slideAnim, fadeAnim]);

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

      {modalVisible && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="none"
          onRequestClose={onToggleDropdown}
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
                onPress={onToggleDropdown}
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
                <Text style={themedSheetStyles.title}>
                  {t("settings.geminiConfig.selectType")}
                </Text>
                <TouchableOpacity
                  onPress={onToggleDropdown}
                  style={themedSheetStyles.closeButton}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={sheetStyles.list}
                showsVerticalScrollIndicator={false}
              >
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
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
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
  itemModel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
}));

export default ConfigPicker;

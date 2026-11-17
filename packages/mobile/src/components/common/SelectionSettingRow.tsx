import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";

type SelectionIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface SelectionSettingRowProps {
  label: string;
  description?: string;
  warning?: string;
  selected: boolean;
  onPress: () => void;
  icon?: SelectionIcon;
  divider?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SelectionSettingRow: React.FC<SelectionSettingRowProps> = ({
  label,
  description,
  warning,
  selected,
  onPress,
  icon,
  divider = false,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(selectionThemedStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.row,
        selected && themedStyles.selectedRow,
        divider && themedStyles.divider,
        pressed && !disabled && themedStyles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconBox,
            themedStyles.iconBox,
            selected && themedStyles.selectedIconBox,
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={selected ? colors.primary : colors.textMuted}
          />
        </View>
      ) : null}
      <View style={styles.textContent}>
        <Text
          style={[
            themedStyles.label,
            selected && themedStyles.selectedLabel,
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text style={themedStyles.description}>{description}</Text>
        ) : null}
        {warning ? (
          <View style={[styles.warningBadge, themedStyles.warningBadge]}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={13}
              color={colors.warning}
            />
            <Text style={[styles.warningText, themedStyles.warningText]}>
              {warning}
            </Text>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.checkBox,
          themedStyles.checkBox,
          selected && themedStyles.selectedCheckBox,
        ]}
      >
        {selected ? (
          <MaterialCommunityIcons
            name="check"
            size={17}
            color={colors.onPrimary}
          />
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 13,
  },
  disabled: { opacity: 0.5 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: { flex: 1 },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  warningText: { flexShrink: 1, fontSize: 11, lineHeight: 15, fontWeight: "600" },
  checkBox: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

const selectionThemedStyles = createThemedStyles((colors) => ({
  selectedRow: { backgroundColor: colors.primarySoft },
  pressed: { backgroundColor: colors.surfaceLight },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconBox: { backgroundColor: colors.surfaceLight },
  selectedIconBox: { backgroundColor: colors.surface },
  label: { color: colors.text, fontSize: 15, fontWeight: "600" },
  selectedLabel: { color: colors.primary, fontWeight: "800" },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  warningBadge: { backgroundColor: colors.warningBg },
  warningText: { color: colors.warning },
  checkBox: { borderColor: colors.border },
  selectedCheckBox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
}));

export default SelectionSettingRow;

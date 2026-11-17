import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Switch,
  View,
  ViewStyle,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";

export type ToggleSettingIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface ToggleSettingRowProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  description?: string;
  icon?: ToggleSettingIcon;
  activeIcon?: ToggleSettingIcon;
  activeColor?: string;
  activeBackgroundColor?: string;
  disabled?: boolean;
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
}

const ToggleSettingRow: React.FC<ToggleSettingRowProps> = ({
  value,
  onValueChange,
  label,
  description,
  icon = "toggle-switch-off-outline",
  activeIcon,
  activeColor,
  activeBackgroundColor,
  disabled = false,
  divider = false,
  style,
}) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(toggleThemedStyles);
  const color = activeColor || colors.primary;

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      style={({ pressed }) => [
        styles.row,
        divider && themedStyles.divider,
        pressed && !disabled && themedStyles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          themedStyles.iconBox,
          value && {
            backgroundColor: activeBackgroundColor || colors.primarySoft,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={value && activeIcon ? activeIcon : icon}
          size={22}
          color={value ? color : colors.textMuted}
        />
      </View>
      <View style={styles.textContent}>
        <Text style={themedStyles.label}>{label}</Text>
        {description ? (
          <Text style={themedStyles.description}>{description}</Text>
        ) : null}
      </View>
      <View pointerEvents="none" style={styles.switchBox}>
        <Switch
          value={value}
          disabled={disabled}
          trackColor={{ false: colors.border, true: color }}
          thumbColor={value ? colors.onPrimary : colors.surfaceElevated}
          ios_backgroundColor={colors.border}
          style={styles.switch}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  disabled: { opacity: 0.5 },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: { flex: 1, paddingVertical: 2 },
  switchBox: {
    width: 58,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  switch: { transform: [{ scaleX: 1.12 }, { scaleY: 1.12 }] },
});

const toggleThemedStyles = createThemedStyles((colors) => ({
  iconBox: { backgroundColor: colors.surfaceLight },
  label: { color: colors.text, fontSize: 15, fontWeight: "700" },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  pressed: { backgroundColor: colors.surfaceLight },
}));

export default ToggleSettingRow;

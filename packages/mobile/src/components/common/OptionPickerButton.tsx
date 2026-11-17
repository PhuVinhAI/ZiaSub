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
import { createThemedStyles, useThemedStyles } from "@hooks/useThemedStyles";

type OptionIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface OptionPickerButtonProps {
  label: string;
  value: string;
  description?: string;
  icon: OptionIcon;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const OptionPickerButton: React.FC<OptionPickerButtonProps> = ({
  label,
  value,
  description,
  icon,
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(optionThemedStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={value}
      style={({ pressed }) => [
        styles.button,
        themedStyles.button,
        pressed && themedStyles.pressed,
        style,
      ]}
    >
      <View style={themedStyles.iconBox}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.textGroup}>
        <Text style={themedStyles.label}>{label}</Text>
        <Text style={themedStyles.value} numberOfLines={1}>
          {value}
        </Text>
        {description ? (
          <Text style={themedStyles.description} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textMuted}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  textGroup: { flex: 1, minWidth: 0 },
});

const optionThemedStyles = createThemedStyles((colors) => ({
  button: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceElevated },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  description: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
}));

export default OptionPickerButton;

import React, { useEffect, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";

export type ControlSliderIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface ControlSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  label?: string;
  description?: string;
  icon?: ControlSliderIcon;
  valueLabel?: string;
  formatValue?: (value: number) => string;
  minimumLabel?: string;
  maximumLabel?: string;
  accentColor?: string;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
  onSlidingComplete: (value: number) => void;
  style?: StyleProp<ViewStyle>;
}

const ControlSlider: React.FC<ControlSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  step,
  label,
  description,
  icon,
  valueLabel,
  formatValue,
  minimumLabel,
  maximumLabel,
  accentColor,
  disabled = false,
  onValueChange,
  onSlidingComplete,
  style,
}) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(controlSliderThemedStyles);
  const [liveValue, setLiveValue] = useState(value);
  const activeColor = accentColor || colors.primary;

  useEffect(() => {
    setLiveValue(value);
  }, [value]);

  const displayValue =
    valueLabel ?? (formatValue ? formatValue(liveValue) : String(liveValue));

  const handleValueChange = (nextValue: number) => {
    setLiveValue(nextValue);
    onValueChange?.(nextValue);
  };

  const handleSlidingComplete = (nextValue: number) => {
    setLiveValue(nextValue);
    onSlidingComplete(nextValue);
  };

  return (
    <View style={[styles.container, disabled && styles.disabled, style]}>
      {(label || valueLabel || formatValue) && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {icon ? (
              <View style={[styles.iconBox, themedStyles.iconBox]}>
                <MaterialCommunityIcons
                  name={icon}
                  size={19}
                  color={disabled ? colors.disabledText : activeColor}
                />
              </View>
            ) : null}
            <View style={styles.titleText}>
              {label ? (
                <Text style={themedStyles.label}>{label}</Text>
              ) : null}
              {description ? (
                <Text style={themedStyles.description}>{description}</Text>
              ) : null}
            </View>
          </View>
          <View
            style={[
              styles.valuePill,
              themedStyles.valuePill,
            ]}
          >
            <Text style={[themedStyles.valueText, { color: activeColor }]}>
              {displayValue}
            </Text>
          </View>
        </View>
      )}

      {!label && description ? (
        <Text style={themedStyles.description}>{description}</Text>
      ) : null}

      <View style={styles.sliderTouchArea}>
        <Slider
          style={styles.slider}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          value={liveValue}
          disabled={disabled}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
          minimumTrackTintColor={disabled ? colors.disabledText : activeColor}
          maximumTrackTintColor={disabled ? colors.disabled : colors.border}
          thumbTintColor={disabled ? colors.disabledText : activeColor}
          accessibilityLabel={label}
          accessibilityValue={{
            min: minimumValue,
            max: maximumValue,
            now: liveValue,
            text: displayValue,
          }}
        />
      </View>

      {minimumLabel || maximumLabel ? (
        <View style={styles.rangeRow}>
          <Text style={themedStyles.rangeText}>{minimumLabel}</Text>
          <Text style={themedStyles.rangeText}>{maximumLabel}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%" },
  disabled: { opacity: 0.55 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleText: { flex: 1 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  valuePill: {
    minWidth: 58,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 11,
  },
  sliderTouchArea: {
    height: 54,
    justifyContent: "center",
    marginHorizontal: -3,
  },
  slider: {
    width: "90%",
    height: 54,
    alignSelf: "center",
    transform: [{ scaleX: 1.1 }, { scaleY: 1.2 }],
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -5,
    paddingHorizontal: 3,
  },
});

const controlSliderThemedStyles = createThemedStyles((colors) => ({
  iconBox: { backgroundColor: colors.primarySoft },
  label: { color: colors.text, fontSize: 14, fontWeight: "700" },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  valuePill: { backgroundColor: colors.surfaceLight },
  valueText: { fontSize: 12, fontWeight: "800" },
  rangeText: { color: colors.textMuted, fontSize: 11, fontWeight: "500" },
}));

export default ControlSlider;

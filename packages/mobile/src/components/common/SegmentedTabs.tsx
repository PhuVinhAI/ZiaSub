import React from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";

type TabIcon = keyof typeof MaterialCommunityIcons.glyphMap;
type BadgeTone = "primary" | "success" | "warning" | "error" | "muted";

export interface SegmentedTabItem<T extends string> {
  key: T;
  label: string;
  icon?: TabIcon;
  badge?: string | number;
  badgeTone?: BadgeTone;
  accessibilityLabel?: string;
}

interface SegmentedTabsProps<T extends string> {
  items: readonly SegmentedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
  equalWidth?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SegmentedTabs = <T extends string>({
  items,
  value,
  onChange,
  scrollable = false,
  equalWidth = true,
  compact = false,
  style,
}: SegmentedTabsProps<T>) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(segmentedThemedStyles);

  const getBadgeColor = (tone: BadgeTone = "primary") => {
    switch (tone) {
      case "success":
        return colors.success;
      case "warning":
        return colors.warning;
      case "error":
        return colors.error;
      case "muted":
        return colors.textMuted;
      default:
        return colors.primary;
    }
  };

  const content = items.map((item) => {
    const selected = item.key === value;
    const badgeVisible = item.badge !== undefined && item.badge !== null;
    const badgeColor = getBadgeColor(item.badgeTone);

    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.tab,
          equalWidth && styles.equalTab,
          compact && styles.compactTab,
          !equalWidth && styles.contentTab,
          selected && themedStyles.activeTab,
        ]}
        onPress={() => onChange(item.key)}
        activeOpacity={0.72}
        accessibilityRole="tab"
        accessibilityLabel={item.accessibilityLabel || item.label}
        accessibilityState={{ selected }}
      >
        {item.icon ? (
          <MaterialCommunityIcons
            name={item.icon}
            size={compact ? 17 : 19}
            color={selected ? colors.primary : colors.textMuted}
          />
        ) : null}
        <Text
          style={[
            themedStyles.tabText,
            selected && themedStyles.activeTabText,
          ]}
          numberOfLines={compact ? 1 : 2}
        >
          {item.label}
        </Text>
        {badgeVisible ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: selected ? badgeColor : colors.surfaceElevated,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: selected ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              {item.badge}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.scroll, style]}
        contentContainerStyle={[styles.container, themedStyles.container]}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, themedStyles.container, style]}>{content}</View>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  container: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 15,
    borderWidth: 1,
  },
  tab: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  equalTab: { flex: 1 },
  contentTab: { minWidth: 108 },
  compactTab: { minHeight: 44, paddingVertical: 8, paddingHorizontal: 11 },
  badge: {
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
});

const segmentedThemedStyles = createThemedStyles((colors) => ({
  container: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  activeTab: {
    backgroundColor: colors.surface,
  },
  tabText: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  activeTabText: { color: colors.primary, fontWeight: "800" },
}));

export default SegmentedTabs;

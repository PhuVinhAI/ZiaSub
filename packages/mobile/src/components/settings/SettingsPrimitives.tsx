import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";

export type SettingsGlyph = keyof typeof MaterialCommunityIcons.glyphMap;

interface SettingsPageIntroProps {
  icon: SettingsGlyph;
  title: string;
  description: string;
}

export const SettingsPageIntro: React.FC<SettingsPageIntroProps> = ({
  icon,
  title,
  description,
}) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(primitiveThemedStyles);

  return (
    <View style={[styles.intro, themedStyles.intro]}>
      <View style={[styles.introIcon, themedStyles.introIcon]}>
        <MaterialCommunityIcons name={icon} size={25} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={themedStyles.introTitle}>{title}</Text>
        <Text style={themedStyles.introDescription}>{description}</Text>
      </View>
    </View>
  );
};

interface SettingsSectionHeaderProps {
  icon?: SettingsGlyph;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  tone?: "default" | "danger";
}

export const SettingsSectionHeader: React.FC<SettingsSectionHeaderProps> = ({
  icon,
  title,
  description,
  trailing,
  tone = "default",
}) => {
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(primitiveThemedStyles);

  return (
    <View style={styles.sectionHeader}>
      {icon && (
        <View
          style={[
            styles.sectionIcon,
            themedStyles.sectionIcon,
            tone === "danger" && { backgroundColor: colors.errorBg },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={tone === "danger" ? colors.error : colors.primary}
          />
        </View>
      )}
      <View style={styles.flex}>
        <Text
          style={[
            themedStyles.sectionTitle,
            tone === "danger" && { color: colors.error },
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text style={themedStyles.sectionDescription}>{description}</Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
};

interface SettingsCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  children,
  style,
}) => {
  const themedStyles = useThemedStyles(primitiveThemedStyles);
  return <View style={[themedStyles.card, style]}>{children}</View>;
};

export const SettingsValuePill: React.FC<{ value: string }> = ({ value }) => {
  const themedStyles = useThemedStyles(primitiveThemedStyles);
  return (
    <View style={themedStyles.valuePill}>
      <Text style={themedStyles.valuePillText}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});

const primitiveThemedStyles = createThemedStyles((colors) => ({
  intro: {
    backgroundColor: colors.primarySoft,
  },
  introIcon: { backgroundColor: colors.surface },
  introTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  introDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  sectionIcon: { backgroundColor: colors.primarySoft },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  sectionDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  valuePill: {
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  valuePillText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
}));

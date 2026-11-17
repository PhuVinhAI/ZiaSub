import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { SelectionSettingRow } from "@components/common";
import {
  SettingsCard,
  SettingsSectionHeader,
} from "../SettingsPrimitives";

const ThemeSection: React.FC = () => {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();

  const themes = [
    { mode: "system", labelKey: "settings.theme.system", icon: "cellphone" },
    {
      mode: "light",
      labelKey: "settings.theme.light",
      icon: "white-balance-sunny",
    },
    {
      mode: "dark",
      labelKey: "settings.theme.dark",
      icon: "moon-waning-crescent",
    },
  ] as const;

  return (
    <View style={styles.section}>
      <SettingsSectionHeader
        icon="theme-light-dark"
        title={t("settings.theme.title")}
        description={t("settings.theme.description")}
      />
      <SettingsCard style={styles.cardPadding}>
        {themes.map((theme) => (
          <SelectionSettingRow
            key={theme.mode}
            label={t(theme.labelKey)}
            icon={theme.icon}
            selected={themeMode === theme.mode}
            onPress={() => setThemeMode(theme.mode)}
          />
        ))}
      </SettingsCard>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  cardPadding: { padding: 6, gap: 3 },
});

export default ThemeSection;

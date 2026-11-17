import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@hooks/useLanguage";
import { SelectionSettingRow } from "@components/common";
import {
  SettingsCard,
  SettingsSectionHeader,
} from "../SettingsPrimitives";

const LanguageSection: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();

  return (
    <View style={styles.section}>
      <SettingsSectionHeader
        icon="translate"
        title={t("settings.language")}
        description={t("settings.languageDescription")}
      />
      <SettingsCard style={styles.cardPadding}>
        {supportedLanguages.map((lang) => (
          <SelectionSettingRow
            key={lang.code}
            label={lang.nativeName}
            icon="web"
            selected={currentLanguage === lang.code}
            onPress={() => setLanguage(lang.code)}
          />
        ))}
      </SettingsCard>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 0 },
  cardPadding: { padding: 6, gap: 3 },
});

export default LanguageSection;

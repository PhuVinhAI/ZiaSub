import React, { useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { updateService } from "@services/updateService";
import UpdateSection from "./UpdateSection";

type SupportIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
  icon: SupportIcon;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "ad_warning",
    questionKey: "faq.adWarning.question",
    answerKey: "faq.adWarning.answer",
    icon: "advertisements-off",
  },
  {
    id: "video_error",
    questionKey: "faq.videoError.question",
    answerKey: "faq.videoError.answer",
    icon: "alert-circle-outline",
  },
  {
    id: "how_translate",
    questionKey: "faq.howTranslate.question",
    answerKey: "faq.howTranslate.answer",
    icon: "translate",
  },
  {
    id: "api_key",
    questionKey: "faq.apiKey.question",
    answerKey: "faq.apiKey.answer",
    icon: "key-outline",
  },
  {
    id: "queue",
    questionKey: "faq.queue.question",
    answerKey: "faq.queue.answer",
    icon: "playlist-play",
  },
  {
    id: "subtitle_position",
    questionKey: "faq.subtitlePosition.question",
    answerKey: "faq.subtitlePosition.answer",
    icon: "subtitles-outline",
  },
];

const APP_NAME = "ZiaSub";
const AUTHOR = "TomiSakae";
const GITHUB_URL = "https://github.com/PhuVinhAI/ZiaSub";
const FACEBOOK_URL = "https://www.facebook.com/TomiSakaeAnime/";
const ZALO_URL = "https://zalo.me/0762605309";

const SupportSection: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(supportThemedStyles);
  const [expandedId, setExpandedId] = useState<string | null>("ad_warning");

  const openUrl = async (url: string) => {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Cannot open support URL:", error);
    }
  };

  const renderSectionTitle = (
    icon: SupportIcon,
    title: string,
    description: string
  ) => (
    <View style={staticStyles.sectionHeading}>
      <View style={[staticStyles.headingIcon, themedStyles.headingIcon]}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={staticStyles.flex}>
        <Text style={themedStyles.sectionTitle}>{title}</Text>
        <Text style={themedStyles.sectionDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <View style={staticStyles.container}>
      <View style={staticStyles.section}>
        {renderSectionTitle(
          "update",
          t("update.title"),
          t("settings.support.updateDescription")
        )}
        <View style={[staticStyles.card, themedStyles.card]}>
          <UpdateSection />
        </View>
      </View>

      <View style={staticStyles.section}>
        {renderSectionTitle(
          "frequently-asked-questions",
          t("faq.title"),
          t("settings.support.faqDescription")
        )}
        <View style={staticStyles.faqList}>
          {FAQ_ITEMS.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={[staticStyles.faqItem, themedStyles.card]}>
                <Pressable
                  onPress={() => setExpandedId(isExpanded ? null : item.id)}
                  style={staticStyles.questionRow}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <View
                    style={[
                      staticStyles.faqIcon,
                      isExpanded
                        ? themedStyles.faqIconActive
                        : themedStyles.faqIcon,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={19}
                      color={isExpanded ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <Text
                    style={[
                      themedStyles.questionText,
                      isExpanded && themedStyles.questionTextActive,
                    ]}
                  >
                    {t(item.questionKey)}
                  </Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={21}
                    color={isExpanded ? colors.primary : colors.textMuted}
                  />
                </Pressable>
                {isExpanded && (
                  <View style={[staticStyles.answer, themedStyles.answer]}>
                    <Text style={themedStyles.answerText}>
                      {t(item.answerKey)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={staticStyles.section}>
        {renderSectionTitle(
          "information-outline",
          t("faq.aboutApp"),
          t("settings.support.aboutDescription")
        )}
        <View style={[staticStyles.card, themedStyles.card]}>
          <View style={staticStyles.appHero}>
            <View style={[staticStyles.appIcon, themedStyles.appIcon]}>
              <MaterialCommunityIcons
                name="translate"
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={staticStyles.flex}>
              <Text style={themedStyles.appName}>{APP_NAME}</Text>
              <Text style={themedStyles.appDescription}>
                {t("settings.support.appTagline")}
              </Text>
            </View>
          </View>

          <View style={[staticStyles.infoRows, themedStyles.infoRows]}>
            <View style={staticStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>{t("faq.version")}</Text>
              <Text style={themedStyles.infoValue}>
                v{updateService.getCurrentVersion()}
              </Text>
            </View>
            <View style={staticStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>{t("faq.author")}</Text>
              <Text style={themedStyles.infoValue}>{AUTHOR}</Text>
            </View>
          </View>

          <Text style={themedStyles.contactLabel}>{t("faq.contact")}</Text>
          <View style={staticStyles.socialRow}>
            <TouchableOpacity
              style={[staticStyles.socialButton, themedStyles.socialButton]}
              onPress={() => openUrl(GITHUB_URL)}
            >
              <MaterialCommunityIcons
                name="github"
                size={20}
                color={colors.text}
              />
              <Text style={themedStyles.socialText}>GitHub</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[staticStyles.socialButton, themedStyles.socialButton]}
              onPress={() => openUrl(FACEBOOK_URL)}
            >
              <MaterialCommunityIcons
                name="facebook"
                size={20}
                color={colors.primary}
              />
              <Text style={themedStyles.socialText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[staticStyles.socialButton, themedStyles.socialButton]}
              onPress={() => openUrl(ZALO_URL)}
            >
              <MaterialCommunityIcons
                name="message-text-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={themedStyles.socialText}>Zalo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const staticStyles = StyleSheet.create({
  container: { gap: 26 },
  section: { gap: 12 },
  flex: { flex: 1 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headingIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  faqList: { gap: 10 },
  faqItem: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  questionRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  faqIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  answer: {
    marginLeft: 60,
    marginRight: 14,
    paddingTop: 12,
    paddingBottom: 15,
    borderTopWidth: 1,
  },
  appHero: { flexDirection: "row", alignItems: "center", gap: 14 },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRows: {
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  socialRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

const supportThemedStyles = createThemedStyles((colors) => ({
  headingIcon: { backgroundColor: colors.primarySoft },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  sectionDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  card: { backgroundColor: colors.surface, borderColor: colors.border },
  faqIcon: { backgroundColor: colors.surfaceLight },
  faqIconActive: { backgroundColor: colors.primarySoft },
  questionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
  },
  questionTextActive: { color: colors.primary, fontWeight: "600" },
  answer: { borderTopColor: colors.border },
  answerText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  appIcon: { backgroundColor: colors.primarySoft },
  appName: { color: colors.text, fontSize: 19, fontWeight: "700" },
  appDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  infoRows: { borderColor: colors.border },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  contactLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  socialButton: { backgroundColor: colors.surfaceLight },
  socialText: { color: colors.text, fontSize: 12, fontWeight: "600" },
}));

export default SupportSection;

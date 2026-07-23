import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Pressable,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { BottomSheetModal } from "./BottomSheetModal";

interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
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

const GITHUB_URL = "https://github.com/PhuVinhAI/ZiaSub";
const FACEBOOK_URL = "https://www.facebook.com/TomiSakaeAnime/";
const ZALO_URL = "https://zalo.me/0762605309";
const AUTHOR = "TomiSakae";

interface FAQModalProps {
  visible: boolean;
  onClose: () => void;
}

const FAQModal: React.FC<FAQModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>("ad_warning");
  const styles = useThemedStyles(faqThemedStyles);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenGithub = () => {
    Linking.openURL(GITHUB_URL);
  };

  const handleOpenFacebook = () => {
    Linking.openURL(FACEBOOK_URL);
  };

  const handleOpenZalo = () => {
    Linking.openURL(ZALO_URL);
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t("faq.title")}
      iconName="help-circle"
      fixedHeight={true}
      heightRatio={0.8}
    >
      <ScrollView
        style={staticStyles.scrollView}
        contentContainerStyle={staticStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {FAQ_ITEMS.map((item) => (
          <View key={item.id} style={[staticStyles.faqItem, styles.faqItem]}>
            <Pressable
              onPress={() => toggleExpand(item.id)}
              style={staticStyles.questionRow}
            >
              <View style={staticStyles.questionLeft}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={
                    expandedId === item.id ? colors.primary : colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.questionText,
                    expandedId === item.id && styles.questionActive,
                  ]}
                >
                  {t(item.questionKey)}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={expandedId === item.id ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
            {expandedId === item.id && (
              <View
                style={[staticStyles.answerContainer, styles.answerContainer]}
              >
                <Text style={styles.answerText}>{t(item.answerKey)}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Author & Social Links */}
        <View style={[staticStyles.aboutSection, styles.aboutSection]}>
          <View style={staticStyles.aboutRow}>
            <MaterialCommunityIcons
              name="account"
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.aboutLabel}>{t("faq.madeBy")}</Text>
            <Text style={styles.aboutValue}>{AUTHOR}</Text>
          </View>
          <View style={staticStyles.socialRow}>
            <TouchableOpacity
              style={staticStyles.socialBtn}
              onPress={handleOpenGithub}
            >
              <MaterialCommunityIcons
                name="github"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.socialText}>GitHub</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={staticStyles.socialBtn}
              onPress={handleOpenFacebook}
            >
              <MaterialCommunityIcons
                name="facebook"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={staticStyles.socialBtn}
              onPress={handleOpenZalo}
            >
              <MaterialCommunityIcons
                name="chat"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.socialText}>Zalo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
};

const staticStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  faqItem: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  questionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  answerContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 12,
    marginHorizontal: 14,
    marginLeft: 46,
    borderTopWidth: 1,
  },
  aboutSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});

const faqThemedStyles = createThemedStyles((colors) => ({
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  faqItem: {
    backgroundColor: colors.surfaceLight,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  questionActive: {
    color: colors.primary,
  },
  answerContainer: {
    borderTopColor: colors.border,
  },
  answerText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  aboutSection: {
    borderTopColor: colors.border,
  },
  aboutLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  socialText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
}));

export default FAQModal;

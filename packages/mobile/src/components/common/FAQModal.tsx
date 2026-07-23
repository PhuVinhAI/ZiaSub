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
  questionVi: string;
  questionEn: string;
  answerVi: string;
  answerEn: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "gemini-key",
    questionVi: "Làm sao để lấy Gemini API Key?",
    questionEn: "How to get a Gemini API Key?",
    answerVi:
      "Bạn truy cập Google AI Studio (aistudio.google.com), đăng nhập tài khoản Google và bấm 'Create API key'. Copy key dán vào Cài đặt -> Quản lý Key trong ứng dụng.",
    answerEn:
      "Go to Google AI Studio (aistudio.google.com), sign in with Google account and click 'Create API key'. Copy and paste the key into Settings -> Key Management.",
  },
  {
    id: "batch-translation",
    questionVi: "Tính năng Dịch đợt (Batch) hoạt động thế nào?",
    questionEn: "How does Batch Translation work?",
    answerVi:
      "Dịch đợt chia video dài thành các đợt nhỏ (mặc định 10-20 phút), dịch song song để tăng tốc độ và tránh quá tải context của model AI. Bạn có thể chỉnh thời lượng đợt trong Cài đặt.",
    answerEn:
      "Batch translation splits long videos into smaller chunks (default 10-20 mins), translating in parallel for faster speed and preventing AI model context limit. Adjustable in Settings.",
  },
  {
    id: "supported-formats",
    questionVi: "Ứng dụng hỗ trợ những định dạng phụ đề nào?",
    questionEn: "What subtitle formats are supported?",
    answerVi:
      "Hiện tại hỗ trợ file SRT, VTT, ASS/SSA. Bạn có thể xuất kết quả ra file SRT hoặc VTT.",
    answerEn:
      "Currently supports SRT, VTT, ASS/SSA files. You can export results to SRT or VTT files.",
  },
  {
    id: "multiple-keys",
    questionVi: "Tại sao nên thêm nhiều API Key?",
    questionEn: "Why add multiple API Keys?",
    answerVi:
      "Google Gemini có giới hạn request/phút (Rate Limit). Thêm nhiều Key giúp ứng dụng tự động xoay vòng (round-robin), tránh bị gián đoạn khi dịch file lớn.",
    answerEn:
      "Google Gemini has rate limits per minute. Adding multiple keys enables automatic round-robin rotation, preventing interruptions when translating large files.",
  },
  {
    id: "pre-sub",
    questionVi: "Phụ đề gốc (Pre-sub) là gì?",
    questionEn: "What is Original Subtitle (Pre-sub)?",
    answerVi:
      "Nếu video chỉ có âm thanh (chưa có phụ đề), tính năng Pre-sub sẽ dùng Gemini để tạo phụ đề bằng ngôn ngữ gốc trước, sau đó mới dịch sang ngôn ngữ đích.",
    answerEn:
      "If the video only has audio (no subtitles), Pre-sub uses Gemini to generate original-language subtitles first, then translates to the target language.",
  },
];

const GITHUB_URL = "https://github.com/PhuVinhAI/ZiaSub";
const FACEBOOK_URL = "https://facebook.com";
const ZALO_URL = "https://zalo.me";

interface FAQModalProps {
  visible: boolean;
  onClose: () => void;
}

const FAQModal: React.FC<FAQModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>("gemini-key");
  const isVi = i18n.language === "vi";
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
      maxHeightRatio={0.8}
      fixedHeight={true}
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
              <Text
                style={[
                  staticStyles.questionText,
                  styles.questionText,
                  expandedId === item.id && styles.questionActive,
                ]}
              >
                {isVi ? item.questionVi : item.questionEn}
              </Text>
              <MaterialCommunityIcons
                name={expandedId === item.id ? "chevron-up" : "chevron-down"}
                size={20}
                color={
                  expandedId === item.id ? colors.primary : colors.textMuted
                }
              />
            </Pressable>

            {expandedId === item.id && (
              <View
                style={[staticStyles.answerContainer, styles.answerContainer]}
              >
                <Text style={styles.answerText}>
                  {isVi ? item.answerVi : item.answerEn}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* About App & Links */}
        <View style={[staticStyles.aboutSection, styles.aboutSection]}>
          <Text style={styles.title}>{t("faq.aboutApp")}</Text>

          <View style={staticStyles.infoRow}>
            <Text style={styles.aboutLabel}>{t("faq.appName")}:</Text>
            <Text style={styles.aboutValue}>ZiaSub Mobile</Text>
          </View>

          <View style={staticStyles.infoRow}>
            <Text style={styles.aboutLabel}>{t("faq.version")}:</Text>
            <Text style={styles.aboutValue}>1.0.0 (Build 100)</Text>
          </View>

          <View style={staticStyles.infoRow}>
            <Text style={styles.aboutLabel}>{t("faq.author")}:</Text>
            <Text style={styles.aboutValue}>PhuVinhAI</Text>
          </View>

          {/* Social Links */}
          <Text style={[styles.title, { marginTop: 12 }]}>
            {t("faq.contact")}
          </Text>

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
    marginBottom: 8,
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  questionText: {
    flex: 1,
    paddingRight: 8,
  },
  answerContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
  },
  aboutSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
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

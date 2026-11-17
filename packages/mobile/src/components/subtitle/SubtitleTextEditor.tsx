import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "@src/contexts";
import { createThemedStyles, useThemedStyles } from "@hooks/useThemedStyles";

interface SubtitleTextEditorProps {
  visible: boolean;
  value: string;
  onSave: (value: string) => void;
  onOpenVisualEditor?: (value: string) => void;
  onClose: () => void;
}

const SubtitleTextEditor: React.FC<SubtitleTextEditorProps> = ({
  visible,
  value,
  onSave,
  onOpenVisualEditor,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(editorThemedStyles);
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);

  const lineCount = useMemo(
    () => (draft.length > 0 ? draft.split(/\r?\n/).length : 0),
    [draft],
  );
  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    Keyboard.dismiss();
    onSave(draft);
    onClose();
  };

  const handleOpenVisualEditor = () => {
    if (!onOpenVisualEditor) return;
    Keyboard.dismiss();
    onOpenVisualEditor(draft);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleClose}
      onShow={() => inputRef.current?.focus()}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="height"
        automaticOffset
      >
        <View style={[styles.screen, { paddingTop }]}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
            backgroundColor="transparent"
            translucent
          />

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.title} numberOfLines={1}>
                {t("subtitleModal.srt.editorTitle")}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {t("subtitleModal.srt.editorSubtitle")}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {onOpenVisualEditor && (
                <TouchableOpacity
                  style={styles.visualButton}
                  onPress={handleOpenVisualEditor}
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    "subtitleModal.srt.visual.openEditor",
                  )}
                >
                  <MaterialCommunityIcons
                    name="playlist-edit"
                    size={19}
                    color={colors.primary}
                  />
                  <Text style={styles.visualButtonText}>
                    {t("subtitleModal.srt.visual.modeLabel")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel={t("common.save")}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={22}
                  color={colors.onPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            ref={inputRef}
            style={styles.editor}
            value={draft}
            onChangeText={setDraft}
            placeholder={t("subtitleModal.srt.placeholder")}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            multiline
            scrollEnabled
            textAlignVertical="top"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t("subtitleModal.srt.editorTitle")}
          />

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            <MaterialCommunityIcons
              name="text-long"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.footerText}>
              {t("subtitleModal.srt.editorStats", {
                lines: lineCount,
                characters: draft.length,
              })}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const editorThemedStyles = createThemedStyles((colors) => ({
  keyboardView: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleGroup: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 5 },
  visualButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  visualButtonText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  saveButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  editor: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    color: colors.text,
    backgroundColor: colors.background,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  footer: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
}));

export default SubtitleTextEditor;

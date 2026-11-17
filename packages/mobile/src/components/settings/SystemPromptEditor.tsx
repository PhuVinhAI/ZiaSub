import React, { useEffect, useRef, useState } from "react";
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

interface SystemPromptEditorProps {
  visible: boolean;
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({
  visible,
  value,
  onSave,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(editorThemedStyles);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);

  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight, 20);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    Keyboard.dismiss();
    onSave(draft);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
      onShow={() => inputRef.current?.focus()}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="height"
        automaticOffset
      >
        <View style={[styles.screen, { paddingTop }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClose}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={23}
                color={colors.text}
              />
            </TouchableOpacity>

            <View style={styles.headerTitleGroup}>
              <Text style={styles.title} numberOfLines={1}>
                {t("settings.geminiConfig.systemPrompt")}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.72}
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

          <TextInput
            ref={inputRef}
            style={styles.editor}
            value={draft}
            onChangeText={setDraft}
            placeholder={t("settings.geminiConfig.systemPromptPlaceholder")}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            multiline
            scrollEnabled
            textAlignVertical="top"
            autoFocus
            accessibilityLabel={t("settings.geminiConfig.systemPrompt")}
          />

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            <MaterialCommunityIcons
              name="text-long"
              size={15}
              color={colors.textMuted}
            />
            <Text style={styles.footerText}>
              {t("settings.geminiConfig.characters", {
                count: draft.length,
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
  title: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    color: colors.text,
    backgroundColor: colors.background,
    fontSize: 16,
    lineHeight: 25,
  },
  footer: {
    minHeight: 38,
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
  footerText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
}));

export default SystemPromptEditor;

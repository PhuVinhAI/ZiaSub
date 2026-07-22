import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import Button3D from "../common/Button3D";
import { alert } from "../common/CustomAlert";
import type { AIStudioSystemInstruction } from "@utils/storage";

interface AIStudioPromptEditProps {
  visible: boolean;
  initialPrompt?: AIStudioSystemInstruction | null;
  onSave: (prompt: AIStudioSystemInstruction) => void;
  onCancel: () => void;
}

const AIStudioPromptEdit: React.FC<AIStudioPromptEditProps> = ({
  visible,
  initialPrompt,
  onSave,
  onCancel,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const themedStyles = useThemedStyles(editThemedStyles);

  const [title, setTitle] = useState(initialPrompt?.title || "");
  const [text, setText] = useState(initialPrompt?.text || "");

  useEffect(() => {
    if (visible) {
      setTitle(initialPrompt?.title || "");
      setText(initialPrompt?.text || "");
    }
  }, [initialPrompt, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      alert("Thông báo", "Vui lòng nhập tiêu đề cho System Prompt.");
      return;
    }
    if (!text.trim()) {
      alert("Thông báo", "Vui lòng nhập nội dung cho System Prompt.");
      return;
    }
    onSave({
      title: title.trim(),
      text: text.trim(),
    });
  };

  const isEditing = !!initialPrompt;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View
        style={[
          themedStyles.modalContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={themedStyles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={onCancel}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={themedStyles.headerTitle}>
              {isEditing ? "Chỉnh sửa System Prompt" : "Tạo System Prompt mới"}
            </Text>
            <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
              <Text style={themedStyles.saveHeaderBtnText}>Lưu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Tiêu đề */}
            <View style={styles.fieldGroup}>
              <Text style={themedStyles.fieldLabel}>Tiêu đề Prompt</Text>
              <TextInput
                style={[styles.input, themedStyles.input]}
                placeholder="Ví dụ: Dịch thuật chuẩn, Tóm tắt video..."
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Nội dung Prompt */}
            <View style={styles.fieldGroup}>
              <Text style={themedStyles.fieldLabel}>Nội dung System Prompt</Text>
              <TextInput
                style={[styles.input, styles.textArea, themedStyles.input]}
                placeholder="Nhập nội dung hướng dẫn chi tiết cho AI tại đây..."
                placeholderTextColor={colors.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.buttonRow}>
              <Button3D
                title="Hủy"
                variant="outline"
                onPress={onCancel}
                style={styles.actionBtn}
              />
              <Button3D
                title={isEditing ? "Cập nhật" : "Lưu Prompt"}
                variant="primary"
                onPress={handleSave}
                style={styles.actionBtn}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: {
    padding: 4,
  },
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 280,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  actionBtn: {
    flex: 1,
  },
});

const editThemedStyles = createThemedStyles((colors) => ({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  saveHeaderBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    color: colors.text,
  },
}));

export default AIStudioPromptEdit;

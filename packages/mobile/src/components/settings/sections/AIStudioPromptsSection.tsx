import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import Button3D from "../../common/Button3D";
import { alert, confirmDestructive } from "../../common/CustomAlert";
import {
  getAIStudioSystemInstructions,
  saveAIStudioSystemInstructions,
  importSystemPromptsFromGeminiConfigs,
  type AIStudioSystemInstruction,
} from "@utils/storage";

interface AIStudioPromptsSectionProps {
  onSyncToAIStudio?: (instructions: AIStudioSystemInstruction[]) => void;
}

const AIStudioPromptsSection: React.FC<AIStudioPromptsSectionProps> = ({
  onSyncToAIStudio,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(promptsThemedStyles);

  const [instructions, setInstructions] = useState<AIStudioSystemInstruction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");

  const loadInstructions = async () => {
    const data = await getAIStudioSystemInstructions();
    setInstructions(data);
  };

  useEffect(() => {
    loadInstructions();
  }, []);

  const handleSaveAndSync = async (newItems: AIStudioSystemInstruction[]) => {
    setInstructions(newItems);
    await saveAIStudioSystemInstructions(newItems);
    if (onSyncToAIStudio) {
      onSyncToAIStudio(newItems);
    }
  };

  const handleImportFromConfigs = async () => {
    try {
      const imported = await importSystemPromptsFromGeminiConfigs();
      setInstructions(imported);
      if (onSyncToAIStudio) {
        onSyncToAIStudio(imported);
      }
      alert(
        "Thành công",
        `Đã nhập thành công các System Prompt từ Cấu hình AI! (Tổng số: ${imported.length})`
      );
    } catch {
      alert("Lỗi", "Không thể nhập System Prompt từ Cấu hình AI.");
    }
  };

  const handleAddPrompt = async () => {
    if (!newTitle.trim() || !newText.trim()) {
      alert("Thông báo", "Vui lòng nhập đầy đủ Tiêu đề và Nội dung System Prompt.");
      return;
    }

    const newItem: AIStudioSystemInstruction = {
      title: newTitle.trim(),
      text: newText.trim(),
    };

    const updated = [...instructions, newItem];
    await handleSaveAndSync(updated);
    setNewTitle("");
    setNewText("");
    setShowAddModal(false);
    alert("Thành công", "Đã thêm System Prompt mới!");
  };

  const handleDeletePrompt = (index: number) => {
    confirmDestructive(
      "Xóa System Prompt",
      `Bạn có muốn xóa "${instructions[index]?.title}" khỏi danh sách không?`,
      async () => {
        const updated = instructions.filter((_, i) => i !== index);
        await handleSaveAndSync(updated);
      }
    );
  };

  return (
    <>
      <View style={styles.sectionHintRow}>
        <Text style={themedStyles.sectionHint}>
          Tự động đồng bộ các System Prompt này vào{" "}
          <Text style={themedStyles.boldHint}>aistudio_all_system_instructions</Text>{" "}
          của Google AI Studio.
        </Text>
      </View>

      <View style={themedStyles.promptsContainer}>
        {instructions.length === 0 ? (
          <Text style={themedStyles.emptyText}>Chưa có System Prompt nào.</Text>
        ) : (
          instructions.map((item, index) => (
            <View key={index} style={themedStyles.promptCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <MaterialCommunityIcons
                    name="text-box-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={themedStyles.cardTitle}>{item.title}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeletePrompt(index)}
                  style={styles.deleteBtn}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={18}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
              <Text style={themedStyles.cardText} numberOfLines={3}>
                {item.text}
              </Text>
            </View>
          ))
        )}

        <View style={styles.actionRow}>
          <Button3D
            icon="plus"
            title="Thêm mới"
            variant="primary"
            onPress={() => setShowAddModal(true)}
            style={styles.actionBtn}
          />
          <Button3D
            icon="download-outline"
            title="Lấy từ Cấu hình AI"
            variant="secondary"
            onPress={handleImportFromConfigs}
            style={styles.actionBtn}
          />
        </View>
      </View>

      {/* Modal Thêm System Prompt */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, themedStyles.modalCard]}>
            <Text style={[styles.modalTitle, themedStyles.modalTitle]}>
              Thêm System Prompt mới
            </Text>

            <TextInput
              style={[styles.input, themedStyles.input]}
              placeholder="Tiêu đề (VD: Dịch thuật chuẩn)"
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea, themedStyles.input]}
              placeholder="Nội dung System Prompt..."
              placeholderTextColor={colors.textMuted}
              value={newText}
              onChangeText={setNewText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtonRow}>
              <Button3D
                title="Hủy"
                variant="outline"
                onPress={() => setShowAddModal(false)}
                style={styles.actionBtn}
              />
              <Button3D
                title="Lưu"
                variant="primary"
                onPress={handleAddPrompt}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sectionHintRow: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  actionRow: {
    flexDirection: "column",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
});

const promptsThemedStyles = createThemedStyles((colors) => ({
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  boldHint: {
    fontWeight: "700",
    color: colors.primary,
  },
  promptsContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 8,
  },
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  cardText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    color: colors.text,
  },
}));

export default AIStudioPromptsSection;

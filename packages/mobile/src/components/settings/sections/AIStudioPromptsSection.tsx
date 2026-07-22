import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import Button3D from "../../common/Button3D";
import { alert, showAlert, confirmDestructive } from "../../common/CustomAlert";
import {
  getAIStudioSystemInstructions,
  saveAIStudioSystemInstructions,
  getGeminiConfigs,
  type AIStudioSystemInstruction,
} from "@utils/storage";

interface AIStudioPromptsSectionProps {
  onSyncToAIStudio?: (instructions: AIStudioSystemInstruction[]) => void;
  onOpenPromptEditor?: (
    prompt: AIStudioSystemInstruction | null,
    index?: number
  ) => void;
}

const AIStudioPromptsSection: React.FC<AIStudioPromptsSectionProps> = ({
  onSyncToAIStudio,
  onOpenPromptEditor,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(promptsThemedStyles);

  const [instructions, setInstructions] = useState<AIStudioSystemInstruction[]>([]);

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

  const askOverwrite = (title: string): Promise<boolean> => {
    return new Promise((resolve) => {
      showAlert(
        "Phát hiện trùng tiêu đề",
        `System Prompt "${title}" đã có sẵn trong danh sách. Bạn có muốn GHI ĐÈ bằng nội dung mới từ Cấu hình AI không?`,
        [
          { text: "Bỏ qua", style: "cancel", onPress: () => resolve(false) },
          { text: "Ghi đè", onPress: () => resolve(true) },
        ]
      );
    });
  };

  const handleImportFromConfigs = async () => {
    try {
      const currentList = [...instructions];
      const configs = await getGeminiConfigs();
      let importedCount = 0;
      let overwrittenCount = 0;

      for (const config of configs) {
        if (!config.systemPrompt || !config.systemPrompt.trim()) continue;

        const titleName = config.name || "Cấu hình AI";
        const promptText = config.systemPrompt.trim();
        const existingIndex = currentList.findIndex(
          (item) => item.title.trim().toLowerCase() === titleName.trim().toLowerCase()
        );

        if (existingIndex !== -1) {
          // If title matches, prompt user whether to overwrite
          const shouldOverwrite = await askOverwrite(titleName);
          if (shouldOverwrite) {
            currentList[existingIndex] = {
              title: titleName,
              text: promptText,
            };
            overwrittenCount++;
          }
        } else {
          // New title, add directly
          currentList.push({
            title: titleName,
            text: promptText,
          });
          importedCount++;
        }
      }

      await handleSaveAndSync(currentList);

      if (importedCount > 0 || overwrittenCount > 0) {
        alert(
          "Thành công",
          `Đã cập nhật System Prompt từ Cấu hình AI!\n(Thêm mới: ${importedCount}, Ghi đè: ${overwrittenCount})`
        );
      } else {
        alert("Thông báo", "Không có Cấu hình AI mới nào được nhập.");
      }
    } catch {
      alert("Lỗi", "Không thể nhập System Prompt từ Cấu hình AI.");
    }
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
            <TouchableOpacity
              key={index}
              style={themedStyles.promptCard}
              onPress={() => onOpenPromptEditor?.(item, index)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <MaterialCommunityIcons
                    name="text-box-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={themedStyles.cardTitle}>{item.title}</Text>
                </View>

                <View style={styles.actionIconRow}>
                  <TouchableOpacity
                    onPress={() => onOpenPromptEditor?.(item, index)}
                    style={styles.actionIconBtn}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePrompt(index)}
                    style={styles.actionIconBtn}
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={18}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={themedStyles.cardText} numberOfLines={3}>
                {item.text}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.actionRow}>
          <Button3D
            icon="plus"
            title="Thêm mới"
            variant="primary"
            onPress={() => onOpenPromptEditor?.(null, -1)}
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
  actionIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionIconBtn: {
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
}));

export default AIStudioPromptsSection;

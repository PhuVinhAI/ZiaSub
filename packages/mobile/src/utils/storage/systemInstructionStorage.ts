import AsyncStorage from "@react-native-async-storage/async-storage";
import { getGeminiConfigs } from "./geminiStorage";

export interface AIStudioSystemInstruction {
  title: string;
  text: string;
}

export const AISTUDIO_SYSTEM_INSTRUCTIONS_KEY = "aistudio_all_system_instructions";

/**
 * Get all AI Studio System Instructions from AsyncStorage
 */
export const getAIStudioSystemInstructions = async (): Promise<
  AIStudioSystemInstruction[]
> => {
  try {
    const raw = await AsyncStorage.getItem(AISTUDIO_SYSTEM_INSTRUCTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading AI Studio System Instructions:", e);
  }

  // Default initial prompts if empty
  const defaultItems: AIStudioSystemInstruction[] = [
    {
      title: "Dịch thuật chuẩn",
      text: "Bạn là một chuyên gia dịch thuật. Hãy dịch đoạn văn bản sau sang tiếng Việt một cách tự nhiên, chuẩn văn phong và giữ nguyên các mốc thời gian nếu có.",
    },
    {
      title: "Tóm tắt nội dung",
      text: "Hãy tóm tắt ngắn gọn các ý chính của bài nói/video sau theo dạng danh sách gạch đầu dòng dễ hiểu.",
    },
  ];

  await saveAIStudioSystemInstructions(defaultItems);
  return defaultItems;
};

/**
 * Save AI Studio System Instructions to AsyncStorage
 */
export const saveAIStudioSystemInstructions = async (
  instructions: AIStudioSystemInstruction[]
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      AISTUDIO_SYSTEM_INSTRUCTIONS_KEY,
      JSON.stringify(instructions)
    );
  } catch (e) {
    console.error("Error saving AI Studio System Instructions:", e);
  }
};

/**
 * Import system prompts from all created AI configurations (geminiConfigs)
 */
export const importSystemPromptsFromGeminiConfigs = async (): Promise<
  AIStudioSystemInstruction[]
> => {
  const current = await getAIStudioSystemInstructions();
  const configs = await getGeminiConfigs();

  const existingTexts = new Set(current.map((item) => item.text.trim()));
  const newItems: AIStudioSystemInstruction[] = [...current];

  for (const config of configs) {
    if (config.systemPrompt && config.systemPrompt.trim()) {
      const promptText = config.systemPrompt.trim();
      if (!existingTexts.has(promptText)) {
        existingTexts.add(promptText);
        newItems.push({
          title: config.name || "Cấu hình AI",
          text: promptText,
        });
      }
    }
  }

  await saveAIStudioSystemInstructions(newItems);
  return newItems;
};

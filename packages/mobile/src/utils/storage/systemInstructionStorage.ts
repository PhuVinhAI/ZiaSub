import AsyncStorage from "@react-native-async-storage/async-storage";

export const LAST_COPIED_VIDEO_URL_KEY = "last_copied_video_url";

export const saveLastCopiedVideoUrlToStorage = async (
  url: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_COPIED_VIDEO_URL_KEY, url);
  } catch (e) {}
};

export const getLastCopiedVideoUrlFromStorage = async (): Promise<string> => {
  try {
    return (await AsyncStorage.getItem(LAST_COPIED_VIDEO_URL_KEY)) || "";
  } catch (e) {
    return "";
  }
};

export const clearLastCopiedVideoUrlFromStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LAST_COPIED_VIDEO_URL_KEY);
  } catch (e) {}
};

export const LAST_HANDLED_SRT_KEY = "last_handled_srt";

export const saveLastHandledSrtToStorage = async (
  srt: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_HANDLED_SRT_KEY, srt);
  } catch (e) {}
};

export const getLastHandledSrtFromStorage = async (): Promise<string> => {
  try {
    return (await AsyncStorage.getItem(LAST_HANDLED_SRT_KEY)) || "";
  } catch (e) {
    return "";
  }
};

export const clearLastHandledSrtFromStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LAST_HANDLED_SRT_KEY);
  } catch (e) {}
};



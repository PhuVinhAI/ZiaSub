import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "@services/storageKeys";
import { isYouTubeUrl, normalizeYouTubeUrl } from "@utils/videoUtils";

const normalizeSavedUrl = (url: string): string | null => {
  const trimmedUrl = url.trim();
  if (!isYouTubeUrl(trimmedUrl)) return null;
  return normalizeYouTubeUrl(trimmedUrl);
};

export const getSavedYouTubeUrls = async (): Promise<string[]> => {
  const storedUrls = await AsyncStorage.getItem(KEYS.SAVED_YOUTUBE_URLS);
  if (!storedUrls) return [];

  try {
    const parsedUrls: unknown = JSON.parse(storedUrls);
    if (!Array.isArray(parsedUrls)) return [];

    const validUrls = parsedUrls
      .filter((url): url is string => typeof url === "string")
      .map(normalizeSavedUrl)
      .filter((url): url is string => Boolean(url));

    return Array.from(new Set(validUrls));
  } catch {
    return [];
  }
};

export const addSavedYouTubeUrl = async (url: string): Promise<string[]> => {
  const normalizedUrl = normalizeSavedUrl(url);
  if (!normalizedUrl) {
    throw new Error("Only YouTube URLs can be saved");
  }

  const savedUrls = await getSavedYouTubeUrls();
  const nextUrls = [
    normalizedUrl,
    ...savedUrls.filter((savedUrl) => savedUrl !== normalizedUrl),
  ];

  await AsyncStorage.setItem(
    KEYS.SAVED_YOUTUBE_URLS,
    JSON.stringify(nextUrls)
  );
  return nextUrls;
};

export const removeSavedYouTubeUrl = async (
  url: string
): Promise<string[]> => {
  const normalizedUrl = normalizeSavedUrl(url);
  const savedUrls = await getSavedYouTubeUrls();
  const nextUrls = normalizedUrl
    ? savedUrls.filter((savedUrl) => savedUrl !== normalizedUrl)
    : savedUrls;

  await AsyncStorage.setItem(
    KEYS.SAVED_YOUTUBE_URLS,
    JSON.stringify(nextUrls)
  );
  return nextUrls;
};

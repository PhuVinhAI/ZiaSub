/**
 * useDesktopMode
 *
 * Tách từ HomeScreen.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useState } from "react";

interface UseDesktopModeParams {
  currentUrl: string | undefined;
  navigateToUrl: (url: string) => void;
}

export const useDesktopMode = ({
  currentUrl,
  navigateToUrl,
}: UseDesktopModeParams) => {
  // Desktop mode state
  const [isDesktopMode, setIsDesktopMode] = useState(false);

  // Helper to convert URL between mobile and desktop YouTube
  const convertYouTubeUrl = (
    url: string | undefined,
    toDesktop: boolean
  ): string => {
    if (!url) {
      return toDesktop ? "https://www.youtube.com" : "https://m.youtube.com";
    }
    if (toDesktop) {
      return url.replace(
        /^https?:\/\/m\.youtube\.com/,
        "https://www.youtube.com"
      );
    } else {
      return url.replace(
        /^https?:\/\/(www\.)?youtube\.com/,
        "https://m.youtube.com"
      );
    }
  };

  // Toggle between mobile and desktop mode
  const handleToggleDesktopMode = () => {
    const newMode = !isDesktopMode;
    const convertedUrl = convertYouTubeUrl(currentUrl, newMode);
    setIsDesktopMode(newMode);
    // Navigate to converted URL after mode change
    setTimeout(() => {
      navigateToUrl(convertedUrl);
    }, 100);
  };

  return {
    isDesktopMode,
    convertYouTubeUrl,
    handleToggleDesktopMode,
  };
};

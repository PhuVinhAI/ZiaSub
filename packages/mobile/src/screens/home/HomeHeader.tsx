/**
 * HomeHeader
 *
 * Tách từ HomeScreen.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "@src/contexts";
import { styles, homeThemedStyles } from "./homeStyles";

import { isAIStudioPage } from "@utils/videoUtils";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type HomeThemedStyles = ReturnType<typeof homeThemedStyles>;

interface HomeHeaderProps {
  insets: EdgeInsets;
  colors: ThemeColors;
  themedStyles: HomeThemedStyles;
  canGoBack: boolean;
  canGoForward: boolean;
  handleGoBack: () => void;
  handleGoForward: () => void;
  reloadWebView: () => void;
  isDesktopMode: boolean;
  handleToggleDesktopMode: () => void;
  showUrlInput: boolean;
  urlInput: string;
  setUrlInput: (value: string) => void;
  setShowUrlInput: (value: boolean) => void;
  navigateToUrl: (url: string) => void;
  currentUrl: string | undefined;
}

export const HomeHeader = ({
  insets,
  colors,
  themedStyles,
  canGoBack,
  canGoForward,
  handleGoBack,
  handleGoForward,
  reloadWebView,
  isDesktopMode,
  handleToggleDesktopMode,
  showUrlInput,
  urlInput,
  setUrlInput,
  setShowUrlInput,
  navigateToUrl,
  currentUrl,
}: HomeHeaderProps) => {
  const isAIStudio = isAIStudioPage(currentUrl);
  const lastYouTubeUrlRef = useRef<string>("");
  const lastAIStudioUrlRef = useRef<string>("");

  useEffect(() => {
    if (!currentUrl) return;
    if (isAIStudioPage(currentUrl)) {
      lastAIStudioUrlRef.current = currentUrl;
    } else {
      lastYouTubeUrlRef.current = currentUrl;
    }
  }, [currentUrl]);

  const handleOpenUrlInput = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowUrlInput(true);
  };

  const handleCloseUrlInput = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowUrlInput(false);
    setUrlInput("");
  };

  const handleToggleAIStudio = () => {
    if (isAIStudio) {
      const targetUrl =
        lastYouTubeUrlRef.current ||
        (isDesktopMode ? "https://www.youtube.com" : "https://m.youtube.com");
      navigateToUrl(targetUrl);
    } else {
      const targetUrl =
        lastAIStudioUrlRef.current ||
        "https://aistudio.google.com/prompts/new_chat";
      navigateToUrl(targetUrl);
    }
  };

  return (
    <View
      style={[
        styles.headerContainer,
        themedStyles.headerContainer,
        { paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        {!showUrlInput && (
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
              onPress={handleGoBack}
              disabled={!canGoBack}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={18}
                color={canGoBack ? colors.text : colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
              onPress={handleGoForward}
              disabled={!canGoForward}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color={canGoForward ? colors.text : colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={reloadWebView}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="reload"
                size={18}
                color={colors.text}
              />
            </TouchableOpacity>
            {!isAIStudio && (
              <TouchableOpacity
                style={[
                  styles.navBtn,
                  styles.modeToggleBtn,
                  isDesktopMode && themedStyles.modeToggleBtnActive,
                ]}
                onPress={handleToggleDesktopMode}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isDesktopMode ? "monitor" : "cellphone"}
                  size={16}
                  color={isDesktopMode ? colors.primary : colors.text}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {showUrlInput ? (
          <View
            style={[
              styles.urlInputContainer,
              themedStyles.urlInputContainer,
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={16}
              color={colors.textMuted}
              style={styles.urlInputIcon}
            />
            <TextInput
              style={[styles.urlInput, themedStyles.urlInput]}
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="URL hoặc tìm kiếm..."
              placeholderTextColor={colors.textMuted}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              selectTextOnFocus
              onSubmitEditing={() => {
                if (urlInput.trim()) {
                  navigateToUrl(urlInput);
                  handleCloseUrlInput();
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  handleCloseUrlInput();
                }, 100);
              }}
            />
            <TouchableOpacity
              style={styles.urlInputClose}
              onPress={handleCloseUrlInput}
            >
              <MaterialCommunityIcons
                name="close"
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.urlBar, themedStyles.urlBar]}
            onPress={handleOpenUrlInput}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={16}
              color={colors.textMuted}
            />
            <Text
              style={[styles.urlText, themedStyles.urlText]}
              numberOfLines={1}
            >
              {currentUrl || "m.youtube.com"}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.brandContainer}>
          <View style={[styles.logoContainer, themedStyles.logoContainer]}>
            <MaterialCommunityIcons
              name="subtitles"
              size={12}
              color={colors.onPrimary}
            />
          </View>
          <Text style={[styles.brandText, themedStyles.brandText]}>
            Zia
          </Text>
        </View>

        {!showUrlInput && (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={handleToggleAIStudio}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isAIStudio ? "youtube" : "creation"}
              size={20}
              color={isAIStudio ? "#FF0000" : colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

import React, { useEffect, useCallback } from "react";
import { View, StatusBar, BackHandler } from "react-native";
import { alert, confirm } from "@components/common/CustomAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebViewNavigation } from "react-native-webview";
import { useTranslation } from "react-i18next";

import { useTheme, useUpdate } from "@src/contexts";
import { useThemedStyles } from "@hooks/useThemedStyles";
import { queueManager } from "@services/queueManager";

import { useAppSettings } from "@hooks/useAppSettings";
import { useVideoPlayer } from "@hooks/useVideoPlayer";
import { useSubtitles } from "@hooks/useSubtitles";
import { useTranslationQueue } from "@hooks/useTranslationQueue";
import { useDesktopMode } from "@hooks/useDesktopMode";
import { useHomeModals } from "@hooks/useHomeModals";
import { useWebViewMessageHandler } from "@hooks/useWebViewMessageHandler";
import { useQueueActions } from "@hooks/useQueueActions";
import { useSubtitleStyleSync } from "@hooks/useSubtitleStyleSync";
import { useClipboardKeyDetector } from "@hooks/useClipboardKeyDetector";

import { YouTubePlayer } from "@components/video";
import { SubtitleInputModal } from "@components/subtitle";
import { SettingsModal } from "@components/settings";
import { FloatingButton, FAQModal } from "@components/common";
import { TranslationQueueModal } from "@components/queue";
import { ChatModal } from "@components/chat";

import { HomeHeader } from "./home/HomeHeader";
import { styles, homeThemedStyles } from "./home/homeStyles";

const HomeScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { hasUpdate } = useUpdate();

  // Modal states
  const {
    modalVisible,
    setModalVisible,
    settingsVisible,
    setSettingsVisible,
    queueModalVisible,
    setQueueModalVisible,
    chatModalVisible,
    setChatModalVisible,
    faqModalVisible,
    setFaqModalVisible,
    isChatLoading,
    setIsChatLoading,
  } = useHomeModals();

  // App settings hook
  const {
    subtitleSettings,
    batchSettings,
    ttsSettings,
    floatingUISettings,
    notificationSettings,
    debugSettings,
    apiKeys,
    updateSubtitleSettings,
    updateBatchSettings,
    updateTTSSettings,
    updateFloatingUISettings,
    updateNotificationSettings,
    updateDebugSettings,
    updateApiKeys,
  } = useAppSettings();

  // Video player hook
  const {
    webViewRef,
    currentUrlRef,
    currentUrl,
    activeUrl,
    canGoBack,
    canGoForward,
    isVideoPlaying,
    isFullscreen,
    videoDuration,
    videoTitle,
    currentVideoInQueue,
    urlInput,
    showUrlInput,
    setUrlInput,
    setShowUrlInput,
    setVideoDuration,
    setVideoTitle,
    setCurrentVideoInQueue,
    handleNavigationStateChange: handleVideoNavigation,
    onFullScreenOpen,
    onFullScreenClose,
    handleGoBack,
    handleGoForward,
    navigateToVideo,
    navigateToUrl,
    reloadWebView,
    postMessageToWebView,
  } = useVideoPlayer();

  // Desktop mode state
  const { isDesktopMode, handleToggleDesktopMode } = useDesktopMode({
    currentUrl: activeUrl || currentUrl,
    navigateToUrl,
  });

  // Automatic clipboard API key detector
  useClipboardKeyDetector({
    apiKeys,
    updateApiKeys,
    activeUrl,
  });

  // Subtitles hook
  const {
    srtContent,
    setSrtContent,
    subtitles,
    loadSavedSRT,
    applySrtContent,
    findSubtitle,
    updateFromTranslation,
    clearSubtitles,
    hasSubtitles,
  } = useSubtitles({ webViewRef, ttsSettings });

  // Translation queue hook
  const {
    queueCount,
    isTranslating,
    isWaitingInQueue,
    isPausedInQueue,
    queuePosition,
    pausedProgress,
    translationProgress,
    syncAllToWebView,
    syncTranslatedVideosToWebView,
  } = useTranslationQueue({
    webViewRef,
    currentUrlRef,
    onTranslationComplete: updateFromTranslation,
  });

  // Subtitle style + TTS ducking sync effects
  useSubtitleStyleSync({
    webViewRef,
    postMessageToWebView,
    subtitleSettings,
    isVideoPlaying,
  });

  // Load saved SRT when URL changes
  useEffect(() => {
    loadSavedSRT(currentUrl);
  }, [currentUrl, loadSavedSRT]);

  // Handle Android hardware back press
  useEffect(() => {
    const onBackPress = () => {
      // 1. Close full screen mode first if active
      if (isFullscreen) {
        onFullScreenClose();
        return true;
      }
      // 2. Close open modals first
      if (settingsVisible) {
        setSettingsVisible(false);
        return true;
      }
      if (queueModalVisible) {
        setQueueModalVisible(false);
        return true;
      }
      if (chatModalVisible) {
        setChatModalVisible(false);
        return true;
      }
      if (faqModalVisible) {
        setFaqModalVisible(false);
        return true;
      }
      if (modalVisible) {
        setModalVisible(false);
        return true;
      }
      if (showUrlInput) {
        setShowUrlInput(false);
        return true;
      }

      // 3. Navigate back in WebView if history exists
      if (canGoBack) {
        handleGoBack();
        return true;
      }

      // 4. Show exit confirmation dialog when no more back history
      confirm(
        t("common.exitAppTitle"),
        t("common.exitAppMessage"),
        () => BackHandler.exitApp(),
        t("common.exit"),
        t("common.cancel")
      );
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [
    isFullscreen,
    onFullScreenClose,
    settingsVisible,
    setSettingsVisible,
    queueModalVisible,
    setQueueModalVisible,
    chatModalVisible,
    setChatModalVisible,
    faqModalVisible,
    setFaqModalVisible,
    modalVisible,
    setModalVisible,
    showUrlInput,
    setShowUrlInput,
    canGoBack,
    handleGoBack,
    t,
  ]);

  // Queue status effects + actions
  const { handleAddToQueue, handleSelectVideoFromQueue } = useQueueActions({
    currentUrl,
    videoTitle,
    videoDuration,
    setCurrentVideoInQueue,
    navigateToVideo,
    setQueueModalVisible,
  });

  const { handleWebViewMessage } = useWebViewMessageHandler({
    findSubtitle,
    setVideoDuration,
    setVideoTitle,
    onFullScreenOpen,
    onFullScreenClose,
    setQueueModalVisible,
  });

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      handleVideoNavigation(navState, undefined, undefined, syncAllToWebView);
    },
    [handleVideoNavigation, syncAllToWebView]
  );

  const handleWebViewLoad = useCallback(() => {
    setTimeout(() => {
      syncAllToWebView();
      postMessageToWebView({
        type: "setSubtitleStyle",
        payload: subtitleSettings,
      });
    }, 500);
  }, [syncAllToWebView, postMessageToWebView, subtitleSettings]);

  const handleLoadSubtitles = useCallback(async () => {
    const { fixCount } = await applySrtContent(srtContent, currentUrl);

    if (fixCount > 0) {
      alert(
        t("subtitleModal.srt.fixedErrors"),
        t("subtitleModal.srt.fixedErrorsMessage", { count: fixCount })
      );
    }

    setModalVisible(false);
  }, [srtContent, currentUrl, applySrtContent, t]);

  const themedStyles = useThemedStyles(homeThemedStyles);

  return (
    <View
      style={[
        styles.container,
        themedStyles.container,
        { paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.surface}
      />

      {!isFullscreen && (
        <HomeHeader
          insets={insets}
          colors={colors}
          themedStyles={themedStyles}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          handleGoBack={handleGoBack}
          handleGoForward={handleGoForward}
          reloadWebView={reloadWebView}
          isDesktopMode={isDesktopMode}
          handleToggleDesktopMode={handleToggleDesktopMode}
          showUrlInput={showUrlInput}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          setShowUrlInput={setShowUrlInput}
          navigateToUrl={navigateToUrl}
          currentUrl={activeUrl || currentUrl}
        />
      )}

      <YouTubePlayer
        ref={webViewRef}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onLoad={handleWebViewLoad}
        isDesktopMode={isDesktopMode}
      />

      <FloatingButton
        isVideoPage={isVideoPlaying}
        isDesktopMode={isDesktopMode}
        activeUrl={activeUrl}
        onPress={() => setModalVisible(true)}
        onSettingsPress={() => setSettingsVisible(true)}
        onQueuePress={() => setQueueModalVisible(true)}
        onChatPress={() => setChatModalVisible(true)}
        onFAQPress={() => setFaqModalVisible(true)}
        onAddToQueuePress={currentUrl ? handleAddToQueue : undefined}
        hasSubtitles={hasSubtitles}
        isTranslating={isTranslating}
        isWaitingInQueue={isWaitingInQueue}
        isPausedInQueue={isPausedInQueue}
        queuePosition={queuePosition}
        pausedProgress={pausedProgress}
        translationProgress={translationProgress}
        queueCount={queueCount}
        isInQueue={!!currentVideoInQueue}
        isChatLoading={isChatLoading}
        hasUpdate={hasUpdate}
        floatingUISettings={floatingUISettings}
      />

      <SubtitleInputModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        srtContent={srtContent}
        setSrtContent={setSrtContent}
        onLoadSubtitles={handleLoadSubtitles}
        onApplySubtitles={(content) => applySrtContent(content, currentUrl)}
        onClearSubtitles={() => {
          clearSubtitles(currentUrl);
          syncTranslatedVideosToWebView();
          // Remove from completed queue if exists
          if (currentUrl) {
            queueManager.removeCompletedVideo(currentUrl);
          }
        }}
        videoUrl={currentUrl}
        videoTitle={videoTitle}
        videoDuration={videoDuration}
        batchSettings={batchSettings}
        onBatchSettingsChange={updateBatchSettings}
        onTranslationStateChange={(translating, progress) => {
          // Handled by useTranslationQueue hook
        }}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        subtitleSettings={subtitleSettings}
        onSubtitleSettingsChange={updateSubtitleSettings}
        batchSettings={batchSettings}
        onBatchSettingsChange={updateBatchSettings}
        apiKeys={apiKeys}
        onApiKeysChange={updateApiKeys}
        ttsSettings={ttsSettings}
        onTTSSettingsChange={updateTTSSettings}
        floatingUISettings={floatingUISettings}
        onFloatingUISettingsChange={updateFloatingUISettings}
        notificationSettings={notificationSettings}
        onNotificationSettingsChange={updateNotificationSettings}
        debugSettings={debugSettings}
        onDebugSettingsChange={updateDebugSettings}
        onNavigateToUrl={navigateToUrl}
      />

      <TranslationQueueModal
        visible={queueModalVisible}
        onClose={() => setQueueModalVisible(false)}
        onSelectVideo={handleSelectVideoFromQueue}
      />

      <ChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        videoUrl={currentUrl}
        videoTitle={videoTitle}
        videoDuration={videoDuration}
        onLoadingChange={setIsChatLoading}
      />

      <FAQModal
        visible={faqModalVisible}
        onClose={() => setFaqModalVisible(false)}
      />
    </View>
  );
};

export default HomeScreen;

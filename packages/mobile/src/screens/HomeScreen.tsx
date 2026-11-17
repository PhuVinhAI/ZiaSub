import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  View,
  StatusBar,
  BackHandler,
  useWindowDimensions,
} from "react-native";
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

import { isAIStudioPage } from "@utils/videoUtils";

import { YouTubePlayer } from "@components/video";
import {
  SubtitleInputModal,
  VisualSubtitleEditor,
} from "@components/subtitle";
import { SettingsModal } from "@components/settings";
import { FloatingButton } from "@components/common";
import {
  TranslationHistorySheet,
  TranslationQueueModal,
} from "@components/queue";
import { ChatModal } from "@components/chat";

import { HomeHeader } from "./home/HomeHeader";
import { styles, homeThemedStyles } from "./home/homeStyles";

const HomeScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { hasUpdate } = useUpdate();
  const currentTimeRef = useRef(0);
  const [visualEditorVisible, setVisualEditorVisible] = useState(false);
  const [visualCurrentTime, setVisualCurrentTime] = useState(0);

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
    historyVisible,
    setHistoryVisible,
    isChatLoading,
    setIsChatLoading,
  } = useHomeModals();

  // App settings hook
  const {
    subtitleSettings,
    batchSettings,
    floatingUISettings,
    notificationSettings,
    debugSettings,
    apiKeys,
    updateSubtitleSettings,
    updateBatchSettings,
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

  // Subtitles hook
  const {
    srtContent,
    setSrtContent,
    subtitles,
    loadSavedSRT,
    applySrtContent,
    updateSrtDraft,
    findSubtitle,
    updateFromTranslation,
    clearSubtitles,
    hasSubtitles,
  } = useSubtitles({ webViewRef });

  // Automatic clipboard API key & SRT subtitle detector
  useClipboardKeyDetector({
    apiKeys,
    updateApiKeys,
    activeUrl,
    onApplySrt: applySrtContent,
  });

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

  // Subtitle style sync effects
  useSubtitleStyleSync({
    postMessageToWebView,
    subtitleSettings,
    isVideoPlaying,
  });



  // Load saved SRT when URL changes
  useEffect(() => {
    currentTimeRef.current = 0;
    setVisualCurrentTime(0);
    setVisualEditorVisible(false);
    loadSavedSRT(currentUrl);
  }, [currentUrl, loadSavedSRT]);

  useEffect(() => {
    postMessageToWebView({
      type: "setVisualSubtitleEditor",
      payload: visualEditorVisible,
    });
  }, [postMessageToWebView, visualEditorVisible]);

  const handleOpenVisualEditor = useCallback(
    (content: string) => {
      updateSrtDraft(content);
      setVisualCurrentTime(currentTimeRef.current);
      setModalVisible(false);
      setVisualEditorVisible(true);
    },
    [setModalVisible, updateSrtDraft],
  );

  const handleCloseVisualEditor = useCallback(
    async (content: string) => {
      await applySrtContent(content, currentUrl);
      setVisualEditorVisible(false);
    },
    [applySrtContent, currentUrl],
  );

  const handleDiscardVisualEditor = useCallback(
    (content: string) => {
      updateSrtDraft(content);
      setVisualEditorVisible(false);
    },
    [updateSrtDraft],
  );

  const handleSeekVideo = useCallback(
    (seconds: number) => {
      currentTimeRef.current = seconds;
      setVisualCurrentTime(seconds);
      postMessageToWebView({ type: "seekTo", payload: seconds });
    },
    [postMessageToWebView],
  );

  // Handle Android hardware back press
  useEffect(() => {
    const onBackPress = () => {
      // The visual editor registers its own back handler so it can also save
      // an inline edit before this parent handler is reached.
      if (visualEditorVisible) {
        void handleCloseVisualEditor(srtContent);
        return true;
      }
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
      if (historyVisible) {
        setHistoryVisible(false);
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
    visualEditorVisible,
    handleCloseVisualEditor,
    srtContent,
    onFullScreenClose,
    settingsVisible,
    setSettingsVisible,
    queueModalVisible,
    setQueueModalVisible,
    chatModalVisible,
    setChatModalVisible,
    historyVisible,
    setHistoryVisible,
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

  const handleCurrentTime = useCallback(
    (seconds: number) => {
      currentTimeRef.current = seconds;
      if (visualEditorVisible) setVisualCurrentTime(seconds);
    },
    [visualEditorVisible],
  );

  const { handleWebViewMessage } = useWebViewMessageHandler({
    findSubtitle,
    onCurrentTime: handleCurrentTime,
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
      postMessageToWebView({
        type: "setVisualSubtitleEditor",
        payload: visualEditorVisible,
      });
    }, 500);
  }, [
    syncAllToWebView,
    postMessageToWebView,
    subtitleSettings,
    visualEditorVisible,
  ]);

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
  const visualVideoHeight = Math.min(
    Math.max(windowWidth * (9 / 16) + 52, 220),
    windowHeight * 0.44,
  );

  return (
    <View
      style={[
        styles.container,
        themedStyles.container,
        {
          paddingTop: visualEditorVisible ? insets.top : 0,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar
        barStyle={visualEditorVisible || isDark ? "light-content" : "dark-content"}
        backgroundColor={visualEditorVisible ? "#000000" : colors.surface}
      />

      {!isFullscreen && !visualEditorVisible && (
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

      <View style={styles.playerWorkspace}>
        <View
          style={
            visualEditorVisible
              ? [styles.visualVideoPane, { height: visualVideoHeight }]
              : styles.normalVideoPane
          }
        >
          <YouTubePlayer
            ref={webViewRef}
            onMessage={handleWebViewMessage}
            onNavigationStateChange={handleNavigationStateChange}
            onLoad={handleWebViewLoad}
            isDesktopMode={isDesktopMode}
          />
        </View>
        {visualEditorVisible && (
          <VisualSubtitleEditor
            value={srtContent}
            currentTime={visualCurrentTime}
            videoDuration={videoDuration}
            onChange={updateSrtDraft}
            onSeek={handleSeekVideo}
            onDone={handleCloseVisualEditor}
            onDiscard={handleDiscardVisualEditor}
          />
        )}
      </View>

      {!visualEditorVisible && (
        <FloatingButton
          isVideoPage={isVideoPlaying}
          isDesktopMode={isDesktopMode}
          activeUrl={activeUrl}
          onPress={() => setModalVisible(true)}
          onSettingsPress={() => setSettingsVisible(true)}
          onQueuePress={() => setQueueModalVisible(true)}
          onChatPress={() => setChatModalVisible(true)}
          onHistoryPress={() => setHistoryVisible(true)}
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
      )}

      <SubtitleInputModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        srtContent={srtContent}
        setSrtContent={setSrtContent}
        onLoadSubtitles={handleLoadSubtitles}
        onOpenVisualEditor={handleOpenVisualEditor}
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

      <TranslationHistorySheet
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
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

    </View>
  );
};

export default HomeScreen;

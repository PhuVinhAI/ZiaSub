/**
 * useWebViewMessageHandler
 *
 * Tách từ HomeScreen.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useCallback } from "react";
import { WebViewMessageEvent } from "react-native-webview";
import { alert, showAlert } from "@components/common/CustomAlert";
import { queueManager } from "@services/queueManager";
import { useTranslation } from "react-i18next";

interface UseWebViewMessageHandlerParams {
  findSubtitle: (currentTime: number) => void;
  setVideoDuration: (duration: number) => void;
  setVideoTitle: (title: string) => void;
  onFullScreenOpen: () => void;
  onFullScreenClose: () => void;
  setQueueModalVisible: (visible: boolean) => void;
}

export const useWebViewMessageHandler = ({
  findSubtitle,
  setVideoDuration,
  setVideoTitle,
  onFullScreenOpen,
  onFullScreenClose,
  setQueueModalVisible,
}: UseWebViewMessageHandlerParams) => {
  const { t } = useTranslation();

  const handleWebViewMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case "currentTime":
            findSubtitle(data.payload);
            break;
          case "videoDuration":
            setVideoDuration(data.payload);
            break;
          case "videoTitle":
            setVideoTitle(data.payload);
            break;
          case "fullscreen_open":
            onFullScreenOpen();
            break;
          case "fullscreen_close":
            onFullScreenClose();
            break;
          case "addToQueue":
            await handleAddToQueueFromThumbnail(data.payload);
            break;
        }
      } catch (e) {}
    },
    [
      findSubtitle,
      setVideoDuration,
      setVideoTitle,
      onFullScreenOpen,
      onFullScreenClose,
    ]
  );

  const handleAddToQueueFromThumbnail = async (payload: {
    videoUrl: string;
    title: string;
    duration?: number;
  }) => {
    const { videoUrl, title, duration } = payload;

    const result = await queueManager.addToQueue(videoUrl, title, duration);

    if (result.isExisting) {
      const statusText =
        result.item.status === "translating"
          ? t("queue.currentlyTranslating")
          : t("queue.alreadyInQueue", { count: result.pendingCount });
      alert(t("common.notice"), statusText);
    } else {
      const pendingText =
        result.pendingCount > 1
          ? t("queue.pendingCount", { count: result.pendingCount })
          : t("queue.willTranslateNow");
      showAlert(
        t("queue.addedToQueue"),
        t("queue.addedMessage", { pendingText }),
        [
          { text: t("common.ok") },
          {
            text: t("queue.viewQueue"),
            onPress: () => setQueueModalVisible(true),
          },
        ]
      );
    }
  };

  return {
    handleWebViewMessage,
    handleAddToQueueFromThumbnail,
  };
};

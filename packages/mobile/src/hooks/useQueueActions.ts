/**
 * useQueueActions
 *
 * Tách từ HomeScreen.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useCallback, useEffect } from "react";
import { alert, showAlert } from "@components/common/CustomAlert";
import { queueManager, QueueItem } from "@services/queueManager";
import { useTranslation } from "react-i18next";

interface UseQueueActionsParams {
  currentUrl: string | undefined;
  videoTitle: string;
  videoDuration: number | undefined;
  setCurrentVideoInQueue: (item: QueueItem | undefined) => void;
  navigateToVideo: (videoUrl: string) => void;
  setQueueModalVisible: (visible: boolean) => void;
}

export const useQueueActions = ({
  currentUrl,
  videoTitle,
  videoDuration,
  setCurrentVideoInQueue,
  navigateToVideo,
  setQueueModalVisible,
}: UseQueueActionsParams) => {
  const { t } = useTranslation();

  // Update queue status when URL changes
  useEffect(() => {
    if (currentUrl) {
      setCurrentVideoInQueue(queueManager.isInQueue(currentUrl));
    }
  }, [currentUrl, setCurrentVideoInQueue]);

  // Subscribe to queue changes to update isInQueue status
  useEffect(() => {
    const unsubscribe = queueManager.subscribe(() => {
      if (currentUrl) {
        setCurrentVideoInQueue(queueManager.isInQueue(currentUrl));
      }
    });
    return () => unsubscribe();
  }, [currentUrl, setCurrentVideoInQueue]);

  const handleAddToQueue = useCallback(async () => {
    if (!currentUrl) return;

    // Check if we have required data (title and duration)
    if (!videoTitle || !videoDuration) {
      alert(
        t("common.notice"),
        t("queue.waitingForVideoData") ||
          "Đang tải thông tin video, vui lòng thử lại sau giây lát"
      );
      return;
    }

    const result = await queueManager.addToQueue(
      currentUrl,
      videoTitle,
      videoDuration
    );

    setCurrentVideoInQueue(result.item);

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
  }, [currentUrl, videoTitle, videoDuration, setCurrentVideoInQueue, t]);

  const handleSelectVideoFromQueue = useCallback(
    (videoUrl: string) => {
      navigateToVideo(videoUrl);
    },
    [navigateToVideo]
  );

  return {
    handleAddToQueue,
    handleSelectVideoFromQueue,
  };
};

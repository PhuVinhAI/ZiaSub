/**
 * useHomeModals
 *
 * Tách từ HomeScreen.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useState } from "react";

export const useHomeModals = () => {
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [queueModalVisible, setQueueModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  return {
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
  };
};

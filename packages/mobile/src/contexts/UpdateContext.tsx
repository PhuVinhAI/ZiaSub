/**
 * Update Context - Manages app update state
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { updateService, UpdateCheckResult } from "@services/updateService";

interface UpdateContextType {
  hasUpdate: boolean;
  updateResult: UpdateCheckResult | null;
  showUpdateModal: () => void;
  dismissUpdate: () => void;
  checkForUpdate: () => Promise<UpdateCheckResult | null>;
  updateModalVisible: boolean;
}

const UpdateContext = createContext<UpdateContextType>({
  hasUpdate: false,
  updateResult: null,
  showUpdateModal: () => {},
  dismissUpdate: () => {},
  checkForUpdate: async () => null,
  updateModalVisible: false,
});

export const useUpdate = () => useContext(UpdateContext);

interface UpdateProviderProps {
  children: React.ReactNode;
  autoCheck?: boolean;
}

export const UpdateProvider: React.FC<UpdateProviderProps> = ({
  children,
  autoCheck = false,
}) => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(
    null
  );
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  // Session-only dismissal: survives background/foreground, resets when the
  // app process restarts.
  const dismissedForSession = useRef(false);

  const checkForUpdate = useCallback(async () => {
    try {
      const result = await updateService.checkForUpdate();
      setUpdateResult(result);
      if (result.hasUpdate) {
        setHasUpdate(true);
        setUpdateModalVisible(!dismissedForSession.current);
      } else {
        setHasUpdate(false);
        setUpdateModalVisible(false);
      }
      return result;
    } catch (error) {
      console.error("Failed to check for update:", error);
      return null;
    }
  }, []);

  const showUpdateModal = useCallback(() => {
    setUpdateModalVisible(true);
  }, []);

  const dismissUpdate = useCallback(() => {
    dismissedForSession.current = true;
    setUpdateModalVisible(false);
  }, []);

  useEffect(() => {
    if (autoCheck) {
      checkForUpdate();
    }
  }, [autoCheck, checkForUpdate]);

  const value: UpdateContextType = {
    hasUpdate,
    updateResult,
    showUpdateModal,
    dismissUpdate,
    checkForUpdate,
    updateModalVisible,
  };

  return (
    <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>
  );
};

export default UpdateContext;

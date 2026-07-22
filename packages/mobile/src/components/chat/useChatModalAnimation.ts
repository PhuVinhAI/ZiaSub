/**
 * useChatModalAnimation
 *
 * Tách từ ChatModal.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useRef, useState, useEffect } from "react";
import { Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;

interface UseChatModalAnimationParams {
  visible: boolean;
  loadData: () => void;
  onClose: () => void;
}

export function useChatModalAnimation({
  visible,
  loadData,
  onClose,
}: UseChatModalAnimationParams) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      drawerAnim.setValue(-DRAWER_WIDTH);
      setDrawerOpen(false);
    }
  }, [visible]);

  const toggleDrawer = () => {
    const opening = !drawerOpen;
    setDrawerOpen(opening);
    Animated.timing(drawerAnim, {
      toValue: opening ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return {
    slideAnim,
    fadeAnim,
    drawerAnim,
    drawerOpen,
    toggleDrawer,
    handleClose,
  };
}

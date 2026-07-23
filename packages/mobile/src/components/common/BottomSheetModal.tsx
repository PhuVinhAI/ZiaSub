import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  ViewStyle,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  maxHeightRatio?: number; // Default: 0.75 (75% of screen height)
  heightRatio?: number; // Fixed height ratio if provided
  fixedHeight?: boolean; // If true, sets explicit height to maxHeightRatio
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  showDragHandle?: boolean;
  showCloseButton?: boolean;
  containerStyle?: ViewStyle;
  wrapperComponent?: React.ComponentType<any>;
  wrapperStyle?: any;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  iconName,
  iconColor,
  maxHeightRatio = 0.75,
  heightRatio,
  fixedHeight = false,
  children,
  headerRight,
  showDragHandle = true,
  showCloseButton = true,
  containerStyle,
  wrapperComponent: WrapperComponent,
  wrapperStyle,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const themedStyles = useThemedStyles(bottomSheetThemedStyles);

  const sheetMaxHeight = SCREEN_HEIGHT * maxHeightRatio;
  const sheetHeight = heightRatio
    ? SCREEN_HEIGHT * heightRatio
    : fixedHeight
    ? sheetMaxHeight
    : undefined;

  const [modalVisible, setModalVisible] = useState(visible);

  const slideAnim = useRef(new Animated.Value(sheetMaxHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: sheetMaxHeight,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, sheetMaxHeight, slideAnim, fadeAnim]);

  if (!modalVisible) return null;

  const renderSheetContent = () => (
    <Animated.View
      style={[
        styles.bottomSheet,
        themedStyles.bottomSheet,
        {
          height: sheetHeight,
          maxHeight: sheetMaxHeight,
          paddingBottom: Math.max(insets.bottom, 20),
          transform: [{ translateY: slideAnim }],
        },
        containerStyle,
      ]}
    >
      {showDragHandle && <View style={themedStyles.dragHandle} />}

      {(title || showCloseButton || headerRight) && (
        <View style={themedStyles.sheetHeader}>
          <View style={styles.headerLeft}>
            {iconName && (
              <MaterialCommunityIcons
                name={iconName}
                size={24}
                color={iconColor || colors.primary}
              />
            )}
            <View style={styles.headerTitleGroup}>
              {title && <Text style={themedStyles.title}>{title}</Text>}
              {subtitle && (
                <Text style={themedStyles.subtitle}>{subtitle}</Text>
              )}
            </View>
          </View>
          <View style={styles.headerRightGroup}>
            {headerRight}
            {showCloseButton && (
              <TouchableOpacity
                onPress={onClose}
                style={themedStyles.closeButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Children Content */}
      {children}
    </Animated.View>
  );

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop Overlay */}
        <Animated.View
          style={[
            styles.modalOverlay,
            themedStyles.modalOverlay,
            { opacity: fadeAnim },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        </Animated.View>

        {/* Bottom Sheet Card */}
        {WrapperComponent ? (
          <WrapperComponent style={wrapperStyle}>
            {renderSheetContent()}
          </WrapperComponent>
        ) : (
          renderSheetContent()
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: "100%",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

const bottomSheetThemedStyles = createThemedStyles((colors) => ({
  modalOverlay: {
    backgroundColor: colors.overlay,
  },
  bottomSheet: {
    backgroundColor: colors.surface,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
}));

export default BottomSheetModal;

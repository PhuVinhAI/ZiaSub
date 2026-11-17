import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import { BottomSheetModal, Button3D } from "@components/common";
import type { ChatSession } from "@src/types";
import { updateChatSession } from "@utils/storage";
import { confirmDestructive } from "../common/CustomAlert";

interface ChatDrawerProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  drawerAnim: Animated.Value;
  paddingTop: number;
  onClose: () => void;
  onNewChat: () => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSessions: (sessions: ChatSession[]) => void;
  onUpdateCurrentSession: (session: ChatSession) => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({
  sessions,
  currentSession,
  drawerAnim,
  paddingTop,
  onClose,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onUpdateSessions,
  onUpdateCurrentSession,
}) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(chatDrawerThemedStyles);
  const [actionSession, setActionSession] = useState<ChatSession | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: (event) => {
        "worklet";
        keyboardHeight.value = Math.max(event.height, 0);
      },
    },
    [],
  );

  const keyboardAvoidingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardHeight.value }],
  }));

  const handleOpenSessionMenu = (session: ChatSession) => {
    setActionSession(session);
    setEditingName(session.name);
    setIsRenaming(false);
  };

  const handleCloseSessionMenu = () => {
    setActionSession(null);
    setIsRenaming(false);
    setEditingName("");
  };

  const handleStartEdit = () => {
    if (!actionSession) return;
    setEditingName(actionSession.name);
    setIsRenaming(true);
  };

  const handleSaveSessionName = async () => {
    if (!actionSession) return;
    const trimmedName = editingName.trim();
    if (!trimmedName) return;
    const session = sessions.find((s) => s.id === actionSession.id);
    if (session) {
      const updated = { ...session, name: trimmedName };
      await updateChatSession(updated);
      onUpdateSessions(
        sessions.map((s) => (s.id === actionSession.id ? updated : s)),
      );
      if (currentSession?.id === actionSession.id)
        onUpdateCurrentSession(updated);
    }
    handleCloseSessionMenu();
  };

  const handleDelete = (session: ChatSession) => {
    handleCloseSessionMenu();
    setTimeout(() => {
      confirmDestructive(t("chat.deleteChat"), t("chat.deleteConfirm"), () => {
        onDeleteSession(session.id);
      });
    }, 220);
  };

  const filteredSessions = searchQuery.trim()
    ? sessions.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : sessions;

  const formatSessionDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString(
      i18n.language.startsWith("vi") ? "vi-VN" : "en-US",
      { day: "2-digit", month: "2-digit" },
    );

  return (
    <Animated.View
      style={[
        styles.drawer,
        themedStyles.drawer,
        { top: 0, paddingTop, transform: [{ translateX: drawerAnim }] },
      ]}
    >
      <View style={styles.drawerHeader}>
        <View style={styles.drawerBrand}>
          <View style={themedStyles.brandMark}>
            <MaterialCommunityIcons
              name="creation"
              size={21}
              color={colors.primary}
            />
          </View>
          <View>
            <Text style={themedStyles.drawerBrandText}>ZiaSub</Text>
            <Text style={themedStyles.drawerBrandSubtitle}>
              {t("chat.title")}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        >
          <MaterialCommunityIcons
            name="close"
            size={21}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>
      <View style={themedStyles.searchBox}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.textMuted}
        />
        <TextInput
          style={themedStyles.searchInput}
          placeholder={t("chat.searchPlaceholder")}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery("")}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={t("common.clear")}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={themedStyles.newChatBtn}
        onPress={onNewChat}
        activeOpacity={0.72}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons
          name="pencil-box-outline"
          size={20}
          color={colors.primary}
        />
        <Text style={themedStyles.newChatText}>{t("chat.newChat")}</Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={18}
          color={colors.primary}
        />
      </TouchableOpacity>
      <View style={styles.sectionHeader}>
        <Text style={themedStyles.drawerSectionTitle}>{t("chat.history")}</Text>
        <Text style={themedStyles.historyCount}>{sessions.length}</Text>
      </View>
      <ScrollView
        style={styles.sessionList}
        showsVerticalScrollIndicator={false}
      >
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={searchQuery ? "magnify-close" : "message-outline"}
              size={24}
              color={colors.textMuted}
            />
            <Text style={themedStyles.emptyText}>
              {searchQuery ? t("chat.noSearchResults") : t("chat.noHistory")}
            </Text>
          </View>
        ) : (
          filteredSessions.map((session) => {
            const isActive = currentSession?.id === session.id;
            const taskCount = session.messages.filter(
              (message) => message.role === "user",
            ).length;

            return (
              <View
                key={session.id}
                style={[
                  styles.sessionItem,
                  isActive && themedStyles.sessionItemActive,
                ]}
              >
                <View style={styles.sessionRow}>
                  <TouchableOpacity
                    style={styles.sessionContent}
                    onPress={() => onSelectSession(session)}
                    activeOpacity={0.72}
                  >
                    <View
                      style={[
                        themedStyles.sessionIcon,
                        isActive && themedStyles.sessionIconActive,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="message-text-outline"
                        size={17}
                        color={isActive ? colors.primary : colors.textMuted}
                      />
                    </View>
                    <View style={styles.sessionText}>
                      <Text
                        style={[
                          themedStyles.sessionName,
                          isActive && styles.sessionNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {session.name}
                      </Text>
                      <Text style={themedStyles.sessionMeta} numberOfLines={1}>
                        {formatSessionDate(session.updatedAt)} -{" "}
                        {t("chat.taskCount", { count: taskCount })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sessionMenuButton}
                    onPress={() => handleOpenSessionMenu(session)}
                    hitSlop={3}
                    accessibilityRole="button"
                    accessibilityLabel={t("chat.conversationActions")}
                  >
                    <MaterialCommunityIcons
                      name="dots-vertical"
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <BottomSheetModal
        visible={!!actionSession}
        onClose={handleCloseSessionMenu}
        title={isRenaming ? t("chat.renameChat") : actionSession?.name}
        subtitle={
          actionSession
            ? `${formatSessionDate(actionSession.updatedAt)} - ${t(
                "chat.taskCount",
                {
                  count: actionSession.messages.filter(
                    (message) => message.role === "user",
                  ).length,
                },
              )}`
            : undefined
        }
        iconName={
          isRenaming ? "pencil-outline" : "dots-horizontal-circle-outline"
        }
        maxHeightRatio={isRenaming ? 0.5 : 0.42}
        wrapperComponent={Reanimated.View}
        wrapperStyle={[styles.keyboardAvoidingContainer, keyboardAvoidingStyle]}
      >
        {isRenaming ? (
          <View style={styles.renameContent}>
            <TextInput
              style={themedStyles.renameInput}
              value={editingName}
              onChangeText={setEditingName}
              placeholder={t("chat.renamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              autoFocus
              selectTextOnFocus
              maxLength={80}
              returnKeyType="done"
              onSubmitEditing={handleSaveSessionName}
            />
            <View style={styles.renameButtons}>
              <View style={styles.renameButton}>
                <Button3D
                  title={t("common.cancel")}
                  variant="outline"
                  onPress={() => setIsRenaming(false)}
                />
              </View>
              <View style={styles.renameButton}>
                <Button3D
                  title={t("common.save")}
                  icon="check"
                  onPress={handleSaveSessionName}
                  disabled={!editingName.trim()}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.actionSheetList}>
            <TouchableOpacity
              style={[styles.sheetAction, themedStyles.editAction]}
              onPress={handleStartEdit}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={t("chat.renameChat")}
            >
              <View
                style={[styles.sheetActionIcon, themedStyles.editActionIcon]}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.sheetActionTextGroup}>
                <Text style={themedStyles.sheetActionTitle}>
                  {t("chat.renameChat")}
                </Text>
                <Text style={themedStyles.sheetActionHint} numberOfLines={2}>
                  {t("chat.renameChatHint")}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={21}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetAction, themedStyles.deleteAction]}
              onPress={() => actionSession && handleDelete(actionSession)}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={t("chat.deleteChat")}
            >
              <View
                style={[styles.sheetActionIcon, themedStyles.deleteActionIcon]}
              >
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={20}
                  color={colors.error}
                />
              </View>
              <View style={styles.sheetActionTextGroup}>
                <Text
                  style={[
                    themedStyles.sheetActionTitle,
                    themedStyles.deleteActionText,
                  ]}
                >
                  {t("chat.deleteChat")}
                </Text>
                <Text
                  style={[
                    themedStyles.sheetActionHint,
                    themedStyles.deleteActionHint,
                  ]}
                  numberOfLines={2}
                >
                  {t("chat.deleteChatHint")}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={21}
                color={colors.error}
              />
            </TouchableOpacity>
          </View>
        )}
      </BottomSheetModal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "82%",
    paddingHorizontal: 16,
    zIndex: 30,
    elevation: 16,
    paddingBottom: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  drawerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  clearSearchButton: {
    width: 36,
    height: 36,
    marginRight: -8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sessionList: { flex: 1 },
  sessionItem: { borderRadius: 8, marginBottom: 4, overflow: "hidden" },
  sessionRow: { flexDirection: "row", alignItems: "center" },
  sessionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingLeft: 10,
    gap: 9,
  },
  sessionText: { flex: 1, minWidth: 0 },
  sessionNameActive: { fontWeight: "600" },
  sessionMenuButton: {
    width: 44,
    height: 44,
    marginRight: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  keyboardAvoidingContainer: { width: "100%" },
  renameContent: { gap: 16, paddingTop: 4 },
  renameButtons: {
    flexDirection: "row",
    gap: 12,
  },
  renameButton: { flex: 1 },
  actionSheetList: { gap: 9 },
  sheetAction: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
  },
  sheetActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetActionTextGroup: { flex: 1, minWidth: 0, gap: 3 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
});

const chatDrawerThemedStyles = createThemedStyles((colors) => ({
  drawer: { backgroundColor: colors.surface },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  drawerBrandText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 21,
    fontWeight: "700",
  },
  drawerBrandSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceLight,
    minHeight: 46,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    marginBottom: 18,
  },
  newChatText: {
    flex: 1,
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  drawerSectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  historyCount: {
    minWidth: 24,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    backgroundColor: colors.surfaceLight,
    borderRadius: 9,
    paddingHorizontal: 6,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  sessionItemActive: { backgroundColor: colors.surfaceLight },
  sessionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  sessionIconActive: { backgroundColor: colors.primarySoft },
  sessionName: { color: colors.text, fontSize: 13, lineHeight: 18 },
  sessionMeta: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  renameInput: {
    minHeight: 52,
    color: colors.text,
    fontSize: 15,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editAction: { backgroundColor: colors.primarySoft },
  deleteAction: { backgroundColor: colors.errorBg },
  editActionIcon: { backgroundColor: colors.surface },
  deleteActionIcon: { backgroundColor: colors.surface },
  sheetActionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  sheetActionHint: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  deleteActionText: { color: colors.error },
  deleteActionHint: { color: colors.error },
}));

export default ChatDrawer;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SegmentedTabs } from "@components/common";
import { useTheme } from "@src/contexts";
import { createThemedStyles, useThemedStyles } from "@hooks/useThemedStyles";
import { translationManager } from "@services/translationManager";
import {
  getTranslationHistory,
  type TranslationHistoryItem,
} from "@utils/storage";
import { formatDate, formatDuration } from "./queueFormatters";
import QueuePagination from "./QueuePagination";

type HistoryTab = "all" | "paused" | "completed";

interface TranslationHistorySheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectVideo: (videoUrl: string) => void;
}

const PAGE_SIZE = 10;

const TranslationHistorySheet: React.FC<TranslationHistorySheetProps> = ({
  visible,
  onClose,
  onSelectVideo,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const themedStyles = useThemedStyles(historyThemedStyles);
  const [activeTab, setActiveTab] = useState<HistoryTab>("all");
  const [items, setItems] = useState<TranslationHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await getTranslationHistory());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    void loadHistory();
    // Translation storage is updated while a batch completes or a job stops.
    // Subscribe only as a refresh signal; history data itself comes from storage.
    return translationManager.subscribe((job) => {
      if (job.status === "completed" || job.status === "error") {
        void loadHistory();
      }
    });
  }, [loadHistory, visible]);

  const counts = useMemo(
    () => ({
      paused: items.filter((item) => item.status === "paused").length,
      completed: items.filter((item) => item.status === "completed").length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesTab = activeTab === "all" || item.status === activeTab;
      const matchesSearch =
        !query ||
        item.title.toLocaleLowerCase().includes(query) ||
        item.videoId.toLocaleLowerCase().includes(query) ||
        item.videoUrl.toLocaleLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, items, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleTabChange = (tab: HistoryTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleSelectVideo = (videoUrl: string) => {
    onSelectVideo(videoUrl);
    onClose();
  };

  const renderItem = ({ item }: { item: TranslationHistoryItem }) => {
    const isPaused = item.status === "paused";
    const total = item.totalBatches;
    const completed = item.completedBatches;
    const progress = total > 0 ? Math.min((completed / total) * 100, 100) : 0;
    const statusColor = isPaused ? colors.warning : colors.success;

    return (
      <TouchableOpacity
        style={[styles.item, themedStyles.item]}
        onPress={() => handleSelectVideo(item.videoUrl)}
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel={t("queue.history.openVideo", {
          title: item.title,
        })}
      >
        <View style={styles.thumbnailWrap}>
          <Image
            source={{ uri: item.thumbnail }}
            style={[styles.thumbnail, themedStyles.thumbnail]}
            resizeMode="cover"
          />
          {item.duration ? (
            <View style={themedStyles.durationBadge}>
              <Text style={styles.durationText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.itemInfo}>
          <Text style={themedStyles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusChip,
                isPaused ? themedStyles.pausedChip : themedStyles.completedChip,
              ]}
            >
              <MaterialCommunityIcons
                name={isPaused ? "pause" : "check"}
                size={13}
                color={statusColor}
              />
              <Text
                style={[themedStyles.statusText, { color: statusColor }]}
                numberOfLines={1}
              >
                {t(`queue.tabs.${item.status}`)}
              </Text>
            </View>
            <Text style={themedStyles.metaText} numberOfLines={1}>
              {isPaused && total > 0
                ? t("queue.history.pausedProgress", {
                    completed,
                    total,
                  })
                : t("queue.history.completedAt", {
                    date: formatDate(item.timestamp),
                  })}
            </Text>
          </View>
          {isPaused && total > 0 ? (
            <View style={themedStyles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: colors.warning,
                  },
                ]}
              />
            </View>
          ) : null}
        </View>

        <View style={themedStyles.openIcon}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const emptyMessage = searchQuery.trim()
    ? t("queue.history.noSearchResults")
    : t(`queue.history.empty.${activeTab}`);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={[styles.root, themedStyles.root]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View
          style={{
            height: Math.max(insets.top, StatusBar.currentHeight || 0),
          }}
        />

        <View style={styles.header}>
          <View style={styles.headerLeading}>
            <View style={themedStyles.headerIcon}>
              <MaterialCommunityIcons
                name="history"
                size={23}
                color={colors.primary}
              />
            </View>
            <View style={styles.headerTitleGroup}>
              <Text style={themedStyles.headerTitle} numberOfLines={1}>
                {t("queue.history.title")}
              </Text>
              <Text style={themedStyles.headerSubtitle} numberOfLines={1}>
                {t("queue.history.subtitle", { count: items.length })}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={themedStyles.headerActionButton}
              onPress={() => void loadHistory()}
              disabled={isLoading}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t("home.reload")}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialCommunityIcons
                  name="refresh"
                  size={22}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={themedStyles.headerActionButton}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={themedStyles.searchField}>
            <MaterialCommunityIcons
              name="magnify"
              size={21}
              color={colors.textMuted}
            />
            <TextInput
              style={themedStyles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={t("queue.history.searchPlaceholder")}
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => handleSearchChange("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("common.clear")}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={19}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <SegmentedTabs<HistoryTab>
            value={activeTab}
            onChange={handleTabChange}
            compact
            style={styles.tabs}
            items={[
              {
                key: "all",
                label: t("common.all"),
                badge: items.length || undefined,
              },
              {
                key: "paused",
                label: t("queue.tabs.paused"),
                badge: counts.paused || undefined,
                badgeTone: "warning",
              },
              {
                key: "completed",
                label: t("queue.tabs.completed"),
                badge: counts.completed || undefined,
                badgeTone: "success",
              },
            ]}
          />

          {isLoading && items.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={visibleItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              style={styles.list}
              contentContainerStyle={[
                styles.listContent,
                visibleItems.length === 0 && styles.emptyListContent,
              ]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={themedStyles.emptyIcon}>
                    <MaterialCommunityIcons
                      name={searchQuery.trim() ? "magnify" : "history"}
                      size={31}
                      color={colors.textMuted}
                    />
                  </View>
                  <Text style={themedStyles.emptyTitle}>
                    {searchQuery.trim()
                      ? t("queue.history.noSearchResults")
                      : t("queue.history.emptyTitle")}
                  </Text>
                  <Text style={themedStyles.emptySubtitle}>
                    {emptyMessage}
                  </Text>
                </View>
              }
            />
          )}

          <QueuePagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  headerLeading: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  headerTitleGroup: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tabs: { marginTop: 10, marginBottom: 12 },
  list: { flex: 1 },
  listContent: { gap: 8, paddingBottom: 10 },
  emptyListContent: { flexGrow: 1 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  item: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 9,
    borderRadius: 10,
  },
  thumbnailWrap: {
    width: 112,
    height: 63,
    flexShrink: 0,
    position: "relative",
  },
  thumbnail: { width: "100%", height: "100%", borderRadius: 7 },
  durationText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  itemInfo: { flex: 1, minWidth: 0 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 6,
  },
  statusChip: {
    flexShrink: 0,
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  progressFill: { height: "100%", borderRadius: 2 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
});

const historyThemedStyles = createThemedStyles((colors) => ({
  root: { backgroundColor: colors.surface },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.primarySoft,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800" as const,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.surfaceLight,
  },
  searchField: {
    minHeight: 52,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 8,
  },
  item: { backgroundColor: colors.surfaceLight },
  thumbnail: { backgroundColor: colors.surfaceElevated },
  durationBadge: {
    position: "absolute" as const,
    right: 4,
    bottom: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.scrim,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600" as const,
  },
  pausedChip: { backgroundColor: colors.warningBg },
  completedChip: { backgroundColor: colors.successBg },
  statusText: { fontSize: 10, fontWeight: "700" as const },
  metaText: { flex: 1, color: colors.textMuted, fontSize: 10 },
  progressTrack: {
    height: 4,
    marginTop: 7,
    borderRadius: 2,
    overflow: "hidden" as const,
    backgroundColor: colors.surfaceElevated,
  },
  openIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.primarySoft,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 13,
    backgroundColor: colors.surfaceLight,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700" as const,
    textAlign: "center" as const,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center" as const,
    marginTop: 6,
  },
}));

export default TranslationHistorySheet;

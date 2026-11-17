import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { BottomSheetModal, alert } from "@components/common";
import { confirmDestructive } from "@components/common/CustomAlert";
import { useTheme } from "@src/contexts";
import { createThemedStyles, useThemedStyles } from "@hooks/useThemedStyles";
import {
  extractVideoId,
  getThumbnailUrl,
  isYouTubeUrl,
  normalizeYouTubeUrl,
} from "@utils/videoUtils";
import {
  addSavedYouTubeUrl,
  getSavedYouTubeUrls,
  removeSavedYouTubeUrl,
} from "@utils/storage";

interface SavedUrlsSheetProps {
  visible: boolean;
  currentUrl?: string;
  onClose: () => void;
  onSelectUrl: (url: string) => void;
}

export const SavedUrlsSheet = ({
  visible,
  currentUrl,
  onClose,
  onSelectUrl,
}: SavedUrlsSheetProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const themedStyles = useThemedStyles(savedUrlsThemedStyles);
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const normalizedCurrentUrl = useMemo(() => {
    if (!currentUrl || !isYouTubeUrl(currentUrl)) return null;
    return normalizeYouTubeUrl(currentUrl);
  }, [currentUrl]);

  const isCurrentUrlSaved = Boolean(
    normalizedCurrentUrl && savedUrls.includes(normalizedCurrentUrl),
  );

  const loadSavedUrls = useCallback(async () => {
    setIsLoading(true);
    try {
      setSavedUrls(await getSavedYouTubeUrls());
    } catch {
      alert(t("common.error"), t("home.savedUrls.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (visible) {
      void loadSavedUrls();
    }
  }, [visible, loadSavedUrls]);

  const handleAddCurrentUrl = async () => {
    if (!normalizedCurrentUrl || isCurrentUrlSaved || isAdding || isLoading) {
      return;
    }

    setIsAdding(true);
    try {
      setSavedUrls(await addSavedYouTubeUrl(normalizedCurrentUrl));
    } catch {
      alert(t("common.error"), t("home.savedUrls.saveError"));
    } finally {
      setIsAdding(false);
    }
  };

  const deleteUrl = async (url: string) => {
    if (deletingUrl || isAdding) return;

    setDeletingUrl(url);
    try {
      setSavedUrls(await removeSavedYouTubeUrl(url));
    } catch {
      alert(t("common.error"), t("home.savedUrls.deleteError"));
    } finally {
      setDeletingUrl(null);
    }
  };

  const handleDeleteUrl = (url: string) => {
    if (deletingUrl || isAdding) return;
    confirmDestructive(
      t("home.savedUrls.deleteTitle"),
      t("home.savedUrls.deleteConfirm"),
      () => void deleteUrl(url),
      t("common.delete"),
      t("common.cancel"),
    );
  };

  const addButtonDisabled =
    !normalizedCurrentUrl ||
    isCurrentUrlSaved ||
    isAdding ||
    isLoading ||
    Boolean(deletingUrl);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t("home.savedUrls.title")}
      subtitle={t("home.savedUrls.subtitle", { count: savedUrls.length })}
      iconName="bookmark-multiple"
      maxHeightRatio={0.78}
      fixedHeight
    >
      <TouchableOpacity
        style={[
          styles.addButton,
          themedStyles.addButton,
          isCurrentUrlSaved && themedStyles.addButtonSaved,
          !normalizedCurrentUrl && themedStyles.addButtonUnavailable,
        ]}
        onPress={handleAddCurrentUrl}
        disabled={addButtonDisabled}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={
          isCurrentUrlSaved
            ? t("home.savedUrls.currentSaved")
            : t("home.savedUrls.addCurrent")
        }
        accessibilityState={{
          disabled: addButtonDisabled,
          selected: isCurrentUrlSaved,
        }}
      >
        <View
          style={[
            styles.addIcon,
            themedStyles.addIcon,
            isCurrentUrlSaved && themedStyles.addIconSaved,
          ]}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name={isCurrentUrlSaved ? "bookmark-check" : "bookmark-plus"}
              size={21}
              color={
                isCurrentUrlSaved
                  ? colors.success
                  : normalizedCurrentUrl
                    ? colors.primary
                    : colors.textMuted
              }
            />
          )}
        </View>
        <View style={styles.addButtonTextGroup}>
          <Text
            style={[
              themedStyles.addButtonText,
              isCurrentUrlSaved && themedStyles.addButtonTextSaved,
              !normalizedCurrentUrl && themedStyles.addButtonTextDisabled,
            ]}
          >
            {isCurrentUrlSaved
              ? t("home.savedUrls.currentSaved")
              : t("home.savedUrls.addCurrent")}
          </Text>
          <Text
            style={[
              themedStyles.currentUrlText,
              !normalizedCurrentUrl && themedStyles.currentUrlTextDisabled,
            ]}
            numberOfLines={1}
          >
            {normalizedCurrentUrl || t("home.savedUrls.unavailable")}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={isCurrentUrlSaved ? "check-circle" : "chevron-right"}
          size={21}
          color={
            isCurrentUrlSaved
              ? colors.success
              : normalizedCurrentUrl
                ? colors.primary
                : colors.textMuted
          }
        />
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : savedUrls.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={themedStyles.emptyIcon}>
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={30}
              color={colors.textMuted}
            />
          </View>
          <Text style={themedStyles.emptyTitle}>
            {t("home.savedUrls.emptyTitle")}
          </Text>
          <Text style={themedStyles.emptySubtitle}>
            {t("home.savedUrls.emptySubtitle")}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {savedUrls.map((url) => {
            const videoId = extractVideoId(url);
            const isCurrentItem = normalizedCurrentUrl === url;

            return (
              <View
                key={url}
                style={[
                  themedStyles.urlItem,
                  isCurrentItem && themedStyles.urlItemCurrent,
                ]}
              >
                <TouchableOpacity
                  style={styles.urlMainAction}
                  onPress={() => onSelectUrl(url)}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityLabel={url}
                >
                  {videoId ? (
                    <Image
                      source={{ uri: getThumbnailUrl(videoId) }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={themedStyles.thumbnailFallback}>
                      <MaterialCommunityIcons
                        name="youtube"
                        size={23}
                        color="#FF0000"
                      />
                    </View>
                  )}
                  <View style={styles.urlInfo}>
                    <Text
                      style={themedStyles.urlText}
                      numberOfLines={2}
                      ellipsizeMode="middle"
                    >
                      {url}
                    </Text>
                    <View style={styles.urlMetaRow}>
                      <MaterialCommunityIcons
                        name={isCurrentItem ? "bookmark-check" : "link-variant"}
                        size={13}
                        color={
                          isCurrentItem ? colors.primary : colors.textMuted
                        }
                      />
                      <Text style={themedStyles.urlMetaText} numberOfLines={1}>
                        {videoId || "youtube.com"}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, themedStyles.deleteButton]}
                  onPress={() => handleDeleteUrl(url)}
                  disabled={Boolean(deletingUrl) || isAdding}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityLabel={t("home.savedUrls.delete")}
                >
                  {deletingUrl === url ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={20}
                      color={colors.error}
                    />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  addButton: {
    minHeight: 72,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonTextGroup: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
    gap: 8,
  },
  urlMainAction: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 8,
  },
  thumbnail: {
    width: 88,
    height: 50,
    flexShrink: 0,
    borderRadius: 6,
    backgroundColor: "#111111",
  },
  urlInfo: { flex: 1, minWidth: 0 },
  urlMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  deleteButton: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

const savedUrlsThemedStyles = createThemedStyles((colors) => ({
  addButton: {
    backgroundColor: colors.primarySoft,
  },
  addButtonSaved: { backgroundColor: colors.successBg },
  addButtonUnavailable: { backgroundColor: colors.surfaceLight },
  addIcon: { backgroundColor: colors.surface },
  addIconSaved: { backgroundColor: colors.surface },
  addButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  addButtonTextSaved: { color: colors.success },
  addButtonTextDisabled: {
    color: colors.disabledText,
  },
  currentUrlText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  currentUrlTextDisabled: {
    color: colors.disabledText,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center" as const,
    marginTop: 6,
  },
  urlItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
  },
  urlItemCurrent: { backgroundColor: colors.primarySoft },
  thumbnailFallback: {
    width: 88,
    height: 50,
    flexShrink: 0,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  urlText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  urlMetaText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: "monospace",
  },
  deleteButton: { backgroundColor: colors.errorBg },
}));

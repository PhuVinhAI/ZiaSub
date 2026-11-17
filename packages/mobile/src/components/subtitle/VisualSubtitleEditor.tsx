import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import type { SubtitleItem } from "@src/types";
import {
  parseSRT,
  secondsToSrtTime,
  timeToSeconds,
} from "@utils/srtParser";
import { useTheme } from "@src/contexts";
import { createThemedStyles, useThemedStyles } from "@hooks/useThemedStyles";
import {
  alert,
  confirmDestructive,
  showAlert,
} from "@components/common/CustomAlert";

interface VisualSubtitleItem extends SubtitleItem {
  key: string;
}

interface VisualSubtitleEditorProps {
  value: string;
  currentTime: number;
  videoDuration?: number;
  onChange: (value: string) => void;
  onSeek: (seconds: number) => void;
  onDone: (value: string) => void;
  onDiscard: (value: string) => void;
}

const MIN_GAP_TO_OFFER = 0.4;
const DEFAULT_SUBTITLE_DURATION = 3;
const formatSrtTime = (seconds: number): string =>
  secondsToSrtTime(Math.max(0, Math.round(seconds * 1000) / 1000));

const serializeItems = (items: VisualSubtitleItem[]): string =>
  [...items]
    .sort((a, b) => a.startTime - b.startTime)
    .map(
      (item, index) =>
        `${index + 1}\n${formatSrtTime(item.startTime)} --> ${formatSrtTime(
          item.endTime,
        )}\n${item.text.trim()}`,
    )
    .join("\n\n");

const createInitialItems = (value: string): VisualSubtitleItem[] =>
  parseSRT(value)
    .sort((a, b) => a.startTime - b.startTime)
    .map((item, index) => ({
      ...item,
      id: String(index + 1),
      key: `subtitle-${index}-${item.startTime}-${item.endTime}`,
    }));

const formatDisplayTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const tenths = Math.floor((safeSeconds % 1) * 10);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${wholeSeconds
      .toString()
      .padStart(2, "0")}.${tenths}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${wholeSeconds
    .toString()
    .padStart(2, "0")}.${tenths}`;
};

const parseEditorTime = (value: string): number | null => {
  const normalized = value.trim().replace(".", ",");
  if (!/^\d{1,2}:\d{2}:\d{2},\d{3}$/.test(normalized)) return null;

  const seconds = timeToSeconds(normalized.padStart(12, "0"));
  return Number.isFinite(seconds) ? seconds : null;
};

const VisualSubtitleEditor: React.FC<VisualSubtitleEditorProps> = ({
  value,
  currentTime,
  videoDuration,
  onChange,
  onSeek,
  onDone,
  onDiscard,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(themedStyles);
  const listRef = useRef<FlatList<VisualSubtitleItem>>(null);
  const itemCounterRef = useRef(0);
  const lastFollowedIndexRef = useRef(-1);
  const initialValueRef = useRef(value);
  const initialSerializedValueRef = useRef(
    serializeItems(createInitialItems(value)),
  );

  const [items, setItems] = useState<VisualSubtitleItem[]>(() =>
    createInitialItems(value),
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editStart, setEditStart] = useState("00:00:00,000");
  const [editEnd, setEditEnd] = useState("00:00:03,000");
  const [followPlayback, setFollowPlayback] = useState(true);

  const activeIndex = useMemo(
    () =>
      items.findIndex(
        (item) =>
          currentTime >= item.startTime && currentTime <= item.endTime,
      ),
    [currentTime, items],
  );

  const focusedIndex = useMemo(() => {
    if (activeIndex >= 0) return activeIndex;
    if (items.length === 0) return -1;

    let nearestIndex = 0;
    for (let index = 0; index < items.length; index += 1) {
      if (items[index].startTime <= currentTime) nearestIndex = index;
      else break;
    }
    return nearestIndex;
  }, [activeIndex, currentTime, items]);

  useEffect(() => {
    if (
      !followPlayback ||
      editingKey ||
      focusedIndex < 0 ||
      focusedIndex === lastFollowedIndexRef.current
    ) {
      return;
    }

    lastFollowedIndexRef.current = focusedIndex;
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: focusedIndex,
        animated: true,
        viewPosition: 0.32,
      });
    }, 60);

    return () => clearTimeout(timer);
  }, [editingKey, focusedIndex, followPlayback]);

  const normalizeItems = useCallback(
    (nextItems: VisualSubtitleItem[]): VisualSubtitleItem[] =>
      [...nextItems]
        .sort((a, b) => a.startTime - b.startTime)
        .map((item, index) => ({ ...item, id: String(index + 1) })),
    [],
  );

  const commitItems = useCallback(
    (nextItems: VisualSubtitleItem[]) => {
      const normalized = normalizeItems(nextItems);
      setItems(normalized);
      onChange(serializeItems(normalized));
      return normalized;
    },
    [normalizeItems, onChange],
  );

  const beginEdit = useCallback(
    (item: VisualSubtitleItem) => {
      if (editingKey) return;
      setEditingKey(item.key);
      setCreatingKey(null);
      setEditText(item.text);
      setEditStart(formatSrtTime(item.startTime));
      setEditEnd(formatSrtTime(item.endTime));
      setFollowPlayback(false);
    },
    [editingKey],
  );

  const beginCreate = useCallback(
    (requestedStart: number, requestedEnd?: number) => {
      if (editingKey) return;
      const durationLimit = videoDuration && videoDuration > 0
        ? videoDuration
        : Number.POSITIVE_INFINITY;
      const maximumStart = Number.isFinite(durationLimit)
        ? Math.max(0, durationLimit - 0.1)
        : durationLimit;
      const startTime = Math.max(0, Math.min(requestedStart, maximumStart));
      const nextSubtitle = items.find((item) => item.startTime > startTime);
      const nextBoundary = nextSubtitle
        ? Math.max(startTime + 0.1, nextSubtitle.startTime - 0.05)
        : durationLimit;
      const preferredEnd = requestedEnd ?? startTime + DEFAULT_SUBTITLE_DURATION;
      const endTime = Math.max(
        startTime + 0.1,
        Math.min(preferredEnd, nextBoundary, durationLimit),
      );
      const key = `new-${Date.now()}-${itemCounterRef.current++}`;
      const newItem: VisualSubtitleItem = {
        id: String(items.length + 1),
        key,
        startTime,
        endTime,
        text: "",
      };

      setItems((currentItems) => normalizeItems([...currentItems, newItem]));
      setEditingKey(key);
      setCreatingKey(key);
      setEditText("");
      setEditStart(formatSrtTime(startTime));
      setEditEnd(formatSrtTime(endTime));
      setFollowPlayback(false);
    },
    [editingKey, items, normalizeItems, videoDuration],
  );

  const cancelEditing = useCallback(() => {
    Keyboard.dismiss();
    if (creatingKey) {
      setItems((currentItems) =>
        normalizeItems(currentItems.filter((item) => item.key !== creatingKey)),
      );
    }
    setEditingKey(null);
    setCreatingKey(null);
  }, [creatingKey, normalizeItems]);

  const buildEditedItems = useCallback((): VisualSubtitleItem[] | null => {
    if (!editingKey) return items;

    const startTime = parseEditorTime(editStart);
    const endTime = parseEditorTime(editEnd);
    if (
      startTime === null ||
      endTime === null ||
      startTime < 0 ||
      endTime <= startTime ||
      (videoDuration !== undefined && endTime > videoDuration + 0.05)
    ) {
      alert(
        t("subtitleModal.srt.visual.invalidTimeTitle"),
        t("subtitleModal.srt.visual.invalidTimeMessage"),
      );
      return null;
    }

    if (!editText.trim()) {
      alert(
        t("subtitleModal.srt.visual.emptyTextTitle"),
        t("subtitleModal.srt.visual.emptyTextMessage"),
      );
      return null;
    }

    return normalizeItems(
      items.map((item) =>
        item.key === editingKey
          ? { ...item, startTime, endTime, text: editText.trim() }
          : item,
      ),
    );
  }, [
    editEnd,
    editStart,
    editText,
    editingKey,
    items,
    normalizeItems,
    t,
    videoDuration,
  ]);

  const saveEditing = useCallback(() => {
    const nextItems = buildEditedItems();
    if (!nextItems) return;

    Keyboard.dismiss();
    commitItems(nextItems);
    setEditingKey(null);
    setCreatingKey(null);
  }, [buildEditedItems, commitItems]);

  const applyAndClose = useCallback(() => {
    const nextItems = buildEditedItems();
    if (!nextItems) return;

    Keyboard.dismiss();
    const normalized = normalizeItems(nextItems);
    const serialized = serializeItems(normalized);
    setItems(normalized);
    onChange(serialized);
    onDone(serialized);
  }, [buildEditedItems, normalizeItems, onChange, onDone]);

  const handleDone = useCallback(() => {
    const currentSerializedValue = serializeItems(
      normalizeItems(items.filter((item) => item.key !== creatingKey)),
    );
    const editingItem = editingKey
      ? items.find((item) => item.key === editingKey)
      : undefined;
    const pendingStart = editingKey ? parseEditorTime(editStart) : null;
    const pendingEnd = editingKey ? parseEditorTime(editEnd) : null;
    const hasPendingEditChanges =
      !!editingKey &&
      (creatingKey === editingKey ||
        !editingItem ||
        pendingStart === null ||
        pendingEnd === null ||
        Math.abs(pendingStart - editingItem.startTime) > 0.0005 ||
        Math.abs(pendingEnd - editingItem.endTime) > 0.0005 ||
        editText.trim() !== editingItem.text.trim());
    const hasChanges =
      currentSerializedValue !== initialSerializedValueRef.current ||
      hasPendingEditChanges;

    if (!hasChanges) {
      Keyboard.dismiss();
      onDone(initialValueRef.current);
      return;
    }

    showAlert(
      t("subtitleModal.srt.visual.applyChangesTitle"),
      t("subtitleModal.srt.visual.applyChangesMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("subtitleModal.srt.visual.discardChanges"),
          style: "destructive",
          onPress: () => {
            Keyboard.dismiss();
            onDiscard(initialValueRef.current);
          },
        },
        { text: t("common.apply"), onPress: applyAndClose },
      ],
      "warning",
    );
  }, [
    applyAndClose,
    creatingKey,
    editEnd,
    editStart,
    editText,
    editingKey,
    items,
    normalizeItems,
    onDiscard,
    onDone,
    t,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleDone();
        return true;
      },
    );
    return () => subscription.remove();
  }, [handleDone]);

  const deleteItem = useCallback(
    (item: VisualSubtitleItem) => {
      confirmDestructive(
        t("subtitleModal.srt.visual.deleteTitle"),
        t("subtitleModal.srt.visual.deleteMessage"),
        () => {
          if (editingKey === item.key) {
            setEditingKey(null);
            setCreatingKey(null);
          }
          commitItems(items.filter((currentItem) => currentItem.key !== item.key));
        },
        t("common.delete"),
        t("common.cancel"),
      );
    },
    [commitItems, editingKey, items, t],
  );

  const handleSeek = useCallback(
    (seconds: number) => {
      setFollowPlayback(true);
      lastFollowedIndexRef.current = -1;
      onSeek(seconds);
    },
    [onSeek],
  );

  const renderGapAction = useCallback(
    (startTime: number, endTime: number) => {
      if (editingKey || endTime - startTime < MIN_GAP_TO_OFFER) return null;
      return (
        <TouchableOpacity
          style={styles.gapAction}
          onPress={() => beginCreate(startTime + 0.05, endTime - 0.05)}
          accessibilityRole="button"
          accessibilityLabel={t("subtitleModal.srt.visual.addInGap")}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={15}
            color={colors.primary}
          />
          <Text style={styles.gapActionText}>
            {t("subtitleModal.srt.visual.addInGap")} · {formatDisplayTime(startTime)} –{" "}
            {formatDisplayTime(endTime)}
          </Text>
        </TouchableOpacity>
      );
    },
    [
      beginCreate,
      colors.primary,
      editingKey,
      styles.gapAction,
      styles.gapActionText,
      t,
    ],
  );

  const renderEditingItem = useCallback(
    (item: VisualSubtitleItem, index: number) => (
      <View style={styles.editCard}>
        <View style={styles.editCardHeader}>
          <Text style={styles.editCardTitle}>
            {t("subtitleModal.srt.visual.subtitleNumber", { number: index + 1 })}
          </Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleSeek(item.startTime)}
          >
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={21}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.timeEditorRow}>
          <View style={styles.timeFieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("subtitleModal.srt.visual.startTime")}
            </Text>
            <View style={styles.timeInputRow}>
              <TextInput
                style={styles.timeInput}
                value={editStart}
                onChangeText={setEditStart}
                keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
                selectionColor={colors.primary}
              />
              <TouchableOpacity
                style={styles.useCurrentButton}
                onPress={() => setEditStart(formatSrtTime(currentTime))}
                accessibilityLabel={t("subtitleModal.srt.visual.useCurrentTime")}
              >
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timeFieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("subtitleModal.srt.visual.endTime")}
            </Text>
            <View style={styles.timeInputRow}>
              <TextInput
                style={styles.timeInput}
                value={editEnd}
                onChangeText={setEditEnd}
                keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
                selectionColor={colors.primary}
              />
              <TouchableOpacity
                style={styles.useCurrentButton}
                onPress={() => setEditEnd(formatSrtTime(currentTime))}
                accessibilityLabel={t("subtitleModal.srt.visual.useCurrentTime")}
              >
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.fieldLabel}>
          {t("subtitleModal.srt.visual.subtitleText")}
        </Text>
        <TextInput
          style={styles.subtitleInput}
          value={editText}
          onChangeText={setEditText}
          multiline
          autoFocus
          textAlignVertical="top"
          placeholder={t("subtitleModal.srt.visual.textPlaceholder")}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
        />

        <View style={styles.editActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
            <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveEditButton} onPress={saveEditing}>
            <MaterialCommunityIcons
              name="check"
              size={18}
              color={colors.onPrimary}
            />
            <Text style={styles.saveEditButtonText}>{t("common.save")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      cancelEditing,
      colors.onPrimary,
      colors.primary,
      colors.textMuted,
      currentTime,
      editEnd,
      editStart,
      editText,
      handleSeek,
      saveEditing,
      styles,
      t,
    ],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: VisualSubtitleItem; index: number }) => {
      const previousEnd = index > 0 ? items[index - 1].endTime : 0;
      const isActive = index === activeIndex;
      return (
        <View style={styles.subtitleItemContainer}>
          {renderGapAction(previousEnd, item.startTime)}
          {editingKey === item.key ? (
            renderEditingItem(item, index)
          ) : (
            <TouchableOpacity
              style={[styles.subtitleCard, isActive && styles.subtitleCardActive]}
              onPress={() => handleSeek(item.startTime)}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={t("subtitleModal.srt.visual.seekToSubtitle")}
            >
              <View
                style={[
                  styles.subtitleNumber,
                  isActive && styles.subtitleNumberActive,
                ]}
              >
                {isActive ? (
                  <MaterialCommunityIcons
                    name="play"
                    size={14}
                    color={colors.onPrimary}
                  />
                ) : (
                  <Text style={styles.subtitleNumberText}>{index + 1}</Text>
                )}
              </View>

              <View style={styles.subtitleBody}>
                <Text
                  style={[styles.timeRange, isActive && styles.timeRangeActive]}
                >
                  {formatDisplayTime(item.startTime)} – {formatDisplayTime(item.endTime)}
                </Text>
                <Text style={styles.subtitleText}>{item.text}</Text>
              </View>

              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={[
                    styles.rowActionButton,
                    editingKey && styles.actionDisabled,
                  ]}
                  onPress={() => beginEdit(item)}
                  disabled={!!editingKey}
                  accessibilityLabel={t("common.edit")}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.rowActionButton,
                    editingKey && styles.actionDisabled,
                  ]}
                  onPress={() => deleteItem(item)}
                  disabled={!!editingKey}
                  accessibilityLabel={t("common.delete")}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [
      activeIndex,
      beginEdit,
      colors.error,
      colors.onPrimary,
      colors.primary,
      deleteItem,
      editingKey,
      handleSeek,
      items,
      renderEditingItem,
      renderGapAction,
      styles,
      t,
    ],
  );

  const lastItem = items[items.length - 1];
  const footerGap =
    lastItem && videoDuration
      ? renderGapAction(lastItem.endTime, videoDuration)
      : null;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior="height"
      automaticOffset
    >
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.title} numberOfLines={1}>
              {t("subtitleModal.srt.visual.title")}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {t("subtitleModal.srt.visual.meta", { count: items.length })} ·{" "}
              {formatDisplayTime(currentTime)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.headerButton, followPlayback && styles.headerButtonActive]}
            onPress={() => {
              setFollowPlayback((current) => !current);
              lastFollowedIndexRef.current = -1;
            }}
            accessibilityLabel={t("subtitleModal.srt.visual.followPlayback")}
          >
            <MaterialCommunityIcons
              name={followPlayback ? "crosshairs-gps" : "crosshairs"}
              size={20}
              color={followPlayback ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, editingKey && styles.actionDisabled]}
            onPress={() => beginCreate(currentTime)}
            disabled={!!editingKey}
            accessibilityLabel={t("subtitleModal.srt.visual.addAtCurrent")}
          >
            <MaterialCommunityIcons
              name="plus"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            accessibilityLabel={t("common.done")}
          >
            <MaterialCommunityIcons
              name="check"
              size={21}
              color={colors.onPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.nowBar}>
          <MaterialCommunityIcons name="play" size={15} color={colors.primary} />
          <Text style={styles.nowText}>
            {activeIndex >= 0
              ? t("subtitleModal.srt.visual.playingSubtitle", {
                  number: activeIndex + 1,
                })
              : t("subtitleModal.srt.visual.noSubtitleAtCurrentTime")}
          </Text>
          <TouchableOpacity
            style={[styles.addNowButton, editingKey && styles.actionDisabled]}
            onPress={() => beginCreate(currentTime)}
            disabled={!!editingKey}
          >
            <Text style={styles.addNowButtonText}>
              {t("subtitleModal.srt.visual.addAtCurrent")}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.emptyListContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setFollowPlayback(false)}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              offset: Math.max(0, info.averageItemLength * info.index),
              animated: true,
            });
          }}
          ListFooterComponent={footerGap ?? undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name="subtitles-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {t("subtitleModal.srt.visual.emptyTitle")}
              </Text>
              <Text style={styles.emptyDescription}>
                {t("subtitleModal.srt.visual.emptyDescription")}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => beginCreate(currentTime)}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={19}
                  color={colors.onPrimary}
                />
                <Text style={styles.emptyAddButtonText}>
                  {t("subtitleModal.srt.visual.addAtCurrent")}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const themedStyles = createThemedStyles((colors) => ({
  keyboardView: { flex: 1, backgroundColor: colors.surface },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden" as const,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  dragHandle: {
    width: 38,
    height: 4,
    alignSelf: "center" as const,
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 5,
    backgroundColor: colors.border,
  },
  header: {
    minHeight: 54,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    paddingHorizontal: 12,
    paddingBottom: 7,
  },
  headerTitleGroup: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 16, fontWeight: "800" as const },
  meta: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  headerButton: {
    width: 38,
    height: 38,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
  },
  headerButtonActive: { backgroundColor: colors.primarySoft },
  doneButton: {
    width: 40,
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  nowBar: {
    minHeight: 38,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 7,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
  nowText: { flex: 1, color: colors.textSecondary, fontSize: 11, fontWeight: "600" as const },
  addNowButton: { paddingHorizontal: 7, paddingVertical: 5 },
  addNowButtonText: { color: colors.primary, fontSize: 10, fontWeight: "800" as const },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24 },
  emptyListContent: { flexGrow: 1, justifyContent: "center" as const },
  subtitleItemContainer: { paddingBottom: 8 },
  subtitleCard: {
    minHeight: 70,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 13,
    backgroundColor: colors.surfaceLight,
  },
  subtitleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  subtitleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.surfaceElevated,
  },
  subtitleNumberActive: { backgroundColor: colors.primary },
  subtitleNumberText: { color: colors.textMuted, fontSize: 10, fontWeight: "800" as const },
  subtitleBody: { flex: 1, minWidth: 0 },
  timeRange: { color: colors.textMuted, fontSize: 10, fontWeight: "700" as const },
  timeRangeActive: { color: colors.primary },
  subtitleText: { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 4 },
  rowActions: { flexDirection: "row" as const, alignItems: "center" as const, gap: 2 },
  rowActionButton: {
    width: 34,
    height: 38,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  actionDisabled: { opacity: 0.35 },
  gapAction: {
    minHeight: 30,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    alignSelf: "center" as const,
    gap: 5,
    paddingHorizontal: 10,
    marginVertical: 4,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  gapActionText: { color: colors.primary, fontSize: 9, fontWeight: "700" as const },
  editCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
  },
  editCardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 9,
  },
  editCardTitle: { color: colors.text, fontSize: 13, fontWeight: "800" as const },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
  },
  timeEditorRow: { flexDirection: "row" as const, gap: 8, marginBottom: 10 },
  timeFieldGroup: { flex: 1, minWidth: 0 },
  fieldLabel: { color: colors.textMuted, fontSize: 9, fontWeight: "700" as const, marginBottom: 4 },
  timeInputRow: {
    height: 40,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.inputBackground,
  },
  timeInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    paddingVertical: 0,
    color: colors.text,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  useCurrentButton: {
    width: 34,
    height: 38,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  subtitleInput: {
    minHeight: 82,
    maxHeight: 150,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  editActions: {
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    gap: 8,
    marginTop: 10,
  },
  cancelButton: {
    minHeight: 38,
    justifyContent: "center" as const,
    paddingHorizontal: 15,
    borderRadius: 9,
    backgroundColor: colors.surfaceElevated,
  },
  cancelButtonText: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" as const },
  saveEditButton: {
    minHeight: 38,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: colors.primary,
  },
  saveEditButtonText: { color: colors.onPrimary, fontSize: 11, fontWeight: "800" as const },
  emptyState: { alignItems: "center" as const, paddingHorizontal: 28, paddingVertical: 30 },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.primarySoft,
  },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "800" as const, marginTop: 13 },
  emptyDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: "center" as const, marginTop: 5 },
  emptyAddButton: {
    minHeight: 42,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 16,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  emptyAddButtonText: { color: colors.onPrimary, fontSize: 12, fontWeight: "800" as const },
}));

export default VisualSubtitleEditor;

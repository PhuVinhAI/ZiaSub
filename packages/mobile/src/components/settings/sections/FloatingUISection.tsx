import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme, useUpdate } from "@src/contexts";
import { useThemedStyles, createThemedStyles } from "@hooks/useThemedStyles";
import type { FloatingUISettings } from "@src/types";
import { queueManager } from "@services/queueManager";
import { ControlSlider, SegmentedTabs } from "@components/common";
import {
  SettingsCard,
  SettingsSectionHeader,
} from "../SettingsPrimitives";

interface FloatingUISectionProps {
  floatingUISettings: FloatingUISettings;
  onFloatingUIChange: (settings: FloatingUISettings) => void;
}

type PreviewMode = "home" | "video";
type VideoPreviewState =
  | "idle"
  | "subtitles"
  | "translating"
  | "waiting"
  | "paused";

const FloatingUISection: React.FC<FloatingUISectionProps> = ({
  floatingUISettings,
  onFloatingUIChange,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { hasUpdate } = useUpdate();
  const themedStyles = useThemedStyles(sectionThemedStyles);
  const [draft, setDraft] = useState(floatingUISettings);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("home");
  const [videoPreviewState, setVideoPreviewState] =
    useState<VideoPreviewState>("idle");
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    setDraft(floatingUISettings);
  }, [floatingUISettings]);

  useEffect(() => {
    queueManager.initialize();
    return queueManager.subscribe(() => {
      const counts = queueManager.getCounts();
      setQueueCount(counts.pending + counts.translating);
    });
  }, []);

  const updateDraft = <K extends keyof FloatingUISettings>(
    key: K,
    value: FloatingUISettings[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const commitSetting = <K extends keyof FloatingUISettings>(
    key: K,
    value: FloatingUISettings[K]
  ) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onFloatingUIChange(next);
  };

  const activeBottomOffset =
    previewMode === "video" ? draft.bottomOffsetVideo : draft.bottomOffset;
  const previewBottom = Math.min(Math.max(activeBottomOffset * 0.55, 8), 145);
  const previewSide = Math.min(Math.max(draft.sideOffset * 0.65, 6), 34);
  const isRight = draft.position === "right";
  const isHorizontal = draft.layout === "horizontal";

  const renderPreviewFab = ({
    icon,
    size = 40,
    iconSize = 20,
    active = false,
    badge,
    updateDot = false,
    tone = "default",
  }: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    size?: number;
    iconSize?: number;
    active?: boolean;
    badge?: string;
    updateDot?: boolean;
    tone?: "default" | "primary" | "warning" | "muted";
  }) => {
    const toneColor =
      tone === "warning"
        ? colors.warning
        : tone === "muted"
        ? colors.textMuted
        : colors.primary;
    const isStatus = tone !== "default";
    const faceBackground = active ? colors.primary : colors.surface;
    const faceBorder = active
      ? colors.primaryDark
      : isStatus
      ? toneColor
      : isDark
      ? colors.border
      : colors.borderLight;
    const shadowColor = active
      ? colors.primaryDark
      : isDark
      ? colors.background
      : colors.border;
    const iconColor = active
      ? colors.onPrimary
      : isStatus
      ? toneColor
      : colors.text;

    return (
      <View
        style={[
          styles.previewFabWrapper,
          { width: size, height: size + 4 },
        ]}
      >
        {isStatus && tone !== "muted" && (
          <View
            style={[
              styles.previewFabGlow,
              {
                width: size + 8,
                height: size + 8,
                borderRadius: (size + 8) * 0.3,
                borderColor: toneColor,
              },
            ]}
          />
        )}
        <View
          style={[
            styles.previewFabShadow,
            {
              width: size,
              height: size,
              borderRadius: size * 0.3,
              backgroundColor: shadowColor,
            },
          ]}
        />
        <View
          style={[
            styles.previewFabFace,
            {
              width: size,
              height: size,
              borderRadius: size * 0.3,
              backgroundColor: faceBackground,
              borderColor: faceBorder,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={iconSize}
            color={iconColor}
          />
        </View>
        {updateDot && (
          <View
            style={[
              styles.previewUpdateDot,
              {
                backgroundColor: colors.error,
                borderColor: colors.surface,
              },
            ]}
          />
        )}
        {badge && (
          <View
            style={[
              styles.previewBadge,
              {
                backgroundColor:
                  tone === "warning"
                    ? colors.warning
                    : tone === "muted"
                    ? colors.textMuted
                    : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.previewBadgeText,
                {
                  color:
                    tone === "warning"
                      ? colors.onWarning
                      : tone === "muted"
                      ? colors.onPrimary
                      : colors.onPrimary,
                },
              ]}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSubtitlePreviewButton = () => {
    switch (videoPreviewState) {
      case "subtitles":
        return renderPreviewFab({
          icon: "subtitles",
          size: 52,
          iconSize: 26,
          active: true,
        });
      case "translating":
        return renderPreviewFab({
          icon: "creation",
          size: 52,
          iconSize: 26,
          tone: "primary",
          badge: "2/5",
        });
      case "waiting":
        return renderPreviewFab({
          icon: "clock-outline",
          size: 52,
          iconSize: 26,
          tone: "warning",
          badge: "#2",
        });
      case "paused":
        return renderPreviewFab({
          icon: "pause",
          size: 52,
          iconSize: 26,
          tone: "muted",
          badge: "2/5",
        });
      default:
        return renderPreviewFab({
          icon: "subtitles-outline",
          size: 52,
          iconSize: 26,
        });
    }
  };

  const renderPreviewFloatingButtons = () => {
    const queueBadge =
      queueCount > 0 ? (queueCount > 99 ? "99+" : String(queueCount)) : undefined;
    const isQueuedState =
      videoPreviewState === "waiting" || videoPreviewState === "paused";

    return (
      <>
        <View
          style={[
            styles.previewFabGroup,
            isHorizontal && styles.previewFabGroupHorizontal,
            {
              bottom: previewBottom,
              ...(isRight
                ? { left: previewSide }
                : { right: previewSide }),
            },
          ]}
        >
          {renderPreviewFab({
            icon: "cog",
            updateDot: hasUpdate,
          })}
          <View
            style={
              isHorizontal
                ? styles.previewQueueGroupHorizontal
                : styles.previewQueueGroup
            }
          >
            {renderPreviewFab({
              icon: "playlist-play",
              badge: queueBadge,
            })}
            {previewMode === "video" &&
              renderPreviewFab({
                icon: isQueuedState ? "playlist-check" : "playlist-plus",
                active: isQueuedState,
              })}
          </View>
        </View>

        <View
          style={[
            styles.previewFabGroup,
            isHorizontal && styles.previewFabGroupHorizontal,
            {
              bottom: previewBottom,
              ...(isRight
                ? { right: previewSide }
                : { left: previewSide }),
            },
          ]}
        >
          {renderPreviewFab({ icon: "robot-outline" })}
          {previewMode === "home" && renderPreviewFab({ icon: "history" })}
          {previewMode === "video" && renderSubtitlePreviewButton()}
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View>
        <SettingsSectionHeader
          icon="monitor-dashboard"
          title={t("settings.floatingUI.previewTitle")}
          description={t("settings.floatingUI.previewDescription")}
        />
        <SegmentedTabs<PreviewMode>
          value={previewMode}
          onChange={setPreviewMode}
          style={styles.previewTabs}
          items={[
            {
              key: "home",
              label: t("settings.floatingUI.previewHome"),
              icon: "home-outline",
            },
            {
              key: "video",
              label: t("settings.floatingUI.previewVideo"),
              icon: "play-box-outline",
            },
          ]}
        />

        {previewMode === "video" && (
          <View style={styles.stateSelector}>
            <Text style={themedStyles.stateSelectorLabel}>
              {t("settings.floatingUI.subtitleState")}
            </Text>
            <View style={styles.stateChips}>
              {(
                [
                  ["idle", "settings.floatingUI.stateIdle"],
                  ["subtitles", "settings.floatingUI.stateSubtitles"],
                  ["translating", "settings.floatingUI.stateTranslating"],
                  ["waiting", "settings.floatingUI.stateWaiting"],
                  ["paused", "settings.floatingUI.statePaused"],
                ] as const
              ).map(([state, labelKey]) => {
                const selected = videoPreviewState === state;
                return (
                  <TouchableOpacity
                    key={state}
                    style={[
                      styles.stateChip,
                      themedStyles.stateChip,
                      selected && themedStyles.stateChipActive,
                    ]}
                    onPress={() => setVideoPreviewState(state)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        themedStyles.stateChipText,
                        selected && themedStyles.stateChipTextActive,
                      ]}
                    >
                      {t(labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={[styles.preview, themedStyles.preview]}>
          <View
            style={[styles.previewBrowserBar, themedStyles.previewBrowserBar]}
          >
            <View style={styles.browserActions}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={14}
                color={colors.textMuted}
              />
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color={colors.textMuted}
              />
              <MaterialCommunityIcons
                name="reload"
                size={14}
                color={colors.text}
              />
            </View>
            <View style={[styles.previewAddress, themedStyles.previewAddress]}>
              <MaterialCommunityIcons
                name="magnify"
                size={12}
                color={colors.textMuted}
              />
              <Text style={themedStyles.previewAddressText} numberOfLines={1}>
                {previewMode === "video"
                  ? "m.youtube.com/watch"
                  : "m.youtube.com"}
              </Text>
            </View>
            <View style={styles.previewBrand}>
              <View style={[styles.previewLogo, themedStyles.previewLogo]}>
                <MaterialCommunityIcons
                  name="subtitles"
                  size={9}
                  color={colors.onPrimary}
                />
              </View>
              <Text style={themedStyles.previewBrandText}>Zia</Text>
            </View>
            <MaterialCommunityIcons
              name="creation"
              size={15}
              color={colors.primary}
            />
          </View>

          <View style={styles.previewCanvas}>
            {previewMode === "home" ? (
              <View style={styles.homeFeed}>
                {[0, 1].map((item) => (
                  <View key={item} style={styles.feedItem}>
                    <View
                      style={[
                        styles.feedThumbnail,
                        themedStyles.feedThumbnail,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item === 0 ? "play-circle-outline" : "youtube"}
                        size={27}
                        color={item === 0 ? colors.primary : colors.error}
                      />
                      <View style={[styles.durationBadge, themedStyles.durationBadge]}>
                        <Text style={themedStyles.durationText}>
                          {item === 0 ? "12:48" : "08:21"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.feedMeta}>
                      <View
                        style={[styles.feedAvatar, themedStyles.feedAvatar]}
                      />
                      <View style={styles.videoLines}>
                        <View
                          style={[styles.videoLineLong, themedStyles.videoLine]}
                        />
                        <View
                          style={[styles.videoLineShort, themedStyles.videoLine]}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.videoPage}>
                <View style={[styles.videoPlayer, themedStyles.videoPlayer]}>
                  <MaterialCommunityIcons
                    name="play"
                    size={32}
                    color="rgba(255,255,255,0.82)"
                  />
                  <View style={styles.playerProgress}>
                    <View
                      style={[
                        styles.playerProgressActive,
                        { backgroundColor: colors.error },
                      ]}
                    />
                  </View>
                  <View style={styles.playerControls}>
                    <MaterialCommunityIcons
                      name="volume-high"
                      size={13}
                      color="#FFFFFF"
                    />
                    <Text style={styles.playerTime}>03:18 / 12:48</Text>
                    <MaterialCommunityIcons
                      name="fullscreen"
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
                <View style={styles.videoDetails}>
                  <View
                    style={[styles.videoTitleLine, themedStyles.videoLine]}
                  />
                  <View
                    style={[styles.videoSubtitleLine, themedStyles.videoLine]}
                  />
                </View>
              </View>
            )}

            <View
              style={[
                styles.previewOffsetGuide,
                themedStyles.previewOffsetGuide,
                {
                  bottom: previewBottom,
                  ...(isRight ? { right: 0 } : { left: 0 }),
                },
              ]}
            >
              <Text style={themedStyles.previewOffsetText}>
                {activeBottomOffset}px
              </Text>
            </View>

            {renderPreviewFloatingButtons()}

            <View
              style={[styles.previewSafeArea, themedStyles.previewSafeArea]}
            >
              <Text style={themedStyles.previewSafeAreaText}>
                {t("settings.floatingUI.screenBottom")}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.previewNote, themedStyles.previewNote]}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={themedStyles.previewNoteText}>
            {previewMode === "home"
              ? t("settings.floatingUI.previewHomeHint")
              : t("settings.floatingUI.previewVideoHint")}
          </Text>
        </View>
      </View>

      <View>
        <SettingsSectionHeader
          icon="arrow-collapse"
          title={t("settings.floatingUI.spacingTitle")}
          description={t("settings.floatingUI.spacingDescription")}
        />
        <SettingsCard>
          <ControlSlider
            label={t("settings.floatingUI.homeBottomOffset")}
            description={t("settings.floatingUI.bottomOffsetHint")}
            icon="home-outline"
            minimumValue={20}
            maximumValue={200}
            step={5}
            value={draft.bottomOffset}
            formatValue={(value) => `${Math.round(value)} px`}
            minimumLabel="20 px"
            maximumLabel="200 px"
            onValueChange={(value) => updateDraft("bottomOffset", value)}
            onSlidingComplete={(value) => commitSetting("bottomOffset", value)}
          />

          <View style={[styles.divider, themedStyles.divider]} />

          <ControlSlider
            label={t("settings.floatingUI.videoBottomOffset")}
            description={t("settings.floatingUI.bottomOffsetVideoHint")}
            icon="play-box-outline"
            minimumValue={10}
            maximumValue={150}
            step={5}
            value={draft.bottomOffsetVideo}
            formatValue={(value) => `${Math.round(value)} px`}
            minimumLabel="10 px"
            maximumLabel="150 px"
            onValueChange={(value) => updateDraft("bottomOffsetVideo", value)}
            onSlidingComplete={(value) =>
              commitSetting("bottomOffsetVideo", value)
            }
          />

          <View style={[styles.divider, themedStyles.divider]} />

          <ControlSlider
            label={t("settings.floatingUI.sideSpacing")}
            description={t("settings.floatingUI.sideOffsetHint")}
            icon="arrow-left-right"
            minimumValue={8}
            maximumValue={50}
            step={2}
            value={draft.sideOffset}
            formatValue={(value) => `${Math.round(value)} px`}
            minimumLabel="8 px"
            maximumLabel="50 px"
            onValueChange={(value) => updateDraft("sideOffset", value)}
            onSlidingComplete={(value) => commitSetting("sideOffset", value)}
          />
        </SettingsCard>
      </View>

      <View>
        <SettingsSectionHeader
          icon="view-dashboard-outline"
          title={t("settings.floatingUI.arrangementTitle")}
          description={t("settings.floatingUI.arrangementDescription")}
        />
        <SettingsCard>
          <Text style={themedStyles.groupLabel}>
            {t("settings.floatingUI.position")}
          </Text>
          <View style={styles.optionRow}>
            <OptionButton
              icon="format-horizontal-align-left"
              label={t("settings.floatingUI.positionLeft")}
              selected={draft.position === "left"}
              onPress={() => commitSetting("position", "left")}
            />
            <OptionButton
              icon="format-horizontal-align-right"
              label={t("settings.floatingUI.positionRight")}
              selected={draft.position === "right"}
              onPress={() => commitSetting("position", "right")}
            />
          </View>

          <View style={[styles.divider, themedStyles.divider]} />

          <Text style={themedStyles.groupLabel}>
            {t("settings.floatingUI.layout")}
          </Text>
          <View style={styles.optionRow}>
            <OptionButton
              icon="view-sequential-outline"
              label={t("settings.floatingUI.layoutVertical")}
              selected={draft.layout === "vertical"}
              onPress={() => commitSetting("layout", "vertical")}
            />
            <OptionButton
              icon="view-column-outline"
              label={t("settings.floatingUI.layoutHorizontal")}
              selected={draft.layout === "horizontal"}
              onPress={() => commitSetting("layout", "horizontal")}
            />
          </View>
        </SettingsCard>
      </View>
    </View>
  );

  function OptionButton({
    icon,
    label,
    selected,
    onPress,
  }: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    selected: boolean;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        style={[
          styles.optionButton,
          themedStyles.optionButton,
          selected && themedStyles.optionButtonActive,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.optionIcon,
            selected
              ? themedStyles.optionIconActive
              : themedStyles.optionIcon,
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={selected ? colors.primary : colors.textMuted}
          />
        </View>
        <Text
          style={[
            themedStyles.optionLabel,
            selected && themedStyles.optionLabelActive,
          ]}
        >
          {label}
        </Text>
        <MaterialCommunityIcons
          name={selected ? "check-circle" : "circle-outline"}
          size={19}
          color={selected ? colors.primary : colors.border}
        />
      </TouchableOpacity>
    );
  }
};

const styles = StyleSheet.create({
  container: { gap: 26 },
  previewTabs: { marginBottom: 10 },
  stateSelector: { marginBottom: 10 },
  stateChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 7,
  },
  stateChip: {
    minHeight: 32,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 11,
  },
  preview: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  previewBrowserBar: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 8,
  },
  browserActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  previewAddress: {
    flex: 1,
    height: 27,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 7,
  },
  previewBrand: { flexDirection: "row", alignItems: "center", gap: 3 },
  previewLogo: {
    width: 17,
    height: 17,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  previewCanvas: { height: 330, position: "relative", overflow: "hidden" },
  homeFeed: { padding: 12, gap: 12 },
  feedItem: { gap: 7 },
  feedThumbnail: {
    height: 92,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  durationBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  feedMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedAvatar: { width: 26, height: 26, borderRadius: 13 },
  videoLines: { gap: 7 },
  videoLineLong: { width: 140, height: 8, borderRadius: 4 },
  videoLineShort: { width: 88, height: 7, borderRadius: 4 },
  videoPage: { padding: 12 },
  videoPlayer: {
    height: 164,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  playerProgress: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 27,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  playerProgressActive: { width: "26%", height: 3 },
  playerControls: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playerTime: { flex: 1, color: "#FFFFFF", fontSize: 8 },
  videoDetails: { gap: 8, marginTop: 12 },
  videoTitleLine: { width: "82%", height: 9, borderRadius: 5 },
  videoSubtitleLine: { width: "48%", height: 7, borderRadius: 4 },
  previewFabGroup: {
    position: "absolute",
    alignItems: "center",
    gap: 10,
    zIndex: 4,
  },
  previewFabGroupHorizontal: { flexDirection: "row" },
  previewQueueGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewQueueGroupHorizontal: {
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  previewFabWrapper: { position: "relative" },
  previewFabGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    borderWidth: 2,
    opacity: 0.28,
  },
  previewFabShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  previewFabFace: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  previewUpdateDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  previewBadge: {
    position: "absolute",
    top: -4,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  previewBadgeText: { fontSize: 8, fontWeight: "700" },
  previewOffsetGuide: {
    position: "absolute",
    width: 46,
    height: 1,
    borderTopWidth: 1,
    borderStyle: "dashed",
    zIndex: 2,
  },
  previewSafeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  previewNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderRadius: 11,
    padding: 10,
    marginTop: 9,
  },
  divider: { height: 1, marginVertical: 18 },
  optionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  optionButton: {
    flex: 1,
    minHeight: 116,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

const sectionThemedStyles = createThemedStyles((colors) => ({
  stateSelectorLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  stateChip: { backgroundColor: colors.surface },
  stateChipActive: {
    backgroundColor: colors.primarySoft,
  },
  stateChipText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  stateChipTextActive: { color: colors.primary },
  preview: { backgroundColor: colors.surface, borderColor: colors.border },
  previewBrowserBar: { backgroundColor: colors.surfaceLight },
  previewAddress: { backgroundColor: colors.surfaceElevated },
  previewAddressText: { flex: 1, color: colors.textMuted, fontSize: 9 },
  previewLogo: { backgroundColor: colors.primary },
  previewBrandText: { color: colors.primary, fontSize: 10, fontWeight: "700" },
  feedThumbnail: { backgroundColor: colors.surfaceLight },
  durationBadge: { backgroundColor: colors.scrim },
  durationText: { color: "#FFFFFF", fontSize: 8, fontWeight: "600" },
  feedAvatar: { backgroundColor: colors.border },
  videoLine: { backgroundColor: colors.border },
  videoPlayer: { backgroundColor: colors.previewBg },
  previewOffsetGuide: { borderTopColor: colors.primary },
  previewOffsetText: {
    position: "absolute",
    top: -16,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "700",
  },
  previewSafeArea: { backgroundColor: colors.primarySoft },
  previewSafeAreaText: { color: colors.primary, fontSize: 7 },
  previewNote: { backgroundColor: colors.primarySoft },
  previewNoteText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  label: { fontSize: 14, color: colors.text, fontWeight: "600" },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 4,
  },
  divider: { backgroundColor: colors.border },
  groupLabel: { color: colors.text, fontSize: 14, fontWeight: "700" },
  optionButton: { backgroundColor: colors.surfaceLight },
  optionButtonActive: {
    backgroundColor: colors.primarySoft,
  },
  optionIcon: { backgroundColor: colors.surface },
  optionIconActive: { backgroundColor: colors.surface },
  optionLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  optionLabelActive: { color: colors.primary },
}));

export default FloatingUISection;

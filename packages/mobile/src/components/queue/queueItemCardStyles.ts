/**
 * Queue Item Card Styles
 *
 * Tách từ QueueItemCard.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { createThemedStyles } from "@hooks/useThemedStyles";

export const queueItemCardStyles = createThemedStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative" as const,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    minHeight: 80,
  },
  progressBarContainer: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.border,
  },
  progressBar: {
    height: "100%" as const,
    borderRadius: 2,
  },
  thumbnailContainer: {
    position: "relative" as const,
    width: 120,
    height: 68,
    margin: 6,
    borderRadius: 8,
    overflow: "hidden" as const,
  },
  thumbnail: {
    width: "100%" as const,
    height: "100%" as const,
    backgroundColor: colors.surfaceLight,
  },
  durationBadge: {
    position: "absolute" as const,
    bottom: 4,
    right: 4,
    backgroundColor: colors.scrim,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600" as const,
  },
  statusBadge: {
    position: "absolute" as const,
    top: 4,
    left: 4,
    borderRadius: 4,
    padding: 4,
  },
  info: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 4,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  configRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flexWrap: "wrap" as const,
    marginTop: 2,
    gap: 4,
  },
  configText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  presetBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.primarySoft,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    gap: 2,
  },
  presetBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "500" as const,
  },
  settingsBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    gap: 2,
  },
  settingsBadgeText: {
    color: colors.textMuted,
    fontSize: 9,
  },
  footer: {
    marginTop: 4,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  actions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingRight: 8,
    gap: 2,
  },
  actionBtn: {
    padding: 6,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
}));

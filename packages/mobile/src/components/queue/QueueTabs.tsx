import React from "react";
import { useTranslation } from "react-i18next";
import { SegmentedTabs } from "@components/common";

export type TabType = "pending" | "translating" | "paused" | "completed";

interface QueueTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts: {
    pending: number;
    translating: number;
    paused: number;
    completed: number;
    error: number;
  };
}

const QueueTabs: React.FC<QueueTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const { t } = useTranslation();
  const pendingCount = counts.pending + counts.error;

  return (
    <SegmentedTabs<TabType>
      value={activeTab}
      onChange={onTabChange}
      scrollable
      equalWidth={false}
      compact
      style={{ marginHorizontal: 12, marginTop: 10, marginBottom: 10 }}
      items={[
        {
          key: "pending",
          label: t("queue.tabs.pending"),
          icon: "clock-outline",
          badge: pendingCount || undefined,
          badgeTone: counts.error > 0 ? "error" : "primary",
        },
        {
          key: "translating",
          label: t("queue.tabs.translating"),
          icon: "translate",
          badge: counts.translating || undefined,
          badgeTone: "warning",
        },
        {
          key: "paused",
          label: t("queue.tabs.paused"),
          icon: "pause",
          badge: counts.paused || undefined,
          badgeTone: "muted",
        },
        {
          key: "completed",
          label: t("queue.tabs.completed"),
          icon: "check-circle-outline",
          badge: counts.completed || undefined,
          badgeTone: "success",
        },
      ]}
    />
  );
};

export default QueueTabs;

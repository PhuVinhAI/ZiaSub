/**
 * TranslateTab Utilities — SRT Formatting Helpers
 *
 * Tách từ TranslateTab.tsx — chứa các hàm format SRT time và rebuild SRT.
 * Chỉ di chuyển code, không sửa đổi logic.
 */

// Helper to format SRT time
export const formatSrtTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms
    .toString()
    .padStart(3, "0")}`;
};

// Helper to rebuild SRT from subtitles
export const rebuildSrt = (
  subtitles: Array<{ startTime: number; endTime: number; text: string }>
): string => {
  let srt = "";
  subtitles.forEach((sub, idx) => {
    srt += `${idx + 1}\n${formatSrtTime(sub.startTime)} --> ${formatSrtTime(
      sub.endTime
    )}\n${sub.text}\n\n`;
  });
  return srt;
};

/**
 * useAdvancedOptions — advanced translation options form (streaming / presub / custom range)
 *
 * Tách từ TranslateTab.tsx — chỉ di chuyển code, không sửa đổi logic.
 */
import { useState, useEffect } from "react";
import type { BatchSettings } from "@src/types";

interface UseAdvancedOptionsParams {
  batchSettings?: BatchSettings;
  onBatchSettingsChange?: (settings: BatchSettings) => void;
}

export function useAdvancedOptions({
  batchSettings,
  onBatchSettingsChange,
}: UseAdvancedOptionsParams) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [streamingMode, setStreamingMode] = useState(
    batchSettings?.streamingMode ?? false
  );
  const [presubMode, setPresubMode] = useState(
    batchSettings?.presubMode ?? false
  );
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [rangeStartStr, setRangeStartStr] = useState("");
  const [rangeEndStr, setRangeEndStr] = useState("");

  useEffect(() => {
    if (batchSettings) {
      setStreamingMode(batchSettings.streamingMode ?? false);
      setPresubMode(batchSettings.presubMode ?? false);
    }
  }, [batchSettings]);

  const handleStreamingModeChange = (value: boolean) => {
    setStreamingMode(value);
    if (batchSettings && onBatchSettingsChange)
      onBatchSettingsChange({ ...batchSettings, streamingMode: value });
  };
  const handlePresubModeChange = (value: boolean) => {
    setPresubMode(value);
    if (value && !streamingMode) {
      setStreamingMode(true);
      if (batchSettings && onBatchSettingsChange)
        onBatchSettingsChange({
          ...batchSettings,
          presubMode: value,
          streamingMode: true,
        });
    } else if (batchSettings && onBatchSettingsChange)
      onBatchSettingsChange({ ...batchSettings, presubMode: value });
  };

  return {
    showAdvanced,
    setShowAdvanced,
    streamingMode,
    setStreamingMode,
    presubMode,
    setPresubMode,
    useCustomRange,
    setUseCustomRange,
    rangeStartStr,
    setRangeStartStr,
    rangeEndStr,
    setRangeEndStr,
    handleStreamingModeChange,
    handlePresubModeChange,
  };
}

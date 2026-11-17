import { en, vi } from "@ziasub/shared";
import type { Language } from "../types/settings";

type Params = Record<string, string | number>;
type Bundle = Record<string, unknown>;

const sharedBundles: Record<Language, Bundle> = {
  vi: vi as unknown as Bundle,
  en: en as unknown as Bundle,
};

const extensionMessages: Record<Language, Bundle> = {
  vi: {
    extension: {
      popup: {
        subtitleTitle: "Phụ đề SRT",
        subtitleHint: "Dán SRT đã dịch để hiển thị trên video YouTube.",
        srtHint:
          "Dịch bằng AI Studio hoặc công cụ khác, sau đó dán SRT đã dịch vào đây.",
        detectedCount: "{{count}} phụ đề",
        lines: "{{count}} dòng",
        characters: "{{count}} ký tự",
        pasted: "Đã dán phụ đề",
        applySuccess: "Đã áp dụng {{count}} phụ đề",
        needYoutube: "Vui lòng mở video YouTube trước",
        tabMissing: "Không tìm thấy tab",
        invalidSrt: "Nội dung không phải định dạng SRT",
        clipboardEmpty: "Clipboard trống",
        clipboardDenied: "Không thể truy cập clipboard",
        clipboardDetected: "Đã phát hiện SRT trong clipboard",
        fileLoaded: "Đã tải {{name}}",
        fileInvalid: "File không chứa phụ đề hợp lệ",
        fileReadError: "Không thể đọc file",
        nothingToExport: "Chưa có phụ đề để xuất",
        exportSuccess: "Đã xuất tệp phụ đề",
        exportError: "Không thể xuất phụ đề",
        aiStudioOpen: "Mở AI Studio",
        aiStudioBack: "Về YouTube",
        aiStudioTitle: "Mở AI Studio để dịch SRT",
      },
      options: {
        subtitle: "Tùy chỉnh extension",
        subtitleHint: "Dán SRT, hiển thị và tùy chỉnh phụ đề trên YouTube.",
        general: "Chung",
        generalHint: "Giao diện và ngôn ngữ của extension",
        theme: "Giao diện",
        language: "Ngôn ngữ",
        vietnamese: "Tiếng Việt",
        english: "English",
        normal: "Thường",
        none: "Không",
        themeSystem: "Theo hệ thống",
        themeLight: "Sáng",
        themeDark: "Tối",
        weight: "Độ đậm",
        style: "Kiểu chữ",
        letterCase: "Chữ hoa/thường",
        alignment: "Căn chữ",
        openYoutube: "Mở YouTube",
        resetAll: "Khôi phục toàn bộ mặc định",
        resetStyle: "Khôi phục kiểu phụ đề mặc định",
        resetDone: "Đã khôi phục cài đặt mặc định",
        saved: "Đã lưu thay đổi",
        support: "Hỗ trợ",
      },
    },
  },
  en: {
    extension: {
      popup: {
        subtitleTitle: "SRT subtitles",
        subtitleHint: "Paste translated SRT to display it on YouTube.",
        srtHint:
          "Translate with AI Studio or another tool, then paste the translated SRT here.",
        detectedCount: "{{count}} subtitles",
        lines: "{{count}} lines",
        characters: "{{count}} characters",
        pasted: "Subtitles pasted",
        applySuccess: "Applied {{count}} subtitles",
        needYoutube: "Open a YouTube video first",
        tabMissing: "No active tab found",
        invalidSrt: "The content is not valid SRT",
        clipboardEmpty: "Clipboard is empty",
        clipboardDenied: "Cannot access the clipboard",
        clipboardDetected: "SRT detected in the clipboard",
        fileLoaded: "Loaded {{name}}",
        fileInvalid: "The file does not contain valid subtitles",
        fileReadError: "Could not read the file",
        nothingToExport: "There are no subtitles to export",
        exportSuccess: "Subtitle file exported",
        exportError: "Could not export subtitles",
        aiStudioOpen: "Open AI Studio",
        aiStudioBack: "Back to YouTube",
        aiStudioTitle: "Open AI Studio to translate SRT",
      },
      options: {
        subtitle: "Extension settings",
        subtitleHint: "Paste SRT, display and customize subtitles on YouTube.",
        general: "General",
        generalHint: "Extension appearance and language",
        theme: "Theme",
        language: "Language",
        vietnamese: "Tiếng Việt",
        english: "English",
        normal: "Normal",
        none: "None",
        themeSystem: "System",
        themeLight: "Light",
        themeDark: "Dark",
        weight: "Weight",
        style: "Style",
        letterCase: "Letter case",
        alignment: "Alignment",
        openYoutube: "Open YouTube",
        resetAll: "Restore all defaults",
        resetStyle: "Restore default subtitle style",
        resetDone: "Settings restored to defaults",
        saved: "Changes saved",
        support: "Support",
      },
    },
  },
};

function getPath(bundle: Bundle, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, bundle);
}

export function t(language: Language, key: string, params?: Params): string {
  const fromExtension = getPath(extensionMessages[language], key);
  const fromShared = getPath(sharedBundles[language], key);
  const value =
    typeof fromExtension === "string"
      ? fromExtension
      : typeof fromShared === "string"
        ? fromShared
        : key;

  if (!params) return value;

  return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const replacement = params[name];
    return replacement === undefined ? match : String(replacement);
  });
}

export function applyTranslations(language: Language): void {
  document.documentElement.lang = language;

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (key) element.textContent = t(language, key);
  });

  document
    .querySelectorAll<HTMLElement>("[data-i18n-placeholder]")
    .forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      if (key) element.setAttribute("placeholder", t(language, key));
    });

  document
    .querySelectorAll<HTMLElement>("[data-i18n-title]")
    .forEach((element) => {
      const key = element.dataset.i18nTitle;
      if (key) element.setAttribute("title", t(language, key));
    });
}

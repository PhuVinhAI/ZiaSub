import { parseSRT, type SubtitleItem } from "@ziasub/shared";
import type { MessageType, MessageResponse } from "../types/messages";
import {
  DEFAULT_EXTENSION_SETTINGS,
  type ExtensionSettings,
} from "../types/settings";
import { applyTranslations, t } from "../utils/i18n";
import { loadExtensionSettings } from "../utils/settings";
import { applyTheme } from "../utils/theme";

const AI_STUDIO_URL = "https://aistudio.google.com/prompts/new_chat";

const settingsBtn = document.getElementById("settingsBtn") as HTMLButtonElement;
const aiStudioBtn = document.getElementById("aiStudioBtn") as HTMLButtonElement;
const fileBtn = document.getElementById("fileBtn") as HTMLButtonElement;
const pasteBtn = document.getElementById("pasteBtn") as HTMLButtonElement;
const exportBtn = document.getElementById("exportBtn") as HTMLButtonElement;
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const srtInput = document.getElementById("srtInput") as HTMLTextAreaElement;
const clearInputBtn = document.getElementById(
  "clearInputBtn",
) as HTMLButtonElement;
const subtitleInfo = document.getElementById("subtitleInfo") as HTMLDivElement;
const subtitleCount = document.getElementById(
  "subtitleCount",
) as HTMLSpanElement;
const charCount = document.getElementById("charCount") as HTMLSpanElement;
const lineCount = document.getElementById("lineCount") as HTMLSpanElement;
const applyBtn = document.getElementById("applyBtn") as HTMLButtonElement;
const toast = document.getElementById("toast") as HTMLDivElement;
const toastMessage = document.getElementById("toastMessage") as HTMLSpanElement;

let settings: ExtensionSettings = {
  ...DEFAULT_EXTENSION_SETTINGS,
  subtitle: { ...DEFAULT_EXTENSION_SETTINGS.subtitle },
};
let parsedSubtitles: SubtitleItem[] = [];
let toastTimeout: number | null = null;

function message(key: string, params?: Record<string, string | number>): string {
  return t(settings.language, key, params);
}

function showToast(
  text: string,
  type: "success" | "error" | "info" = "info",
): void {
  if (toastTimeout) window.clearTimeout(toastTimeout);

  toastMessage.textContent = text;
  toast.className = `toast ${type}`;

  toastTimeout = window.setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

function updateUI(): void {
  const content = srtInput.value.trim();
  const lineTotal = srtInput.value ? srtInput.value.split(/\r?\n/).length : 0;
  lineCount.textContent = content
    ? message("extension.popup.lines", { count: lineTotal })
    : "";

  clearInputBtn.classList.toggle("hidden", !content);

  if (!content) {
    parsedSubtitles = [];
    subtitleInfo.classList.add("hidden");
    applyBtn.disabled = true;
    return;
  }

  try {
    parsedSubtitles = parseSRT(content);
  } catch {
    parsedSubtitles = [];
  }

  if (parsedSubtitles.length > 0) {
    subtitleInfo.classList.remove("hidden");
    subtitleCount.textContent = message("extension.popup.detectedCount", {
      count: parsedSubtitles.length,
    });
    charCount.textContent = message("extension.popup.characters", {
      count: content.length,
    });
    applyBtn.disabled = false;
  } else {
    subtitleInfo.classList.add("hidden");
    applyBtn.disabled = true;
  }
}

async function sendToContentScript(
  payload: MessageType,
): Promise<MessageResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    throw new Error(message("extension.popup.tabMissing"));
  }

  if (!tab.url?.includes("youtube.com")) {
    throw new Error(message("extension.popup.needYoutube"));
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, payload);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["dist/content/index.js"],
    });
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content.css"],
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    return chrome.tabs.sendMessage(tab.id, payload);
  }
}

function isSRTFormat(text: string): boolean {
  if (!text || text.length < 10) return false;
  return /^\d+\s*\n\d{2}:\d{2}:\d{2}[,.:]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.:]\d{3}/m.test(
    text.trim(),
  );
}

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*]+/g, "_").replace(/\s+/g, " ").trim();
}

fileBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    srtInput.value = await file.text();
    updateUI();

    if (parsedSubtitles.length > 0) {
      showToast(
        message("extension.popup.fileLoaded", { name: file.name }),
        "success",
      );
    } else {
      showToast(message("extension.popup.fileInvalid"), "error");
    }
  } catch {
    showToast(message("extension.popup.fileReadError"), "error");
  }

  fileInput.value = "";
});

pasteBtn.addEventListener("click", async () => {
  try {
    const content = await navigator.clipboard.readText();
    if (!content) {
      showToast(message("extension.popup.clipboardEmpty"), "info");
      return;
    }

    srtInput.value = content;
    updateUI();
    showToast(
      parsedSubtitles.length > 0
        ? message("extension.popup.pasted")
        : message("extension.popup.invalidSrt"),
      parsedSubtitles.length > 0 ? "success" : "error",
    );
  } catch {
    showToast(message("extension.popup.clipboardDenied"), "error");
  }
});

srtInput.addEventListener("input", updateUI);

clearInputBtn.addEventListener("click", async () => {
  srtInput.value = "";
  updateUI();

  try {
    await sendToContentScript({ type: "CLEAR_SUBTITLES" });
  } catch {
    // Not on YouTube, nothing else to clear.
  }
});

applyBtn.addEventListener("click", async () => {
  if (parsedSubtitles.length === 0) return;

  try {
    applyBtn.disabled = true;
    await sendToContentScript({
      type: "SET_SUBTITLES",
      subtitles: parsedSubtitles,
    });
    showToast(
      message("extension.popup.applySuccess", {
        count: parsedSubtitles.length,
      }),
      "success",
    );
  } catch (error) {
    showToast((error as Error).message, "error");
  } finally {
    applyBtn.disabled = parsedSubtitles.length === 0;
  }
});

exportBtn.addEventListener("click", async () => {
  const content = srtInput.value.trim();
  if (!content) {
    showToast(message("extension.popup.nothingToExport"), "info");
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const title = sanitizeFileName(
      (tab?.title || "ziasub-subtitle").replace(/\s*-\s*YouTube\s*$/, ""),
    );
    const blob = new Blob([srtInput.value], {
      type: "application/x-subrip;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title || "ziasub-subtitle"}.srt`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(message("extension.popup.exportSuccess"), "success");
  } catch {
    showToast(message("extension.popup.exportError"), "error");
  }
});

settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

async function initAIStudioButton(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isAIStudio = tab?.url?.includes("aistudio.google.com");

  if (isAIStudio) {
    aiStudioBtn.title = message("extension.popup.aiStudioBack");
    aiStudioBtn.innerHTML =
      '<i class="mdi mdi-youtube" style="color:#ff4d4f"></i>';
    aiStudioBtn.onclick = () => {
      if (tab?.id) {
        chrome.tabs.update(tab.id, { url: "https://www.youtube.com" });
      } else {
        chrome.tabs.create({ url: "https://www.youtube.com" });
      }
    };
    return;
  }

  aiStudioBtn.title = message("extension.popup.aiStudioOpen");
  aiStudioBtn.innerHTML = '<i class="mdi mdi-creation"></i>';
  aiStudioBtn.onclick = async () => {
    if (tab?.url?.includes("youtube.com/watch") || tab?.url?.includes("/shorts/")) {
      try {
        await navigator.clipboard.writeText(tab.url);
      } catch {
        // Copying the URL is a convenience, not a requirement.
      }
    }
    chrome.tabs.create({ url: AI_STUDIO_URL });
  };
}

async function checkClipboardForSRT(): Promise<void> {
  try {
    const content = await navigator.clipboard.readText();
    if (content && isSRTFormat(content) && !srtInput.value) {
      srtInput.value = content;
      updateUI();
      showToast(message("extension.popup.clipboardDetected"), "info");
    }
  } catch {
    // Clipboard access denied or unavailable.
  }
}

async function init(): Promise<void> {
  settings = await loadExtensionSettings();
  applyTheme(settings.themeMode);
  applyTranslations(settings.language);
  updateUI();
  await initAIStudioButton();
  await checkClipboardForSRT();
}

void init();

import type { SubtitleItem } from "@ziasub/shared";
import type { MessageType, MessageResponse } from "../types/messages";
import {
  DEFAULT_EXTENSION_SETTINGS,
  normalizeExtensionSettings,
  type ExtensionSettings,
} from "../types/settings";
import { loadExtensionSettings } from "../utils/settings";
import { animateSubtitle, buildSubtitleCss } from "../utils/subtitleStyle";

const FONT_SUBSETS = [
  {
    file: "roboto-vietnamese.woff2",
    range:
      "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
  },
  {
    file: "roboto-latin-ext.woff2",
    range:
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
  {
    file: "roboto-latin.woff2",
    range:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
];

const FONT_FACES = FONT_SUBSETS.map(
  ({ file, range }) =>
    `@font-face{font-family:"ZiaSub Roboto";font-style:normal;font-weight:100 900;font-display:swap;src:url("${chrome.runtime.getURL(`fonts/${file}`)}") format("woff2");unicode-range:${range}}`,
).join("\n");

class SubtitleOverlay {
  private subtitles: SubtitleItem[] = [];
  private overlay: HTMLDivElement | null = null;
  private subtitleEl: HTMLDivElement | null = null;
  private video: HTMLVideoElement | null = null;
  private currentSubtitle: SubtitleItem | null = null;
  private animationFrame: number | null = null;
  private settings: ExtensionSettings = {
    ...DEFAULT_EXTENSION_SETTINGS,
    subtitle: { ...DEFAULT_EXTENSION_SETTINGS.subtitle },
  };

  constructor() {
    this.init();
  }

  private init() {
    this.injectFonts();
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync" || !changes.settings) return;
      this.settings = normalizeExtensionSettings(changes.settings.newValue);
      this.renderCurrentSubtitle();
    });

    this.observeVideo();
    this.loadSettings();
    window.addEventListener("resize", () => this.renderCurrentSubtitle());

    console.log("[ZiaSub] Content script initialized");
  }

  private injectFonts() {
    if (document.getElementById("ziasub-fonts")) return;
    const style = document.createElement("style");
    style.id = "ziasub-fonts";
    style.textContent = FONT_FACES;
    (document.head ?? document.documentElement).appendChild(style);
  }

  private async loadSettings() {
    this.settings = await loadExtensionSettings();
    this.renderCurrentSubtitle();
  }

  private handleMessage(
    message: MessageType,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void,
  ): boolean {
    switch (message.type) {
      case "SET_SUBTITLES":
        this.setSubtitles(message.subtitles);
        sendResponse({
          success: true,
          data: { count: message.subtitles.length },
        });
        break;

      case "CLEAR_SUBTITLES":
        this.clearSubtitles();
        sendResponse({ success: true });
        break;

      case "GET_SUBTITLES":
        sendResponse({ success: true, data: { subtitles: this.subtitles } });
        break;

      case "SETTINGS_UPDATED":
        this.settings = normalizeExtensionSettings(message.settings);
        this.renderCurrentSubtitle();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: "Unknown message type" });
    }

    return true;
  }

  private observeVideo() {
    this.findAndAttachVideo();

    const observer = new MutationObserver(() => {
      if (!this.video || !document.contains(this.video)) {
        this.findAndAttachVideo();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private findAndAttachVideo() {
    const video = document.querySelector(
      "video.html5-main-video",
    ) as HTMLVideoElement | null;

    if (video && video !== this.video) {
      this.video = video;
      this.createOverlay();

      video.addEventListener("loadedmetadata", () => {
        this.renderCurrentSubtitle();
      });

      this.startSync();
      console.log("[ZiaSub] Video found and attached");
    }
  }

  private createOverlay() {
    this.removeOverlay();

    const container =
      (document.querySelector("#movie_player") as HTMLElement | null) ??
      this.video?.parentElement;
    if (!container) return;

    this.overlay = document.createElement("div");
    this.overlay.className = "ziasub-overlay";

    this.subtitleEl = document.createElement("div");
    this.subtitleEl.className = "ziasub-subtitle";
    this.subtitleEl.style.display = "none";

    this.overlay.appendChild(this.subtitleEl);
    container.appendChild(this.overlay);
  }

  private removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.subtitleEl = null;
    }
  }

  private setSubtitles(subtitles: SubtitleItem[]) {
    this.subtitles = [...subtitles].sort(
      (a, b) => a.startTime - b.startTime,
    );
    this.currentSubtitle = null;

    if (!this.overlay) {
      this.findAndAttachVideo();
    }

    this.renderCurrentSubtitle();
    console.log(`[ZiaSub] Loaded ${subtitles.length} subtitles`);
  }

  private clearSubtitles() {
    this.subtitles = [];
    this.currentSubtitle = null;
    this.hideSubtitle();
    console.log("[ZiaSub] Subtitles cleared");
  }

  private startSync() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const sync = () => {
      this.updateSubtitle();
      this.animationFrame = requestAnimationFrame(sync);
    };

    this.animationFrame = requestAnimationFrame(sync);
  }

  private updateSubtitle() {
    if (!this.video || !this.subtitleEl) return;
    if (this.subtitles.length === 0) return;

    const subtitle = this.findSubtitle(this.video.currentTime);

    if (subtitle !== this.currentSubtitle) {
      this.currentSubtitle = subtitle;
      this.renderCurrentSubtitle();
    }
  }

  private renderCurrentSubtitle() {
    if (!this.subtitleEl) return;

    if (!this.currentSubtitle) {
      this.hideSubtitle();
      return;
    }

    this.subtitleEl.textContent = this.currentSubtitle.text;
    this.subtitleEl.style.cssText = buildSubtitleCss(
      this.settings.subtitle,
      this.isPortraitVideo(),
      true,
      "absolute",
    );
    animateSubtitle(this.subtitleEl, this.settings.subtitle);
  }

  private hideSubtitle() {
    if (!this.subtitleEl) return;
    this.subtitleEl.style.display = "none";
  }

  private isPortraitVideo(): boolean {
    if (this.video?.videoWidth && this.video.videoHeight) {
      return this.video.videoHeight > this.video.videoWidth;
    }
    return window.innerHeight > window.innerWidth;
  }

  private findSubtitle(time: number): SubtitleItem | null {
    let left = 0;
    let right = this.subtitles.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const subtitle = this.subtitles[mid];

      if (time >= subtitle.startTime && time <= subtitle.endTime) {
        return subtitle;
      }

      if (time < subtitle.startTime) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return null;
  }
}

new SubtitleOverlay();

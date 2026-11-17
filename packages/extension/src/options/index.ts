import {
  DEFAULT_SUBTITLE_SETTINGS,
  type SubtitleSettings,
} from "@ziasub/shared";
import {
  DEFAULT_EXTENSION_SETTINGS,
  type ExtensionSettings,
  type Language,
  type ThemeMode,
} from "../types/settings";
import { applyTranslations, t } from "../utils/i18n";
import {
  loadExtensionSettings,
  notifyActiveYouTubeTab,
  saveExtensionSettings,
} from "../utils/settings";
import { buildSubtitleCss } from "../utils/subtitleStyle";
import { applyTheme } from "../utils/theme";

const generalGrid = document.getElementById("generalGrid") as HTMLDivElement;
const presetGrid = document.getElementById("presetGrid") as HTMLDivElement;
const styleSections = document.getElementById("styleSections") as HTMLDivElement;
const previewStage = document.getElementById("previewStage") as HTMLDivElement;
const previewSubtitle = document.getElementById(
  "previewSubtitle",
) as HTMLDivElement;
const previewMode = document.getElementById("previewMode") as HTMLDivElement;
const resetAllBtn = document.getElementById("resetAllBtn") as HTMLButtonElement;
const resetStyleBtn = document.getElementById(
  "resetStyleBtn",
) as HTMLButtonElement;
const openYoutubeBtn = document.getElementById(
  "openYoutubeBtn",
) as HTMLButtonElement;
const toast = document.getElementById("toast") as HTMLDivElement;
const toastMessage = document.getElementById("toastMessage") as HTMLSpanElement;

let settings: ExtensionSettings = cloneDefaults();
let previewPortrait = false;
let saveTimer: number | null = null;
let toastTimer: number | null = null;

const PRESETS: Array<{
  id: string;
  icon: string;
  nameKey: string;
  hintKey: string;
  settings: Partial<SubtitleSettings>;
}> = [
  {
    id: "classic",
    icon: "mdi-subtitles-outline",
    nameKey: "settings.subtitle.presetClassic",
    hintKey: "settings.subtitle.presetClassicHint",
    settings: {},
  },
  {
    id: "cinema",
    icon: "mdi-movie-open-outline",
    nameKey: "settings.subtitle.presetCinema",
    hintKey: "settings.subtitle.presetCinemaHint",
    settings: {
      fontSize: 18,
      fontFamily: "rounded",
      textColor: "#FFF4B8",
      letterSpacing: 0.2,
      lineHeight: 1.45,
      backgroundMode: "always",
      backgroundOpacity: 55,
      backgroundPaddingHorizontal: 18,
      backgroundPaddingVertical: 9,
      backgroundRadius: 10,
      outlineWidth: 1.1,
      shadowStyle: "custom",
      shadowBlur: 6,
      widthMode: "fit",
      maxWidth: 86,
      animation: "fade",
      animationDuration: 220,
    },
  },
  {
    id: "minimal",
    icon: "mdi-minus-box-outline",
    nameKey: "settings.subtitle.presetMinimal",
    hintKey: "settings.subtitle.presetMinimalHint",
    settings: {
      fontSize: 14,
      fontWeight: "normal",
      backgroundMode: "none",
      outlineEnabled: false,
      shadowEnabled: true,
      shadowStyle: "custom",
      shadowOpacity: 80,
      shadowBlur: 3,
      widthMode: "fit",
      maxWidth: 82,
      animation: "none",
    },
  },
  {
    id: "contrast",
    icon: "mdi-contrast-box",
    nameKey: "settings.subtitle.presetContrast",
    hintKey: "settings.subtitle.presetContrastHint",
    settings: {
      fontSize: 18,
      fontWeight: "bold",
      textColor: "#FFFFFF",
      backgroundMode: "always",
      backgroundColor: "#000000",
      backgroundOpacity: 92,
      outlineEnabled: true,
      outlineWidth: 1.5,
      shadowEnabled: false,
      widthMode: "full",
      maxWidth: 94,
      animation: "none",
    },
  },
];

function cloneDefaults(): ExtensionSettings {
  return {
    ...DEFAULT_EXTENSION_SETTINGS,
    subtitle: { ...DEFAULT_SUBTITLE_SETTINGS },
  };
}

function msg(key: string, params?: Record<string, string | number>): string {
  return t(settings.language, key, params);
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function formatValue(value: string, unit: string): string {
  const number = Number(value);
  if (unit === "×") return `${number.toFixed(2)}×`;
  if (unit === "%") return `${Math.round(number)}%`;
  if (unit === "ms") return `${Math.round(number)} ms`;
  if (unit === "px") {
    return `${Number.isInteger(number) ? number : number.toFixed(1)} px`;
  }
  return value;
}

const COLOR_SWATCHES = [
  "#FFFFFF",
  "#FFF4B8",
  "#FFD54F",
  "#8BE9FD",
  "#50FA7B",
  "#FF79C6",
  "#FF6B6B",
  "#C4B5FD",
  "#000000",
  "#24304A",
  "#6B7280",
  "#7C2D12",
];

function customSelect(
  options: Array<{ value: string; label: string }>,
  value: string,
  dataAttributes: string,
): string {
  const selected = options.find((item) => item.value === value) ?? options[0];

  return `
    <div class="custom-select" data-select ${dataAttributes}>
      <button type="button" class="select-trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="select-value">${esc(selected.label)}</span>
        <i class="mdi mdi-chevron-down"></i>
      </button>
      <div class="select-menu hidden" role="listbox">
        ${options
          .map(
            (item) => `
              <button
                type="button"
                class="select-option${item.value === value ? " active" : ""}"
                data-value="${esc(item.value)}"
                role="option"
                aria-selected="${item.value === value}"
              >
                <span>${esc(item.label)}</span>
                <i class="mdi mdi-check"></i>
              </button>`,
          )
          .join("")}
      </div>
    </div>`;
}

function rangeField(
  key: keyof SubtitleSettings,
  labelKey: string,
  hintKey: string | undefined,
  value: number,
  min: number,
  max: number,
  step: number,
  unit: string,
): string {
  const id = String(key);
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return `
    <div class="field">
      <div class="field-head">
        <span>${esc(msg(labelKey))}</span>
        <output id="${id}Value">${formatValue(String(value), unit)}</output>
      </div>
      <div
        class="custom-slider"
        data-slider
        data-setting="${id}"
        data-min="${min}"
        data-max="${max}"
        data-step="${step}"
        data-unit="${unit}"
        style="--percent: ${percent}%"
        tabindex="0"
        role="slider"
        aria-valuemin="${min}"
        aria-valuemax="${max}"
        aria-valuenow="${value}"
        aria-valuetext="${formatValue(String(value), unit)}"
      >
        <div class="slider-track">
          <div class="slider-fill"></div>
          <div class="slider-thumb"></div>
        </div>
      </div>
      ${hintKey ? `<p class="field-hint">${esc(msg(hintKey))}</p>` : ""}
    </div>`;
}

function selectField(
  key: keyof SubtitleSettings,
  labelKey: string,
  options: Array<{ value: string; label: string }>,
  value: string,
  hintKey?: string,
): string {
  const id = String(key);

  return `
    <div class="field">
      <div class="field-head"><span>${esc(msg(labelKey))}</span></div>
      ${customSelect(options, value, `data-setting="${id}"`)}
      ${hintKey ? `<p class="field-hint">${esc(msg(hintKey))}</p>` : ""}
    </div>`;
}

function colorField(
  key: keyof SubtitleSettings,
  labelKey: string,
  hintKey: string | undefined,
  value: string,
): string {
  const id = String(key);

  return `
    <div class="field">
      <div class="field-head"><span>${esc(msg(labelKey))}</span></div>
      <div class="color-control" data-color data-setting="${id}">
        <div class="color-current">
          <span class="color-preview" style="background:${esc(value)}"></span>
          <i class="mdi mdi-eyedropper-variant"></i>
          <input
            class="hex-input"
            type="text"
            value="${esc(value.toUpperCase())}"
            maxlength="7"
            spellcheck="false"
            autocomplete="off"
          />
        </div>
        <div class="swatch-grid">
          ${COLOR_SWATCHES.map(
            (color) => `
              <button
                type="button"
                class="swatch${color === value.toUpperCase() ? " active" : ""}"
                data-color-value="${color}"
                style="--swatch:${color}"
                aria-label="${color}"
              ></button>`,
          ).join("")}
        </div>
      </div>
      ${hintKey ? `<p class="field-hint">${esc(msg(hintKey))}</p>` : ""}
    </div>`;
}

function toggleField(
  key: keyof SubtitleSettings,
  labelKey: string,
  hintKey: string | undefined,
  checked: boolean,
): string {
  const id = String(key);

  return `
    <div class="field">
      <div class="toggle-row">
        <span>${esc(msg(labelKey))}</span>
        <button
          type="button"
          class="toggle-switch"
          data-toggle
          data-setting="${id}"
          role="switch"
          aria-checked="${checked}"
        >
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </button>
      </div>
      ${hintKey ? `<p class="field-hint">${esc(msg(hintKey))}</p>` : ""}
    </div>`;
}

function section(
  titleKey: string,
  descriptionKey: string,
  body: string,
  icon: string,
): string {
  return `
    <section class="card">
      <div class="card-head">
        <div class="section-heading">
          <span class="section-icon"><i class="mdi ${icon}"></i></span>
          <div>
            <h2>${esc(msg(titleKey))}</h2>
            <p>${esc(msg(descriptionKey))}</p>
          </div>
        </div>
      </div>
      <div class="settings-grid">${body}</div>
    </section>`;
}

function renderGeneral(): void {
  const themeOptions = [
    { value: "system", label: msg("extension.options.themeSystem") },
    { value: "light", label: msg("extension.options.themeLight") },
    { value: "dark", label: msg("extension.options.themeDark") },
  ];
  const languageOptions = [
    { value: "vi", label: msg("extension.options.vietnamese") },
    { value: "en", label: msg("extension.options.english") },
  ];

  generalGrid.innerHTML = `
    <div class="field">
      <div class="field-head"><span>${esc(msg("extension.options.theme"))}</span></div>
      ${customSelect(themeOptions, settings.themeMode, 'data-special="themeMode"')}
    </div>
    <div class="field">
      <div class="field-head"><span>${esc(msg("extension.options.language"))}</span></div>
      ${customSelect(languageOptions, settings.language, 'data-special="language"')}
    </div>`;
}

function renderPresets(): void {
  presetGrid.innerHTML = PRESETS.map(
    (preset) => `
      <button class="preset-card" data-preset="${preset.id}">
        <i class="mdi ${preset.icon}"></i>
        <strong>${esc(msg(preset.nameKey))}</strong>
        <small>${esc(msg(preset.hintKey))}</small>
      </button>`,
  ).join("");

  presetGrid.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = PRESETS.find((item) => item.id === button.dataset.preset);
      if (!preset) return;

      settings = {
        ...settings,
        subtitle: {
          ...DEFAULT_SUBTITLE_SETTINGS,
          ...(preset.id === "classic"
            ? {}
            : {
                portraitBottom: settings.subtitle.portraitBottom,
                landscapeBottom: settings.subtitle.landscapeBottom,
              }),
          ...preset.settings,
        },
      };
      renderAll();
      scheduleSave();
      showToast(msg("extension.options.saved"));
    });
  });
}

function renderStyleSections(): void {
  const lang = settings.language;
  const subtitle = settings.subtitle;
  const label = (key: string) => t(lang, key);

  const familyOptions = [
    { value: "system", label: label("settings.subtitle.fontSystem") },
    { value: "rounded", label: label("settings.subtitle.fontRounded") },
    { value: "serif", label: label("settings.subtitle.fontSerif") },
    { value: "monospace", label: label("settings.subtitle.fontMonospace") },
  ];
  const weightOptions = [
    { value: "normal", label: label("extension.options.normal") },
    { value: "bold", label: label("settings.subtitle.bold") },
  ];
  const styleOptions = [
    { value: "normal", label: label("extension.options.normal") },
    { value: "italic", label: label("settings.subtitle.italic") },
  ];
  const transformOptions = [
    { value: "none", label: label("extension.options.none") },
    { value: "uppercase", label: label("settings.subtitle.uppercase") },
  ];
  const alignOptions = [
    { value: "left", label: label("settings.subtitle.left") },
    { value: "center", label: label("settings.subtitle.center") },
    { value: "right", label: label("settings.subtitle.right") },
  ];
  const backgroundOptions = [
    { value: "none", label: label("settings.subtitle.backgroundNone") },
    { value: "portrait", label: label("settings.subtitle.backgroundPortrait") },
    { value: "always", label: label("settings.subtitle.backgroundAlways") },
  ];
  const shadowOptions = [
    { value: "classic", label: label("settings.subtitle.shadowClassic") },
    { value: "custom", label: label("settings.subtitle.shadowCustom") },
  ];
  const widthOptions = [
    { value: "full", label: label("settings.subtitle.widthFull") },
    { value: "fit", label: label("settings.subtitle.widthFit") },
  ];
  const animationOptions = [
    { value: "none", label: label("settings.subtitle.animationNone") },
    { value: "fade", label: label("settings.subtitle.animationFade") },
    { value: "pop", label: label("settings.subtitle.animationPop") },
  ];

  styleSections.innerHTML = [
    section(
      "settings.subtitle.typographyTitle",
      "settings.subtitle.typographyDescription",
      [
        rangeField(
          "fontSize",
          "settings.subtitle.fontSize",
          undefined,
          subtitle.fontSize,
          10,
          40,
          1,
          "px",
        ),
        selectField(
          "fontFamily",
          "settings.subtitle.fontFamily",
          familyOptions,
          subtitle.fontFamily,
        ),
        selectField(
          "fontWeight",
          "extension.options.weight",
          weightOptions,
          subtitle.fontWeight,
        ),
        selectField(
          "fontStyle",
          "extension.options.style",
          styleOptions,
          subtitle.fontStyle,
        ),
        selectField(
          "textTransform",
          "extension.options.letterCase",
          transformOptions,
          subtitle.textTransform,
        ),
        selectField(
          "textAlign",
          "extension.options.alignment",
          alignOptions,
          subtitle.textAlign,
        ),
        colorField(
          "textColor",
          "settings.subtitle.textColor",
          "settings.subtitle.customHexHint",
          subtitle.textColor,
        ),
        rangeField(
          "textOpacity",
          "settings.subtitle.textOpacity",
          undefined,
          subtitle.textOpacity,
          0,
          100,
          1,
          "%",
        ),
        rangeField(
          "letterSpacing",
          "settings.subtitle.letterSpacing",
          "settings.subtitle.letterSpacingHint",
          subtitle.letterSpacing,
          -1,
          4,
          0.1,
          "px",
        ),
        rangeField(
          "lineHeight",
          "settings.subtitle.lineHeight",
          "settings.subtitle.lineHeightHint",
          subtitle.lineHeight,
          1,
          2,
          0.05,
          "×",
        ),
      ].join(""),
      "mdi-format-font",
    ),
    section(
      "settings.subtitle.backgroundTitle",
      "settings.subtitle.backgroundDescription",
      [
        selectField(
          "backgroundMode",
          "settings.subtitle.backgroundDisplay",
          backgroundOptions,
          subtitle.backgroundMode,
        ),
        colorField(
          "backgroundColor",
          "settings.subtitle.backgroundColor",
          undefined,
          subtitle.backgroundColor,
        ),
        rangeField(
          "backgroundOpacity",
          "settings.subtitle.backgroundOpacity",
          undefined,
          subtitle.backgroundOpacity,
          0,
          100,
          1,
          "%",
        ),
        rangeField(
          "backgroundPaddingHorizontal",
          "settings.subtitle.horizontalPadding",
          undefined,
          subtitle.backgroundPaddingHorizontal,
          0,
          40,
          1,
          "px",
        ),
        rangeField(
          "backgroundPaddingVertical",
          "settings.subtitle.verticalPadding",
          undefined,
          subtitle.backgroundPaddingVertical,
          0,
          30,
          1,
          "px",
        ),
        rangeField(
          "backgroundRadius",
          "settings.subtitle.cornerRadius",
          undefined,
          subtitle.backgroundRadius,
          0,
          30,
          1,
          "px",
        ),
      ].join(""),
      "mdi-layers-outline",
    ),
    section(
      "settings.subtitle.readabilityTitle",
      "settings.subtitle.readabilityDescription",
      [
        toggleField(
          "outlineEnabled",
          "settings.subtitle.outline",
          "settings.subtitle.outlineHint",
          subtitle.outlineEnabled,
        ),
        colorField(
          "outlineColor",
          "settings.subtitle.outlineColor",
          undefined,
          subtitle.outlineColor,
        ),
        rangeField(
          "outlineWidth",
          "settings.subtitle.outlineWidth",
          undefined,
          subtitle.outlineWidth,
          0,
          4,
          0.1,
          "px",
        ),
        toggleField(
          "shadowEnabled",
          "settings.subtitle.shadow",
          "settings.subtitle.shadowHint",
          subtitle.shadowEnabled,
        ),
        selectField(
          "shadowStyle",
          "settings.subtitle.shadowStyle",
          shadowOptions,
          subtitle.shadowStyle,
        ),
        colorField(
          "shadowColor",
          "settings.subtitle.shadowColor",
          undefined,
          subtitle.shadowColor,
        ),
        rangeField(
          "shadowOpacity",
          "settings.subtitle.shadowOpacity",
          undefined,
          subtitle.shadowOpacity,
          0,
          100,
          1,
          "%",
        ),
        rangeField(
          "shadowBlur",
          "settings.subtitle.shadowBlur",
          undefined,
          subtitle.shadowBlur,
          0,
          20,
          1,
          "px",
        ),
        rangeField(
          "shadowOffsetX",
          "settings.subtitle.shadowOffsetX",
          undefined,
          subtitle.shadowOffsetX,
          -10,
          10,
          1,
          "px",
        ),
        rangeField(
          "shadowOffsetY",
          "settings.subtitle.shadowOffsetY",
          undefined,
          subtitle.shadowOffsetY,
          -10,
          10,
          1,
          "px",
        ),
      ].join(""),
      "mdi-format-color-text",
    ),
    section(
      "settings.subtitle.layoutTitle",
      "settings.subtitle.layoutDescription",
      [
        selectField(
          "widthMode",
          "settings.subtitle.widthMode",
          widthOptions,
          subtitle.widthMode,
        ),
        rangeField(
          "maxWidth",
          "settings.subtitle.maxWidth",
          "settings.subtitle.maxWidthHint",
          subtitle.maxWidth,
          30,
          100,
          1,
          "%",
        ),
        selectField(
          "horizontalPosition",
          "settings.subtitle.horizontalPosition",
          alignOptions,
          subtitle.horizontalPosition,
        ),
        rangeField(
          "portraitBottom",
          "settings.subtitle.portrait",
          "settings.subtitle.portraitHint",
          subtitle.portraitBottom,
          0,
          240,
          1,
          "px",
        ),
        rangeField(
          "landscapeBottom",
          "settings.subtitle.landscape",
          "settings.subtitle.landscapeHint",
          subtitle.landscapeBottom,
          0,
          240,
          1,
          "px",
        ),
      ].join(""),
      "mdi-view-dashboard-outline",
    ),
    section(
      "settings.subtitle.motionTitle",
      "settings.subtitle.motionDescription",
      [
        selectField(
          "animation",
          "settings.subtitle.animation",
          animationOptions,
          subtitle.animation,
        ),
        rangeField(
          "animationDuration",
          "settings.subtitle.animationDuration",
          undefined,
          subtitle.animationDuration,
          80,
          600,
          10,
          "ms",
        ),
      ].join(""),
      "mdi-play-circle-outline",
    ),
  ].join("");
}

function renderAll(): void {
  renderGeneral();
  renderPresets();
  renderStyleSections();
  bindCustomControls();
  updatePreviewMode();
  updatePreview();
}

function setSubtitleSetting(
  key: keyof SubtitleSettings,
  value: unknown,
): void {
  const subtitle = { ...settings.subtitle } as Record<string, unknown>;
  subtitle[String(key)] = value;
  settings = {
    ...settings,
    subtitle: subtitle as unknown as SubtitleSettings,
  };
  updatePreview();
}

function normalizeHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) return fallback;
  return `#${trimmed.replace("#", "").toUpperCase()}`;
}

function closeAllCustomSelects(except?: HTMLElement): void {
  document.querySelectorAll<HTMLElement>("[data-select]").forEach((wrapper) => {
    if (wrapper === except) return;
    wrapper.querySelector(".select-menu")?.classList.add("hidden");
    wrapper
      .querySelector(".select-trigger")
      ?.setAttribute("aria-expanded", "false");
  });
}

function bindCustomControls(): void {
  bindCustomSelects();
  bindSliders();
  bindToggles();
  bindColorControls();
}

function bindCustomSelects(): void {
  document.querySelectorAll<HTMLElement>("[data-select]").forEach((wrapper) => {
    const trigger = wrapper.querySelector<HTMLButtonElement>(".select-trigger");
    const menu = wrapper.querySelector<HTMLElement>(".select-menu");
    const valueLabel = wrapper.querySelector<HTMLElement>(".select-value");
    const special = wrapper.dataset.special;
    const setting = wrapper.dataset.setting as
      | keyof SubtitleSettings
      | undefined;

    if (!trigger || !menu || !valueLabel) return;

    const applyValue = (value: string, label: string) => {
      valueLabel.textContent = label;

      menu
        .querySelectorAll<HTMLButtonElement>("[data-value]")
        .forEach((optionButton) => {
          const active = optionButton.dataset.value === value;
          optionButton.classList.toggle("active", active);
          optionButton.setAttribute("aria-selected", String(active));
        });

      menu.classList.add("hidden");
      trigger.setAttribute("aria-expanded", "false");

      if (special === "themeMode") {
        settings = { ...settings, themeMode: value as ThemeMode };
        applyTheme(settings.themeMode);
        scheduleSave();
        return;
      }

      if (special === "language") {
        if (settings.language !== value) {
          settings = { ...settings, language: value as Language };
          applyTranslations(settings.language);
          renderAll();
          scheduleSave();
        }
        return;
      }

      if (setting) {
        setSubtitleSetting(setting, value);
        scheduleSave();
      }
    };

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = menu.classList.contains("hidden");
      closeAllCustomSelects(wrapper);
      menu.classList.toggle("hidden", !willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        menu.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        closeAllCustomSelects(wrapper);
        menu.classList.remove("hidden");
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    menu.querySelectorAll<HTMLButtonElement>("[data-value]").forEach((optionButton) => {
      optionButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const value = optionButton.dataset.value ?? "";
        const label = optionButton.querySelector("span")?.textContent ?? value;
        applyValue(value, label);
      });
    });
  });
}

function bindSliders(): void {
  document.querySelectorAll<HTMLElement>("[data-slider]").forEach((slider) => {
    const setting = slider.dataset.setting as keyof SubtitleSettings;
    const min = Number(slider.dataset.min);
    const max = Number(slider.dataset.max);
    const step = Number(slider.dataset.step);
    const unit = slider.dataset.unit || "";
    const output = document.getElementById(`${setting}Value`);
    let dragging = false;

    const applyValue = (rawValue: number, commit: boolean) => {
      const clamped = Math.min(max, Math.max(min, rawValue));
      const snapped = min + Math.round((clamped - min) / step) * step;
      const value = Number(snapped.toFixed(4));
      const percent = ((value - min) / (max - min)) * 100;

      slider.style.setProperty("--percent", `${percent}%`);
      slider.setAttribute("aria-valuenow", String(value));
      slider.setAttribute("aria-valuetext", formatValue(String(value), unit));
      if (output) output.textContent = formatValue(String(value), unit);

      setSubtitleSetting(setting, value);
      if (commit) scheduleSave();
    };

    const applyPointerPosition = (event: PointerEvent) => {
      const rect = slider.getBoundingClientRect();
      const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
      applyValue(min + ratio * (max - min), false);
    };

    slider.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      dragging = true;
      slider.setPointerCapture(event.pointerId);
      applyPointerPosition(event);
    });

    slider.addEventListener("pointermove", (event) => {
      if (dragging) applyPointerPosition(event);
    });

    const finishDrag = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (slider.hasPointerCapture(event.pointerId)) {
        slider.releasePointerCapture(event.pointerId);
      }
      applyValue(Number(slider.getAttribute("aria-valuenow")), true);
    };

    slider.addEventListener("pointerup", finishDrag);
    slider.addEventListener("pointercancel", finishDrag);

    slider.addEventListener("keydown", (event) => {
      const current = Number(slider.getAttribute("aria-valuenow"));
      let next = current;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          next += step;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          next -= step;
          break;
        case "PageUp":
          next += step * 10;
          break;
        case "PageDown":
          next -= step * 10;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }

      event.preventDefault();
      applyValue(next, true);
    });
  });
}

function bindToggles(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-toggle]")
    .forEach((button) => {
      const setting = button.dataset.setting as keyof SubtitleSettings;

      button.addEventListener("click", () => {
        const next = button.getAttribute("aria-checked") !== "true";
        button.setAttribute("aria-checked", String(next));
        setSubtitleSetting(setting, next);
        scheduleSave();
      });
    });
}

function bindColorControls(): void {
  document.querySelectorAll<HTMLElement>("[data-color]").forEach((wrapper) => {
    const setting = wrapper.dataset.setting as keyof SubtitleSettings;
    const preview = wrapper.querySelector<HTMLElement>(".color-preview");
    const input = wrapper.querySelector<HTMLInputElement>(".hex-input");
    const swatches = wrapper.querySelectorAll<HTMLButtonElement>(
      "[data-color-value]",
    );
    let current = String(
      (settings.subtitle as unknown as Record<string, unknown>)[setting] ??
        "#FFFFFF",
    );

    const applyValue = (value: string, commit: boolean) => {
      current = normalizeHex(value, current);
      if (preview) preview.style.background = current;
      if (input) input.value = current;
      swatches.forEach((swatch) => {
        swatch.classList.toggle(
          "active",
          swatch.dataset.colorValue?.toUpperCase() === current.toUpperCase(),
        );
      });
      setSubtitleSetting(setting, current);
      if (commit) scheduleSave();
    };

    swatches.forEach((swatch) => {
      swatch.addEventListener("click", () => {
        applyValue(swatch.dataset.colorValue ?? current, true);
      });
    });

    input?.addEventListener("input", () => {
      if (/^#?[0-9a-fA-F]{6}$/.test(input.value.trim())) {
        applyValue(input.value, false);
      }
    });

    input?.addEventListener("change", () => applyValue(input.value, true));
    input?.addEventListener("blur", () => applyValue(input.value, true));
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
    });

    applyValue(current, false);
  });
}

function updatePreviewMode(): void {
  previewMode
    .querySelectorAll<HTMLButtonElement>("button")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        (button.dataset.mode === "portrait") === previewPortrait,
      );
    });
  previewStage.classList.toggle("portrait", previewPortrait);
}

function updatePreview(): void {
  previewSubtitle.textContent = msg("settings.subtitle.previewSample");
  previewSubtitle.style.cssText = buildSubtitleCss(
    settings.subtitle,
    previewPortrait,
    true,
    "absolute",
  );
}

function scheduleSave(): void {
  if (saveTimer) window.clearTimeout(saveTimer);

  saveTimer = window.setTimeout(async () => {
    try {
      await saveExtensionSettings(settings);
      await notifyActiveYouTubeTab(settings);
    } catch {
      showToast(msg("common.error"));
    }
  }, 180);
}

function showToast(text: string): void {
  if (toastTimer) window.clearTimeout(toastTimer);

  toastMessage.textContent = text;
  toast.classList.remove("hidden");

  toastTimer = window.setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

previewMode.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
  button.addEventListener("click", () => {
    previewPortrait = button.dataset.mode === "portrait";
    updatePreviewMode();
    updatePreview();
  });
});

document.addEventListener("click", () => closeAllCustomSelects());

resetStyleBtn.addEventListener("click", () => {
  settings = {
    ...settings,
    subtitle: { ...DEFAULT_SUBTITLE_SETTINGS },
  };
  renderAll();
  scheduleSave();
  showToast(msg("extension.options.resetDone"));
});

resetAllBtn.addEventListener("click", () => {
  settings = cloneDefaults();
  applyTheme(settings.themeMode);
  applyTranslations(settings.language);
  renderAll();
  scheduleSave();
  showToast(msg("extension.options.resetDone"));
});

openYoutubeBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://www.youtube.com" });
});

async function init(): Promise<void> {
  settings = await loadExtensionSettings();
  applyTheme(settings.themeMode);
  applyTranslations(settings.language);
  renderAll();
}

void init();

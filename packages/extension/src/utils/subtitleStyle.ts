import type { SubtitleSettings } from "@ziasub/shared";

function normalizeHex(value: string | undefined, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value! : fallback;
}

function toRgba(
  hex: string | undefined,
  opacity: number,
  fallback: string,
): string {
  const value = normalizeHex(hex, fallback).slice(1);
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${Math.max(0, Math.min(100, opacity)) / 100})`;
}

function baseTransform(style: SubtitleSettings): string {
  return style.widthMode === "fit" && style.horizontalPosition === "center"
    ? "translateX(-50%) translateZ(0)"
    : "translateZ(0)";
}

export function buildSubtitleCss(
  style: SubtitleSettings,
  isPortrait: boolean,
  visible: boolean,
  positionOverride?: "absolute" | "fixed",
): string {
  const fontFamilies: Record<string, string> = {
    system: "system-ui,sans-serif",
    rounded: 'ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif',
    serif: 'Georgia,"Times New Roman",serif',
    monospace:
      'ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace',
  };
  const fontSize = style.fontSize ?? 15;
  const fontFamily = style.fontFamily || "system";
  const fontWeight = style.fontWeight || "bold";
  const fontStyle = style.fontStyle || "normal";
  const textTransform = style.textTransform || "none";
  const textColor = style.textColor || "#FFFFFF";
  const textOpacity = style.textOpacity ?? 100;
  const letterSpacing = style.letterSpacing ?? 0;
  const lineHeight = style.lineHeight ?? 1.5;
  const textAlign = style.textAlign || "center";
  const backgroundMode = style.backgroundMode || "portrait";
  const backgroundColor = style.backgroundColor || "#000000";
  const backgroundOpacity = style.backgroundOpacity ?? 70;
  const paddingHorizontal = style.backgroundPaddingHorizontal ?? 16;
  const paddingVertical = style.backgroundPaddingVertical ?? 8;
  const backgroundRadius = style.backgroundRadius ?? 8;
  const outlineEnabled = style.outlineEnabled ?? true;
  const outlineColor = style.outlineColor || "#000000";
  const outlineWidth = style.outlineWidth ?? 0.8;
  const shadowEnabled = style.shadowEnabled ?? true;
  const shadowStyle = style.shadowStyle || "classic";
  const shadowColor = style.shadowColor || "#000000";
  const shadowOpacity = style.shadowOpacity ?? 100;
  const shadowBlur = style.shadowBlur ?? 4;
  const shadowOffsetX = style.shadowOffsetX ?? 1;
  const shadowOffsetY = style.shadowOffsetY ?? 1;
  const widthMode = style.widthMode || "full";
  const maxWidth = style.maxWidth ?? 90;
  const horizontalPosition = style.horizontalPosition || "center";
  const bottom = isPortrait
    ? (style.portraitBottom ?? 100)
    : (style.landscapeBottom ?? 8);
  const weight = fontWeight === "bold" ? "600" : "400";
  const textStroke = outlineEnabled
    ? `-webkit-text-stroke:${outlineWidth}px ${normalizeHex(outlineColor, "#000000")};paint-order:stroke fill;`
    : "-webkit-text-stroke:0 transparent;";
  const classicTextShadow =
    "text-shadow:0 0 2px #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 -1px 0 #000,0 1px 0 #000,-1px 0 0 #000,1px 0 0 #000;";
  const textShadow = shadowEnabled
    ? shadowStyle === "classic"
      ? classicTextShadow
      : `text-shadow:${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${toRgba(shadowColor, shadowOpacity, "#000000")};`
    : "text-shadow:none;";
  const showBackground =
    backgroundMode === "always" ||
    (backgroundMode === "portrait" && isPortrait);
  const background = showBackground
    ? `background:${toRgba(backgroundColor, backgroundOpacity, "#000000")};padding:${paddingVertical}px ${paddingHorizontal}px;border-radius:${backgroundRadius}px;`
    : "background:transparent;padding:0;border-radius:0;";
  const sideInset = Math.max(0, (100 - maxWidth) / 2);
  const fitPosition =
    horizontalPosition === "left"
      ? "left:3%;right:auto;transform:translateZ(0);"
      : horizontalPosition === "right"
        ? "left:auto;right:3%;transform:translateZ(0);"
        : "left:50%;right:auto;transform:translateX(-50%) translateZ(0);";
  const layout =
    widthMode === "full"
      ? `left:${sideInset}%;right:${sideInset}%;width:auto;max-width:${maxWidth}%;margin:0 auto;transform:translateZ(0);`
      : `${fitPosition}width:max-content;max-width:${maxWidth}%;margin:0;`;
  const position = positionOverride ?? (isPortrait ? "fixed" : "absolute");

  return (
    `position:${position};bottom:${bottom}px;` +
    layout +
    `box-sizing:border-box;text-align:${textAlign};` +
    `color:${toRgba(textColor, textOpacity, "#FFFFFF")};` +
    `font-size:${fontSize}px;font-weight:${weight};` +
    `font-style:${fontStyle};font-family:${fontFamilies[fontFamily] || fontFamilies.system};` +
    `text-transform:${textTransform};letter-spacing:${letterSpacing}px;` +
    textStroke +
    textShadow +
    background +
    `pointer-events:none;z-index:2147483647;display:${visible ? "block" : "none"};` +
    `line-height:${lineHeight};white-space:pre-line;overflow-wrap:break-word;` +
    `backface-visibility:hidden;contain:layout style paint;`
  );
}

export function animateSubtitle(
  layer: HTMLElement,
  style: SubtitleSettings,
): void {
  const animation = style.animation || "none";
  if (animation === "none" || typeof layer.animate !== "function") return;

  const transform = baseTransform(style);
  const frames =
    animation === "pop"
      ? [
          { opacity: 0, transform: `${transform} scale(0.94)` },
          { opacity: 1, transform: `${transform} scale(1)` },
        ]
      : [{ opacity: 0 }, { opacity: 1 }];

  layer.animate(frames, {
    duration: style.animationDuration ?? 180,
    easing: animation === "pop" ? "cubic-bezier(0.2,0.8,0.2,1)" : "ease-out",
  });
}

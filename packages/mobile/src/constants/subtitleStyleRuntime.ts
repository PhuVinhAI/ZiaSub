/**
 * Shared subtitle renderer used by the real player and the Settings preview.
 * Keep this runtime self-contained because it is injected into a WebView.
 */
export const SUBTITLE_STYLE_RUNTIME = `
  function ziaNormalizeHex(value, fallback) {
    return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : fallback;
  }

  function ziaToRgba(hex, opacity, fallback) {
    const value = ziaNormalizeHex(hex, fallback).slice(1);
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    return 'rgba(' + red + ',' + green + ',' + blue + ',' + Math.max(0, Math.min(100, opacity)) / 100 + ')';
  }

  function ziaGetSubtitleBaseTransform(style) {
    return style.widthMode === 'fit' && style.horizontalPosition === 'center'
      ? 'translateX(-50%) translateZ(0)'
      : 'translateZ(0)';
  }

  function ziaBuildSubtitleCss(style, isPortrait, visible) {
    const fontFamilies = {
      system: 'system-ui,sans-serif',
      rounded: 'ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif',
      serif: 'Georgia,"Times New Roman",serif',
      monospace: 'ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace'
    };
    const fontSize = style.fontSize ?? 15;
    const fontFamily = style.fontFamily || 'system';
    const fontWeight = style.fontWeight || 'bold';
    const fontStyle = style.fontStyle || 'normal';
    const textTransform = style.textTransform || 'none';
    const textColor = style.textColor || '#FFFFFF';
    const textOpacity = style.textOpacity ?? 100;
    const letterSpacing = style.letterSpacing ?? 0;
    const lineHeight = style.lineHeight ?? 1.5;
    const textAlign = style.textAlign || 'center';
    const backgroundMode = style.backgroundMode || 'portrait';
    const backgroundColor = style.backgroundColor || '#000000';
    const backgroundOpacity = style.backgroundOpacity ?? 70;
    const backgroundPaddingHorizontal = style.backgroundPaddingHorizontal ?? 16;
    const backgroundPaddingVertical = style.backgroundPaddingVertical ?? 8;
    const backgroundRadius = style.backgroundRadius ?? 8;
    const outlineEnabled = style.outlineEnabled ?? true;
    const outlineColor = style.outlineColor || '#000000';
    const outlineWidth = style.outlineWidth ?? 0.8;
    const shadowEnabled = style.shadowEnabled ?? true;
    const shadowStyle = style.shadowStyle || 'classic';
    const shadowColor = style.shadowColor || '#000000';
    const shadowOpacity = style.shadowOpacity ?? 100;
    const shadowBlur = style.shadowBlur ?? 4;
    const shadowOffsetX = style.shadowOffsetX ?? 1;
    const shadowOffsetY = style.shadowOffsetY ?? 1;
    const widthMode = style.widthMode || 'full';
    const maxWidth = style.maxWidth ?? 90;
    const horizontalPosition = style.horizontalPosition || 'center';
    const bottom = isPortrait
      ? style.portraitBottom ?? 100
      : style.landscapeBottom ?? 8;
    const weight = fontWeight === 'bold' ? '600' : '400';
    const textStroke = outlineEnabled
      ? '-webkit-text-stroke:' + outlineWidth + 'px ' + ziaNormalizeHex(outlineColor, '#000000') + ';paint-order:stroke fill;'
      : '-webkit-text-stroke:0 transparent;';
    const classicTextShadow = 'text-shadow:0 0 2px #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 -1px 0 #000,0 1px 0 #000,-1px 0 0 #000,1px 0 0 #000;';
    const textShadow = shadowEnabled
      ? shadowStyle === 'classic'
        ? classicTextShadow
        : 'text-shadow:' + shadowOffsetX + 'px ' + shadowOffsetY + 'px ' + shadowBlur + 'px ' + ziaToRgba(shadowColor, shadowOpacity, '#000000') + ';'
      : 'text-shadow:none;';
    const showBackground = backgroundMode === 'always' || (backgroundMode === 'portrait' && isPortrait);
    const background = showBackground
      ? 'background:' + ziaToRgba(backgroundColor, backgroundOpacity, '#000000') + ';padding:' + backgroundPaddingVertical + 'px ' + backgroundPaddingHorizontal + 'px;border-radius:' + backgroundRadius + 'px;'
      : 'background:transparent;padding:0;border-radius:0;';
    const sideInset = Math.max(0, (100 - maxWidth) / 2);
    const fitPosition = horizontalPosition === 'left'
      ? 'left:3%;right:auto;transform:translateZ(0);'
      : horizontalPosition === 'right'
      ? 'left:auto;right:3%;transform:translateZ(0);'
      : 'left:50%;right:auto;transform:translateX(-50%) translateZ(0);';
    const layout = widthMode === 'full'
      ? 'left:' + sideInset + '%;right:' + sideInset + '%;width:auto;max-width:' + maxWidth + '%;margin:0 auto;transform:translateZ(0);'
      : fitPosition + 'width:max-content;max-width:' + maxWidth + '%;margin:0;';
    const position = isPortrait ? 'fixed' : 'absolute';

    return 'position:' + position + ';bottom:' + bottom + 'px;' + layout +
      'box-sizing:border-box;text-align:' + textAlign +
      ';color:' + ziaToRgba(textColor, textOpacity, '#FFFFFF') +
      ';font-size:' + fontSize + 'px;font-weight:' + weight +
      ';font-style:' + fontStyle + ';font-family:' + (fontFamilies[fontFamily] || fontFamilies.system) +
      ';text-transform:' + textTransform + ';letter-spacing:' + letterSpacing + 'px;' +
      textStroke + textShadow + background +
      'pointer-events:none;z-index:2147483647;display:' + (visible ? 'block' : 'none') +
      ';line-height:' + lineHeight +
      ';white-space:pre-line;overflow-wrap:break-word;backface-visibility:hidden;contain:layout style paint';
  }

  function ziaAnimateSubtitle(layer, style) {
    const animation = style.animation || 'none';
    if (animation === 'none' || !layer || typeof layer.animate !== 'function') return;
    const baseTransform = ziaGetSubtitleBaseTransform(style);
    const frames = animation === 'pop'
      ? [
          { opacity: 0, transform: baseTransform + ' scale(0.94)' },
          { opacity: 1, transform: baseTransform + ' scale(1)' }
        ]
      : [{ opacity: 0 }, { opacity: 1 }];
    layer.animate(frames, {
      duration: style.animationDuration ?? 180,
      easing: animation === 'pop' ? 'cubic-bezier(0.2,0.8,0.2,1)' : 'ease-out'
    });
  }
`;

export const SUBTITLE_PREVIEW_HTML = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
    <style>
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #090b16; }
      body {
        background:
          radial-gradient(circle at 72% 22%, rgba(124, 58, 237, 0.34), transparent 34%),
          radial-gradient(circle at 22% 72%, rgba(14, 165, 233, 0.18), transparent 38%),
          linear-gradient(145deg, #171b31 0%, #080a13 72%);
      }
      .scene-lines { position: absolute; inset: 0; opacity: 0.22; }
      .scene-lines::before, .scene-lines::after {
        content: ''; position: absolute; height: 1px; background: rgba(255,255,255,0.18);
        left: 8%; right: 8%; transform: rotate(-12deg);
      }
      .scene-lines::before { top: 32%; }
      .scene-lines::after { top: 58%; }
      .play {
        position: absolute; left: 50%; top: 42%; width: 48px; height: 48px;
        transform: translate(-50%, -50%); border: 2px solid rgba(255,255,255,0.2);
        border-radius: 50%; background: rgba(255,255,255,0.04);
      }
      .play::after {
        content: ''; position: absolute; left: 19px; top: 14px;
        border-left: 15px solid rgba(255,255,255,0.28);
        border-top: 9px solid transparent; border-bottom: 9px solid transparent;
      }
      .timeline {
        position: absolute; left: 14px; right: 14px; bottom: 10px; height: 3px;
        border-radius: 2px; background: rgba(255,255,255,0.18);
      }
      .timeline::before {
        content: ''; display: block; width: 38%; height: 100%; border-radius: inherit; background: #f43f5e;
      }
    </style>
  </head>
  <body>
    <div class="scene-lines"></div>
    <div class="play"></div>
    <div class="timeline"></div>
    <div id="custom-subtitle-layer"></div>
    <script>
      ${SUBTITLE_STYLE_RUNTIME}
      const subtitleLayer = document.getElementById('custom-subtitle-layer');

      function applyPreviewMessage(event) {
        try {
          const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (!message || message.type !== 'previewSubtitleStyle') return;
          subtitleLayer.textContent = message.text || '';
          subtitleLayer.style.cssText = ziaBuildSubtitleCss(
            message.settings || {},
            message.isPortrait !== false,
            true
          );
          ziaAnimateSubtitle(subtitleLayer, message.settings || {});
        } catch (_) {}
      }

      document.addEventListener('message', applyPreviewMessage);
      window.addEventListener('message', applyPreviewMessage);
    </script>
  </body>
</html>
`;

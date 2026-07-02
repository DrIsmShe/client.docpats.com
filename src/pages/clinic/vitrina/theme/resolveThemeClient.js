// client/src/pages/clinic/vitrina/theme/resolveThemeClient.js
//
// ВИТРИНА 2.0 (V2) — клиентский резолвер темы (для live-preview switcher'а).
// ЗЕРКАЛО серверного resolveTheme (themePresets.js), но работает на словарях,
// полученных с GET /api/v1/public/theme-presets (см. useThemePresets).
//
// Возвращает ту же форму, что серверная тема в DTO:
//   { palette, fontPair, heroStyle, cardStyle, cssVars, fontImportUrl, hero }
// → результат можно скормить VitrinaRenderer напрямую (clinic.theme), и превью
//   будет идентично тому, что отрисует прод после сохранения.
//
// Неизвестные ключи дефолтятся (как на бэке). Нет словарей → null (тогда
// вызывающий оставляет серверную тему).

function indexByKey(arr) {
  const m = {};
  for (const x of arr || []) if (x && x.key) m[x.key] = x;
  return m;
}

/**
 * @param {Object} theme  ключи темы { palette, fontPair, heroStyle, cardStyle }
 * @param {Object} dicts   payload /theme-presets { default, palettes, fontPairs, cardStyles, heroStyles }
 * @returns {Object|null}
 */
export function resolveThemeClient(theme, dicts) {
  if (!dicts) return null;

  const def = dicts.default || {};
  const P = indexByKey(dicts.palettes);
  const F = indexByKey(dicts.fontPairs);
  const C = indexByKey(dicts.cardStyles);
  const H = indexByKey(dicts.heroStyles);
  const B = indexByKey(dicts.pageBgStyles);

  const t = theme || {};
  const paletteKey = P[t.palette] ? t.palette : def.palette;
  const fontPairKey = F[t.fontPair] ? t.fontPair : def.fontPair;
  const cardStyleKey = C[t.cardStyle] ? t.cardStyle : def.cardStyle;
  const heroStyleKey = H[t.heroStyle] ? t.heroStyle : def.heroStyle;
  const pageBgStyleKey = B[t.pageBgStyle]
    ? t.pageBgStyle
    : def.pageBgStyle || "none";
  const rawDim = Number(t.pageBgDim);
  const pageBgDim = Number.isFinite(rawDim)
    ? Math.max(0, Math.min(92, Math.round(rawDim)))
    : Number.isFinite(Number(def.pageBgDim))
      ? Number(def.pageBgDim)
      : 85;
  const rawCW = Number(t.contentWidth);
  const contentWidth = Number.isFinite(rawCW)
    ? Math.max(380, Math.min(1600, Math.round(rawCW)))
    : Number.isFinite(Number(def.contentWidth))
      ? Number(def.contentWidth)
      : 1040;
  const contentMax = contentWidth >= 1600 ? "100%" : `${contentWidth}px`;
  const rawHH = Number(t.heroHeight);
  const heroHeight = Number.isFinite(rawHH)
    ? rawHH <= 0
      ? 0
      : Math.max(100, Math.min(850, Math.round(rawHH)))
    : Number.isFinite(Number(def.heroHeight))
      ? Number(def.heroHeight)
      : 0;
  const heroH = `${heroHeight}px`;

  const pal = (P[paletteKey] && P[paletteKey].tokens) || {};
  const fp = F[fontPairKey] || {};
  const card = (C[cardStyleKey] && C[cardStyleKey].vars) || {};
  const hero = (H[heroStyleKey] && H[heroStyleKey].config) || {};
  const pageBg = (B[pageBgStyleKey] && B[pageBgStyleKey].config) || {};

  const cssVars = {
    "--v-primary": pal.primary,
    "--v-primary-dark": pal.primaryDark,
    "--v-on-primary": pal.onPrimary,
    "--v-accent": pal.accent,
    "--v-bg": pal.bg,
    "--v-surface": pal.surface,
    "--v-surface-alt": pal.surfaceAlt,
    "--v-text": pal.text,
    "--v-text-muted": pal.textMuted,
    "--v-border": pal.border,
    "--v-hero-from": pal.heroFrom,
    "--v-hero-to": pal.heroTo,
    "--v-font-heading": fp.heading,
    "--v-font-body": fp.body,
    "--v-content-max": contentMax,
    "--v-hero-h": heroH,
    ...card,
  };

  return {
    palette: paletteKey,
    fontPair: fontPairKey,
    heroStyle: heroStyleKey,
    cardStyle: cardStyleKey,
    pageBgStyle: pageBgStyleKey,
    pageBgDim,
    contentWidth,
    heroHeight,
    cssVars,
    fontImportUrl: fp.importUrl,
    hero,
    pageBg,
  };
}

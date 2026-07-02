// client/src/vitrina/theme/useVitrinaTheme.js
//
// ВИТРИНА 2.0 (V1) — применение темы на клиенте.
//
// ВАЖНО: тема резолвится на СЕРВЕРЕ (clinic-public.mapper → resolveTheme) и
// приходит в DTO уже готовой: { cssVars, fontImportUrl, hero, palette, ... }.
// Клиент НЕ импортит themePresets.js (это другой репозиторий — backend).
// Здесь мы только:
//   1) вешаем cssVars (--v-*) инлайном на корневой div витрины (rootStyle);
//   2) инжектим <link> Google Fonts в <head> с дедупом и ref-count cleanup.
//
// Для V2 (live-switcher) тот же хук примет локально-резолвнутую тему — контракт
// не изменится (на вход — объект с cssVars/fontImportUrl).

import { useEffect, useMemo } from "react";

// Глобальный ref-count: один и тот же шрифт-URL может использоваться несколькими
// смонтированными витринами; убираем <link> только когда последняя размонтируется.
const fontRefCounts = new Map();

function injectFontLink(href) {
  if (!href || typeof document === "undefined") return;
  const prev = fontRefCounts.get(href) || 0;
  fontRefCounts.set(href, prev + 1);
  if (prev > 0) return; // уже в <head>

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-vitrina-font", href);
  document.head.appendChild(link);
}

function releaseFontLink(href) {
  if (!href || typeof document === "undefined") return;
  const next = (fontRefCounts.get(href) || 1) - 1;
  if (next > 0) {
    fontRefCounts.set(href, next);
    return;
  }
  fontRefCounts.delete(href);
  const link = document.querySelector(`link[data-vitrina-font="${href}"]`);
  if (link) link.remove();
}

/**
 * Применяет резолвнутую тему витрины.
 * @param {Object} theme  DTO clinic.theme: { cssVars, fontImportUrl, ... }
 * @returns {Object} style-объект для корневого div витрины (cssVars + базовые токены)
 */
export function useVitrinaTheme(theme) {
  const fontUrl = theme?.fontImportUrl || null;

  useEffect(() => {
    injectFontLink(fontUrl);
    return () => releaseFontLink(fontUrl);
  }, [fontUrl]);

  // cssVars — это уже готовые CSS-переменные (--v-primary, --v-font-body, …).
  // React поддерживает кастомные CSS-свойства в style-объекте как строковые ключи.
  const rootStyle = useMemo(() => {
    const vars = theme?.cssVars || {};
    return {
      ...vars,
      // базовое применение токенов на корне — дети наследуют фон/цвет/шрифт
      background: "var(--v-bg)",
      color: "var(--v-text)",
      fontFamily: "var(--v-font-body)",
    };
  }, [theme?.cssVars]);

  return rootStyle;
}

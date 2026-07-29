// client/src/pages/diagnostics/useModalityText.js
//
// НАЗВАНИЯ И ПРОТОКОЛЫ МОДАЛЬНОСТЕЙ НА ЯЗЫКЕ ВРАЧА.
//
// Сервер отдаёт справочник модальностей по-русски и будет отдавать дальше:
// эти же строки уходят в промпт как протокол разбора, и там русский —
// сознательное решение (см. server/modules/diagnostics/ai/language.js).
// Переводить их на сервере значило бы либо держать пять копий промпта, либо
// разъехаться между тем, что видит врач, и тем, что читает модель.
//
// Поэтому справочник переводится ЗДЕСЬ, при показе. Русский оригинал с
// сервера остаётся эталоном и запасным вариантом.
//
// ГЛАВНОЕ — ЗАЩИТА ОТ РАССИНХРОНА. checklist и redFlags это протокол, по
// которому врач проверяет материал перед отправкой. Мы сопоставляем пункты
// по ПОРЯДКУ, а порядок задаёт сервер. Если на сервере появится новый пункт,
// а в словаре его ещё нет, сопоставление по индексу молча сдвинется, и врач
// увидит перевод не того пункта. Это хуже, чем русский текст.
//
// Поэтому список берётся из словаря ТОЛЬКО при совпадении длины. Иначе —
// русский с сервера целиком: непереведённый протокол честнее подменённого.
// Расхождение длин ловится и раньше, на `npm run check:locales`.

import { useTranslation } from "react-i18next";
import { useCallback } from "react";

/**
 * @returns {(modality: object) => object} модальность с подписями на языке врача
 */
export function useModalityText() {
  const { t, i18n } = useTranslation("modalities");

  return useCallback(
    (m) => {
      if (!m?.key) return m;

      // Для русского берём то, что прислал сервер, и словарь не трогаем.
      // Русский там канонический: он же уходит в промпт. Иначе правка
      // протокола на сервере молча не доезжала бы до русского врача —
      // он видел бы старую формулировку из словаря.
      if (i18n.language?.startsWith("ru")) return m;

      const line = (field, fallback) => {
        const value = t(`${m.key}.${field}`, { defaultValue: "" });
        return String(value).trim() ? value : fallback;
      };

      const list = (field, fallback) => {
        const value = t(`${m.key}.${field}`, { returnObjects: true, defaultValue: null });
        const source = Array.isArray(fallback) ? fallback : [];
        // Совпадение длины — не придирка, а условие корректности: пункты
        // сопоставляются по порядку, и при другой длине они разъедутся.
        if (!Array.isArray(value) || value.length !== source.length) return source;
        return value;
      };

      return {
        ...m,
        title: line("title", m.title),
        purpose: line("purpose", m.purpose),
        binaryNote: m.binaryNote ? line("binaryNote", m.binaryNote) : m.binaryNote,
        checklist: list("checklist", m.checklist),
        redFlags: list("redFlags", m.redFlags),
      };
    },
    // i18n.language в зависимостях: без него функция остаётся замкнутой на
    // прежний язык, и переключение языка не перерисовывает справочник.
    [t, i18n.language],
  );
}

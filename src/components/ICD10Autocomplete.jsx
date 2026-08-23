import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import axios from "axios";

import { searchCodes, getCodesStats } from "../api/medicalCodes";

// Запасной источник — публичный API NLM (США). Использовался как основной, пока
// у нас не появился свой справочник (server/modules/medicalCodes).
const NLM_API = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search";

/**
 * Готовность своего справочника проверяется ОДИН раз на всё приложение и
 * кэшируется в модуле: компонент открывается в четырёх разных формах, и
 * дёргать /stats из каждой было бы расточительно.
 *
 * Зачем проверка вообще: код доезжает до прода раньше, чем туда загружают
 * справочник (74 тысячи кодов импортируются отдельным скриптом). Без этой
 * проверки первый же врач после деплоя остался бы с молчащим автокомплитом.
 * Как только импорт отработает, переключение произойдёт само, без правок.
 */
let localCatalogReady = null;
let catalogProbe = null;

async function isLocalCatalogReady() {
  if (localCatalogReady !== null) return localCatalogReady;
  if (!catalogProbe) {
    catalogProbe = getCodesStats()
      .then((stats) => {
        localCatalogReady = (stats?.total ?? 0) > 0;
        if (!localCatalogReady) {
          console.warn(
            "[ICD10] Свой справочник кодов пуст — ищу во внешнем API NLM. " +
              "Запустите modules/medicalCodes/scripts/importIcd10cm.js",
          );
        }
        return localCatalogReady;
      })
      .catch(() => {
        // Нет доступа (роль без прав) или эндпоинт недоступен — работаем как
        // раньше, через NLM. Форма не должна ломаться из-за справочника.
        localCatalogReady = false;
        return false;
      });
  }
  return catalogProbe;
}

/** Поиск во внешнем API NLM — прежнее поведение, теперь как запасной путь. */
async function searchViaNlm(query, signal) {
  const { data } = await axios.get(NLM_API, {
    params: { sf: "code,name", terms: query, maxList: 20 },
    signal,
  });
  const pairs = data[3] || [];
  return pairs.map(([code, name]) => ({ code, title: name }));
}

/**
 * Автокомплит для поиска кодов МКБ-10.
 *
 * Источник — свой справочник (/api/v1/medical-codes): работает без интернета,
 * отвечает за миллисекунды и понимает язык интерфейса врача. Пока справочник
 * не загружен, автоматически откатывается на публичный API NLM.
 *
 * Дропдаун рендерится через React Portal в document.body, чтобы не зависеть от
 * overflow/transform родителей.
 */
export default function ICD10Autocomplete({
  value,
  onChange,
  placeholder = "Search ICD-10 by code or English name...",
}) {
  const { t } = useTranslation("clinic");
  const [query, setQuery] = useState(
    value ? `${value.code} — ${value.title}` : "",
  );
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(false);
  // Координаты для дропдауна (он рендерится в body, поэтому нужны абсолютные координаты)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Синхронизация с внешним value
  useEffect(() => {
    if (!value) {
      setQuery("");
    } else {
      const formatted = `${value.code} — ${value.title}`;
      if (query !== formatted) setQuery(formatted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.code]);

  // Пересчёт позиции дропдауна (при открытии и при скролле/ресайзе)
  const updateCoords = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return;
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open]);

  // Дебаунс-поиск
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (value && query === `${value.code} — ${value.title}`) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const term = query.trim();
      const signal = abortRef.current.signal;

      try {
        let mapped;

        if (await isLocalCatalogReady()) {
          const data = await searchCodes(term, { limit: 20, signal });
          // Контракт с формами прежний — {code, title}. Остальные поля
          // (titleEn, isBillable) идут довеском и используются в списке.
          mapped = (data.items || []).map((item) => ({
            code: item.code,
            title: item.title,
            titleEn: item.titleEn,
            isBillable: item.isBillable,
          }));
        } else {
          mapped = await searchViaNlm(term, signal);
        }

        if (signal.aborted) return;
        setResults(mapped);
        setHighlight(0);
        setOpen(true);
        // Пересчитываем координаты, т.к. дропдаун появляется
        setTimeout(updateCoords, 0);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("ICD-10 search failed:", err);
          setResults([]);
        }
      } finally {
        if (!abortRef.current?.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, value]);

  // Закрытие по клику вне
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target) &&
        // также не закрываем при клике по самому дропдауну (он в body)
        !e.target.closest(".icd-dropdown-portal")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const select = (item) => {
    onChange({ code: item.code, title: item.title });
    setQuery(`${item.code} — ${item.title}`);
    setOpen(false);
    setResults([]);
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const onInputChange = (e) => {
    setQuery(e.target.value);
    if (value) onChange(null);
  };

  // ── Дропдаун (рендерится в document.body) ──
  const dropdown =
    open && (loading || results.length > 0 || query.trim().length >= 2) ? (
      <div
        className="icd-dropdown-portal"
        style={{
          position: "absolute",
          top: coords.top,
          left: coords.left,
          width: coords.width,
          zIndex: 99999,
          background: "#fff",
          border: "1px solid #dde4ec",
          borderRadius: 10,
          boxShadow: "0 8px 32px rgba(10,30,60,.18)",
          maxHeight: 280,
          overflowY: "auto",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        {loading && (
          <div
            style={{
              padding: 14,
              textAlign: "center",
              color: "#7089a6",
              fontSize: 12,
            }}
          >
            {t("icd.searching")}
          </div>
        )}
        {!loading && results.length === 0 && query.trim().length >= 2 && (
          <div
            style={{
              padding: 14,
              textAlign: "center",
              color: "#7089a6",
              fontSize: 12,
            }}
          >
            {t("icd.noMatches")}
          </div>
        )}
        {!loading &&
          results.map((item, i) => (
            <div
              key={item.code}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                select(item);
              }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                color: i === highlight ? "#094d44" : "#3d4f63",
                background: i === highlight ? "#e8f7f5" : "transparent",
                borderBottom: "1px solid #f0f3f7",
                display: "flex",
                gap: 10,
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: "#0d6b5e",
                  fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
                  minWidth: 72,
                  fontSize: 12,
                }}
              >
                {item.code}
              </span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>
                {item.title}
                {/* Оригинал показываем, только когда он отличается от
                    отображаемого названия: иначе строка дублирует сама себя.
                    Врач часто сверяется с английской формулировкой. */}
                {item.titleEn && item.titleEn !== item.title && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      color: "#7089a6",
                      marginTop: 2,
                    }}
                  >
                    {item.titleEn}
                  </span>
                )}
              </span>
              {/* Рубрику-заголовок нельзя ставить диагнозом — нужен конечный
                  код. Предупреждаем здесь, а не после отказа сохранения. */}
              {item.isBillable === false && (
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 10,
                    color: "#92400e",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 100,
                    padding: "1px 7px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("icd.category")}
                </span>
              )}
            </div>
          ))}
      </div>
    ) : null;

  return (
    <div className="icd-wrap" ref={wrapRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={onInputChange}
        onFocus={() => {
          if (results.length > 0) {
            setOpen(true);
            setTimeout(updateCoords, 0);
          }
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: "100%",
          height: 52,
          padding: "0 14px",
          background: "#f7f9fb",
          border: "1.5px solid #dde4ec",
          borderRadius: 10,
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 13,
          color: "#1a2533",
          outline: "none",
          transition: "all .18s",
          boxSizing: "border-box",
        }}
        onFocusCapture={(e) => {
          e.target.style.borderColor = "#0f8a7a";
          e.target.style.boxShadow = "0 0 0 3px rgba(13,107,94,.1)";
          e.target.style.background = "#fff";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#dde4ec";
          e.target.style.boxShadow = "none";
          e.target.style.background = "#f7f9fb";
        }}
      />

      {/* Дропдаун рендерится в body через portal */}
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}

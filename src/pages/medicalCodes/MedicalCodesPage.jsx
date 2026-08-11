// client/src/pages/medicalCodes/MedicalCodesPage.jsx
//
// Справочник медицинских кодов. Маршрут: /medical-codes
//
// Отдельная страница, а не только автокомплит внутри формы приёма: врачу
// регулярно нужно просто НАЙТИ код — уточнить рубрику, свериться с
// формулировкой, скопировать в направление или выписку. Раньше для этого
// приходилось открывать форму приёма или искать в интернете.
//
// Поиск идёт по своей базе (server/modules/medicalCodes), а не по внешнему
// API: работает без интернета и отвечает мгновенно.
//
// Честность интерфейса: страница прямо показывает, сколько кодов переведено на
// язык врача. Пока переводов нет, поиск идёт по-английски, и врач должен
// понимать почему, а не гадать, почему «тонзиллит» ничего не находит.

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { searchCodes, getCodesStats, CODE_SYSTEMS } from "../../api/medicalCodes";
import "../education/education.css";
import "./medicalCodes.css";

// Задержка перед запросом: врач печатает, а не отправляет форму. 250мс —
// компромисс между «мгновенно» и «не бить по базе на каждую букву».
const DEBOUNCE_MS = 250;

// Что ищем. Болезни и вмешательства лежат в одной коллекции, но врач обычно
// ищет что-то одно: заполняя диагноз — болезнь, оформляя операцию — процедуру.
// Без фильтра выдача смешивается, и по слову "tonsil" приходят и тонзиллит, и
// тонзиллэктомия.
const FILTERS = [
  { value: "", labelKey: "filterAll", fallback: "Всё" },
  { value: CODE_SYSTEMS.ICD10CM, labelKey: "filterDiseases", fallback: "Болезни" },
  {
    value: CODE_SYSTEMS.ICD9CM_SG,
    labelKey: "filterProcedures",
    fallback: "Операции",
  },
];

export default function MedicalCodesPage() {
  const { t, i18n } = useTranslation("medicalCodes");

  const [query, setQuery] = useState("");
  const [system, setSystem] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");

  const abortRef = useRef(null);
  const timerRef = useRef(null);

  const isRTL = i18n.language === "ar";

  useEffect(() => {
    getCodesStats()
      .then(setStats)
      .catch(() => {
        // Статистика — справочная. Её отсутствие не должно мешать искать.
        setStats(null);
      });
  }, []);

  const runSearch = useCallback(
    async (value, systemFilter) => {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setItems([]);
        setError("");
        setLoading(false);
        return;
      }

      // Отменяем предыдущий запрос: иначе медленный ответ на "тон" может
      // прийти после быстрого на "тонзиллит" и затереть правильный список.
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError("");

      try {
        const data = await searchCodes(trimmed, {
          system: systemFilter || undefined,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setItems(data.items || []);
      } catch (err) {
        if (controller.signal.aborted || err.name === "CanceledError") return;
        setError(
          err?.response?.status === 403
            ? t("errForbidden", "Справочник доступен медицинскому персоналу")
            : t("errSearch", "Не удалось выполнить поиск. Попробуйте ещё раз."),
        );
        setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [t],
  );

  function handleChange(event) {
    const value = event.target.value;
    setQuery(value);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(value, system), DEBOUNCE_MS);
  }

  // Смена фильтра ищет заново сразу, без задержки: это осознанный клик, а не
  // набор текста, и ждать четверть секунды после него незачем.
  function handleSystemChange(nextSystem) {
    setSystem(nextSystem);
    if (timerRef.current) clearTimeout(timerRef.current);
    runSearch(query, nextSystem);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 1500);
    } catch {
      // Буфер обмена недоступен (не тот протокол, отказ в правах) — молча
      // ничего не делаем: код виден на экране, его можно выделить руками.
    }
  }

  // Счётчик считает ВСЕ системы, а не только болезни. Раньше он показывал
  // только icd10cm, и выходило, что страница ищет операции, которых по её же
  // словам в базе нет.
  const diseases = stats?.bySystem?.[CODE_SYSTEMS.ICD10CM]?.total ?? 0;
  const procedures = stats?.bySystem?.[CODE_SYSTEMS.ICD9CM_SG]?.total ?? 0;
  const totalLoaded = stats?.total ?? diseases + procedures;

  // Переводы догружаются партиями и идут по алфавиту кодов, поэтому «переведено
  // или нет» — не двоичное состояние. Врачу показываем долю: иначе непонятно,
  // почему «холера» находится по-русски, а «диабет» нет.
  const translatedCount = stats
    ? Object.values(stats.bySystem ?? {}).reduce(
        (sum, s) => sum + (s.translated?.[i18n.language] ?? 0),
        0,
      )
    : 0;
  const coverage = totalLoaded > 0 ? translatedCount / totalLoaded : 0;
  // Порог, а не «ноль переводов»: при 5% переведённых предупреждение нужно
  // ровно так же, как при нуле.
  const showTranslationNotice =
    stats && i18n.language !== "en" && totalLoaded > 0 && coverage < 0.9;

  return (
    <div className="mc-page" dir={isRTL ? "rtl" : "ltr"}>
      <header className="mc-head">
        <h1 className="mc-title">
          {t("title", "Справочник кодов")}
        </h1>
        <p className="mc-sub">
          {t(
            "subtitle",
            "Международная классификация болезней. Поиск по коду или названию.",
          )}
        </p>
      </header>

      {showTranslationNotice && (
        <div className="mc-notice" role="status">
          {translatedCount === 0
            ? t(
                "noticeEnglishOnly",
                "Названия пока только на английском — переводы загружаются отдельно. Ищите по коду или английскому названию.",
              )
            : t("noticePartial", {
                defaultValue:
                  "Переведено {{done}} названий из {{total}} — остальные пока на английском. Переводы догружаются по порядку кодов.",
                done: translatedCount.toLocaleString(),
                total: totalLoaded.toLocaleString(),
              })}
        </div>
      )}

      <div className="mc-searchbar">
        <input
          className="edu-input mc-input"
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={t("placeholder", "Код или название: J35.01, тонзиллит…")}
          autoFocus
          aria-label={t("title", "Справочник кодов")}
        />
        {loading && <span className="mc-spinner" aria-hidden="true" />}
      </div>

      <div className="mc-filters" role="group" aria-label={t("title", "Справочник кодов")}>
        {FILTERS.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            className={`mc-filter${system === filter.value ? " is-active" : ""}`}
            onClick={() => handleSystemChange(filter.value)}
            aria-pressed={system === filter.value}
          >
            {t(filter.labelKey, filter.fallback)}
          </button>
        ))}
      </div>

      {error && <div className="mc-error">{error}</div>}

      {!error && query.trim().length >= 2 && !loading && items.length === 0 && (
        <div className="mc-empty">
          {t("nothingFound", "Ничего не найдено")}
        </div>
      )}

      {items.length > 0 && (
        <ul className="mc-list">
          {items.map((item) => (
            <li className="mc-item" key={`${item.system}-${item.code}`}>
              <button
                type="button"
                className="mc-code"
                onClick={() => copyCode(item.code)}
                title={t("copyHint", "Скопировать код")}
              >
                {item.code}
                {copiedCode === item.code && (
                  <span className="mc-copied">
                    {t("copied", "скопировано")}
                  </span>
                )}
              </button>

              <div className="mc-body">
                <div className="mc-name">{item.title}</div>
                {/* Английское название показываем, только когда оно отличается
                    от отображаемого: иначе строка дублируется сама собой. */}
                {item.titleEn && item.titleEn !== item.title && (
                  <div className="mc-name-en">{item.titleEn}</div>
                )}
                {item.parentCode && (
                  <div className="mc-parent">
                    {t("group", "Рубрика")}: {item.parentCode}
                  </div>
                )}
              </div>

              {/* Рубрику-заголовок ставить в карту нельзя — нужен конечный
                  код. Врача предупреждаем здесь, а не после отказа сохранения. */}
              {item.isBillable === false && (
                <span className="mc-flag">
                  {t("notBillable", "рубрика, не для диагноза")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {stats && (
        <footer className="mc-stats">
          {t("loadedCodes", "Загружено кодов")}: {totalLoaded.toLocaleString()}
          {procedures > 0 && (
            <span className="mc-stats-hint">
              {" ("}
              {t("filterDiseases", "Болезни")}: {diseases.toLocaleString()}
              {", "}
              {t("filterProcedures", "Операции")}: {procedures.toLocaleString()}
              {")"}
            </span>
          )}
          {stats.searchStrategy === "regex" && (
            <span className="mc-stats-hint">
              {" · "}
              {t("strictSearch", "точный поиск (без учёта опечаток)")}
            </span>
          )}
        </footer>
      )}
    </div>
  );
}

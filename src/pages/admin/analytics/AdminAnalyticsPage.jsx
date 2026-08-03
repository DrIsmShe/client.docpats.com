// client/src/pages/admin/analytics/AdminAnalyticsPage.jsx
//
// Админка → «Посещаемость». Маршрут: /admin/analytics
//
// Вся статистика сайта в одном месте: обзор, экраны, аудитория, источники,
// события, скорость, живая панель и журнал событий. Данные приходят с
// собственного бэкенда (/admin/analytics), который читает их из PostHog —
// ключ чтения статистики в браузер не попадает.
//
// ЧТО ЗДЕСЬ ЕСТЬ И ЧЕГО НЕТ. Дашборд показывает ровно то, что собирает
// клиентский счётчик (src/lib/analytics.js): экраны в виде ШАБЛОНОВ пути,
// зоны и технические свойства визита. Ни имён, ни диагнозов, ни
// идентификаторов записей здесь быть не может — они не отправляются наружу.

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAnalyticsStatus, fetchOverview, fetchPages, fetchAudience,
  fetchAcquisition, fetchBehavior, fetchPerformance, fetchLive,
  fetchEventLog, refreshAnalytics, rows,
} from "../../../api/analytics";
import { readApiError, isAuthError } from "../../../api/education";
import { Table, Section, dateTime } from "./parts";
import {
  OverviewTab, PagesTab, AudienceTab, AcquisitionTab,
  BehaviorTab, PerformanceTab, LiveTab,
} from "./tabs";
import "./analytics.css";

// Вкладки в порядке «от общего к частному». Журнал стоит последним: это
// сырые события, к ним спускаются, когда сводки уже не хватает.
const TABS = [
  { key: "overview", title: "Обзор", load: fetchOverview, Component: OverviewTab },
  { key: "pages", title: "Экраны", load: fetchPages, Component: PagesTab },
  { key: "audience", title: "Аудитория", load: fetchAudience, Component: AudienceTab },
  { key: "acquisition", title: "Источники", load: fetchAcquisition, Component: AcquisitionTab },
  { key: "behavior", title: "События", load: fetchBehavior, Component: BehaviorTab },
  { key: "performance", title: "Скорость", load: fetchPerformance, Component: PerformanceTab },
  { key: "live", title: "Сейчас", load: () => fetchLive(), Component: LiveTab },
  { key: "log", title: "Журнал", load: null, Component: null },
];

const PERIODS = [
  { days: 1, title: "Сутки" },
  { days: 7, title: "7 дней" },
  { days: 30, title: "30 дней" },
  { days: 90, title: "90 дней" },
  { days: 365, title: "Год" },
];

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [days, setDays] = useState(30);
  const [status, setStatus] = useState(null);

  // Кеш загруженных вкладок: ключ «вкладка:период». Переключение туда-обратно
  // не должно дёргать PostHog заново — за его запросы платят.
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsStatus()
      .then(setStatus)
      .catch((err) => {
        if (isAuthError(err)) return navigate("/login");
        setStatus({ configured: false });
      });
  }, [navigate]);

  const current = TABS.find((t) => t.key === tab);
  const cacheKey = `${tab}:${tab === "live" ? "live" : days}`;

  const load = useCallback(
    async (force = false) => {
      if (!current?.load) return;
      if (!force && cache[cacheKey]) return;

      setLoading(true);
      setError(null);
      try {
        const res = await current.load(days);
        if (res.configured === false) {
          setStatus({ configured: false, message: res.message });
          return;
        }
        setCache((prev) => ({ ...prev, [cacheKey]: res.data }));
      } catch (err) {
        if (isAuthError(err)) return navigate("/login");
        setError(readApiError(err, "Не удалось загрузить статистику"));
      } finally {
        setLoading(false);
      }
    },
    [current, cache, cacheKey, days, navigate],
  );

  useEffect(() => {
    load();
    // Живую вкладку обновляем сами: раз в минуту, пока она открыта.
    if (tab !== "live") return undefined;
    const timer = setInterval(() => load(true), 60_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, days]);

  async function handleRefresh() {
    try {
      await refreshAnalytics();
    } catch {
      // Кеш на сервере мог и не сброситься — перезагрузку вкладки это не
      // отменяет, поэтому ошибку глотаем молча.
    }
    setCache({});
    load(true);
  }

  if (status && !status.configured) return <NotConfigured message={status.message} />;

  const data = cache[cacheKey];
  const Component = current?.Component;

  return (
    <div className="an-page">
      <header className="an-head">
        <div>
          <h1 className="an-title">Посещаемость</h1>
          <p className="an-subtitle">
            Что из построенного открывают: экраны, аудитория, источники и скорость.
            Наружу уходят только шаблоны путей — ни имён, ни идентификаторов записей здесь нет.
          </p>
        </div>
        <div className="an-head__actions">
          <button type="button" className="an-btn" onClick={handleRefresh} disabled={loading}>
            {loading ? "Обновляю…" : "Обновить"}
          </button>
        </div>
      </header>

      <nav className="an-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`an-tab${tab === t.key ? " is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.title}
          </button>
        ))}
      </nav>

      {tab !== "live" && (
        <div className="an-filters">
          <span className="an-filters__label">Период:</span>
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              className={`an-chip${days === p.days ? " is-active" : ""}`}
              onClick={() => setDays(p.days)}
            >
              {p.title}
            </button>
          ))}
          {status?.cacheTtlMinutes ? (
            <span className="an-filters__hint">
              данные кешируются на {status.cacheTtlMinutes} мин
            </span>
          ) : null}
        </div>
      )}

      {error && <div className="an-error">{error}</div>}

      {tab === "log" ? (
        <EventLog navigate={navigate} />
      ) : loading && !data ? (
        <div className="an-loading">Загружаю статистику…</div>
      ) : data && Component ? (
        // Период нужен вкладке «События»: детализация конкретного события
        // догружается по клику и должна спрашивать тот же отрезок времени.
        <Component data={data} days={days} />
      ) : !error ? (
        <div className="an-loading">Нет данных</div>
      ) : null}
    </div>
  );
}

/** Модуль не настроен — объясняем ровно, что сделать. */
function NotConfigured({ message }) {
  return (
    <div className="an-page">
      <h1 className="an-title">Посещаемость</h1>
      <div className="an-notice">
        <p>{message || "Аналитика не настроена."}</p>
        <p>Чтобы дашборд заработал, нужны две вещи:</p>
        <ol>
          <li>
            <b>Ключ чтения на сервере.</b> В <code>server/.env</code> — <code>POSTHOG_API_KEY</code>{" "}
            (Personal API Key, scope <code>query:read</code>), <code>POSTHOG_PROJECT_ID</code> и{" "}
            <code>POSTHOG_HOST</code>. После правки: <code>pm2 restart all --update-env</code> —
            обычный рестарт переменные не перечитывает.
          </li>
          <li>
            <b>Ключ записи во фронтенде.</b> <code>REACT_APP_POSTHOG_KEY</code> в переменных
            Netlify — без него приложение не отправляет ни одного события, и считать будет нечего.
          </li>
        </ol>
      </div>
    </div>
  );
}

/**
 * Журнал событий — то же, что Activity → Explore в самом PostHog, только под
 * своей админкой. Нужен, когда сводки не отвечают на вопрос и надо смотреть
 * поток событий как есть.
 */
function EventLog({ navigate }) {
  const [filters, setFilters] = useState({ days: 7, event: "", screen: "", limit: 100 });
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEventLog(filters);
      setLog(rows(res.data));
    } catch (err) {
      if (isAuthError(err)) return navigate("/login");
      setError(readApiError(err, "Не удалось загрузить журнал"));
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Section
      title="Журнал событий"
      note="Поток событий как они пришли. Фильтры складываются: пустое поле не ограничивает."
      wide
    >
      <div className="an-form">
        <label className="an-field">
          <span>Период, дней</span>
          <input type="number" min="1" max="365" value={filters.days} onChange={set("days")} />
        </label>
        <label className="an-field">
          <span>Событие</span>
          <input type="text" placeholder="$pageview" value={filters.event} onChange={set("event")} />
        </label>
        <label className="an-field">
          <span>Экран</span>
          <input type="text" placeholder="/dp/polyclinic" value={filters.screen} onChange={set("screen")} />
        </label>
        <label className="an-field">
          <span>Строк</span>
          <input type="number" min="1" max="500" value={filters.limit} onChange={set("limit")} />
        </label>
        <button type="button" className="an-btn" onClick={run} disabled={loading}>
          {loading ? "Ищу…" : "Показать"}
        </button>
      </div>

      {error && <div className="an-error">{error}</div>}

      <Table
        columns={[
          ["timestamp", "Время", (v) => dateTime(v)],
          ["event", "Событие"],
          ["screen", "Экран"],
          ["zone", "Зона"],
          ["country", "Страна"],
          ["city", "Город"],
          ["device", "Устройство"],
          ["browser", "Браузер"],
          ["os", "ОС"],
          ["referrer", "Источник"],
          ["distinctId", "Посетитель"],
        ]}
        data={log}
        empty={loading ? "Загружаю…" : "Событий по фильтру нет"}
      />
    </Section>
  );
}

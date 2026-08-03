// client/src/pages/admin/analytics/tabs.jsx
//
// Содержимое семи вкладок дашборда. Каждая получает уже загруженный объект
// data (см. AdminAnalyticsPage) и только раскладывает его по блокам.
//
// У каждого графика рядом стоит таблица с теми же числами. Это не дублирование
// ради объёма: график отвечает на вопрос «какая форма», таблица — «сколько
// именно», и она же остаётся единственным читаемым каналом, если цвета
// неразличимы.

import React, { useEffect, useState } from "react";
import { rows, firstRow, blockError, fetchEventDetail } from "../../../api/analytics";
import {
  Stat, Section, Table, BlockState, TimeChart, PulseChart, RankChart, ColumnChart,
  num, pct, duration, dateTime, shortDate,
} from "./parts";

// Ряд плиток — общий заголовок любой вкладки.
const Tiles = ({ children }) => <div className="an-stats">{children}</div>;

/** Изменение к прошлому периоду. Прошлого нет — стрелку не показываем. */
function delta(now, before) {
  const a = Number(now);
  const b = Number(before);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return (a - b) / b;
}

// ─── Обзор ──────────────────────────────────────────────────────
export function OverviewTab({ data }) {
  const kpi = firstRow(data.kpi);
  const prev = firstRow(data.kpiPrev);
  const ses = firstRow(data.sessions);
  const cov = firstRow(data.coverage);
  const daily = rows(data.daily);
  const nvr = rows(data.newVsReturning);

  const newVisitors = nvr.find((r) => r.kind === "new")?.visitors ?? 0;
  const returning = nvr.find((r) => r.kind === "returning")?.visitors ?? 0;

  return (
    <>
      <Tiles>
        <Stat label="Посетителей" value={num(kpi.visitors)} delta={delta(kpi.visitors, prev.visitors)} />
        <Stat label="Сессий" value={num(kpi.sessions)} delta={delta(kpi.sessions, prev.sessions)} />
        <Stat label="Просмотров экранов" value={num(kpi.pageviews)} delta={delta(kpi.pageviews, prev.pageviews)} />
        <Stat label="Событий всего" value={num(kpi.events)} delta={delta(kpi.events, prev.events)} />
        <Stat label="Разных экранов" value={num(kpi.screens)} hint="из ~560 маршрутов" />
        <Stat label="Средняя сессия" value={duration(ses.avgDurationSec)} hint={`медиана ${duration(ses.medianDurationSec)}`} />
        <Stat label="Экранов за сессию" value={num(ses.avgPageviews)} />
        <Stat label="Отказы" value={pct(ses.bounceRate)} hint="сессии с одним экраном" />
        <Stat label="Новые" value={num(newVisitors)} hint={`вернувшихся ${num(returning)}`} />
      </Tiles>

      <Section
        title="Динамика по дням"
        note="Три линии отвечают на разные вопросы: посетители — сколько людей, сессии — сколько заходов, просмотры — сколько работы внутри."
      >
        <BlockState error={blockError(data.daily)}>
          <TimeChart
            data={daily}
            series={[
              { key: "visitors", name: "Посетители" },
              { key: "sessions", name: "Сессии" },
              { key: "pageviews", name: "Просмотры" },
            ]}
          />
          <Table
            columns={[
              ["day", "День", (v) => shortDate(v)],
              ["visitors", "Посетители"],
              ["sessions", "Сессии"],
              ["pageviews", "Просмотры"],
              ["events", "События"],
            ]}
            data={[...daily].reverse()}
            max={14}
          />
        </BlockState>
      </Section>

      <Section title="Часы суток" note="Когда системой реально пользуются. Время серверное, UTC.">
        <BlockState error={blockError(data.byHour)}>
          <ColumnChart data={rows(data.byHour)} xKey="hour" yKey="events" yName="События" formatX={(h) => `${h}:00`} />
        </BlockState>
      </Section>

      <Section title="Дни недели" note="Будни против выходных: видно, рабочий это инструмент или его открывают дома.">
        <BlockState error={blockError(data.byWeekday)}>
          <ColumnChart
            data={rows(data.byWeekday)}
            xKey="weekday"
            yKey="events"
            yName="События"
            colorIndex={1}
            formatX={(d) => ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][d] || d}
          />
        </BlockState>
      </Section>

      <Section title="Охват данных" note="С какого момента вообще что-то собрано. Отвечает на вопрос, пусто ли из-за отсутствия трафика или из-за молчащего счётчика.">
        <Tiles>
          <Stat label="Первое событие" value={dateTime(cov.firstEvent)} />
          <Stat label="Последнее событие" value={dateTime(cov.lastEvent)} />
          <Stat label="Событий за всё время" value={num(cov.eventsAllTime)} />
          <Stat label="Посетителей за всё время" value={num(cov.visitorsAllTime)} />
        </Tiles>
      </Section>
    </>
  );
}

// ─── Экраны ─────────────────────────────────────────────────────
export function PagesTab({ data }) {
  const zones = rows(data.zones);
  const screens = rows(data.screens);

  return (
    <>
      <Section title="Зоны приложения" note="Крупная группировка поверх всех маршрутов — именно она отвечает на вопрос, каким из модулей пользуются.">
        <BlockState error={blockError(data.zones)}>
          <RankChart data={zones} nameKey="zone" valueKey="pageviews" valueName="Просмотры" />
          <Table
            columns={[["zone", "Зона"], ["pageviews", "Просмотры"], ["visitors", "Посетители"], ["sessions", "Сессии"]]}
            data={zones}
          />
        </BlockState>
      </Section>

      <Section title="Экраны" note="Полный список открытых экранов. Пусто напротив маршрута значит, что за период его не открыл никто." wide>
        <BlockState error={blockError(data.screens)}>
          <RankChart data={screens} nameKey="screen" valueKey="pageviews" valueName="Просмотры" max={15} />
          <Table
            columns={[["screen", "Экран"], ["zone", "Зона", (v) => v || "—"], ["pageviews", "Просмотры"], ["visitors", "Посетители"], ["sessions", "Сессии"]]}
            data={screens}
            max={60}
          />
        </BlockState>
      </Section>

      <div className="an-cols">
        <Section title="Точки входа" note="С какого экрана начинают работу.">
          <BlockState error={blockError(data.entryPages)}>
            <Table columns={[["screen", "Экран"], ["sessions", "Сессий"]]} data={rows(data.entryPages)} max={20} />
          </BlockState>
        </Section>

        <Section title="Точки выхода" note="Где заканчивают. Много выходов — либо тупик в сценарии, либо, наоборот, цель достигнута.">
          <BlockState error={blockError(data.exitPages)}>
            <Table columns={[["screen", "Экран"], ["sessions", "Сессий"]]} data={rows(data.exitPages)} max={20} />
          </BlockState>
        </Section>
      </div>

      <Section
        title="Вовлечённость по экранам"
        note="Сколько времени проводят и насколько прокручивают. Последний экран сессии сюда не попадает: длительность приходит вместе со следующим просмотром."
        wide
      >
        <BlockState error={blockError(data.engagement)}>
          <Table
            columns={[
              ["screen", "Экран"],
              ["samples", "Замеров"],
              ["avgSeconds", "В среднем", (v) => duration(v)],
              ["medianSeconds", "Медиана", (v) => duration(v)],
              ["avgScrollPct", "Прокрутка", (v) => (v == null ? "—" : `${num(v)} %`)],
            ]}
            data={rows(data.engagement)}
            max={30}
          />
        </BlockState>
      </Section>

      <Section title="Переходы между экранами" note="Откуда куда идут — готовый маршрут пользователя по продукту." wide>
        <BlockState error={blockError(data.transitions)}>
          <Table columns={[["from", "Откуда"], ["to", "Куда"], ["count", "Переходов"]]} data={rows(data.transitions)} max={30} />
        </BlockState>
      </Section>
    </>
  );
}

// ─── Аудитория ──────────────────────────────────────────────────
export function AudienceTab({ data }) {
  const identified = rows(data.identified);
  const anon = identified.find((r) => r.identified === "anonymous")?.visitors ?? 0;
  const known = identified.find((r) => r.identified === "identified")?.visitors ?? 0;

  // Один и тот же разрез повторяется десяток раз — описываем списком.
  const breakdowns = [
    ["Страны", data.countries, "country", "Страна"],
    ["Города", data.cities, "city", "Город"],
    ["Регионы", data.regions, "region", "Регион"],
    ["Типы устройств", data.deviceTypes, "deviceType", "Устройство"],
    ["Браузеры", data.browsers, "browser", "Браузер"],
    ["Операционные системы", data.os, "os", "ОС"],
    ["Языки интерфейса", data.languages, "language", "Язык"],
    ["Часовые пояса", data.timezones, "timezone", "Пояс"],
    ["Модели устройств", data.deviceModels, "deviceModel", "Модель"],
  ];

  return (
    <>
      <Tiles>
        <Stat label="Опознанных" value={num(known)} hint="вошли в систему" />
        <Stat label="Анонимных" value={num(anon)} hint="профиль не создаётся" />
      </Tiles>

      <Section title="География" note="Откуда заходят. Считается по IP силами PostHog, приложение таких данных не отправляет.">
        <BlockState error={blockError(data.countries)}>
          <RankChart data={rows(data.countries)} nameKey="country" valueKey="visitors" valueName="Посетители" colorIndex={2} />
        </BlockState>
      </Section>

      <div className="an-cols">
        {breakdowns.map(([title, block, key, header]) => (
          <Section key={title} title={title}>
            <BlockState error={blockError(block)}>
              <Table
                columns={[[key, header], ["visitors", "Посетители"], ["sessions", "Сессии"], ["events", "События"]]}
                data={rows(block)}
                max={15}
              />
            </BlockState>
          </Section>
        ))}

        <Section title="Версии браузеров" note="По ним видно, у кого может ломаться вёрстка.">
          <BlockState error={blockError(data.browserVersions)}>
            <Table columns={[["browser", "Браузер"], ["version", "Версия"], ["visitors", "Посетители"]]} data={rows(data.browserVersions)} max={15} />
          </BlockState>
        </Section>

        <Section title="Разрешения экранов">
          <BlockState error={blockError(data.screenSizes)}>
            <Table columns={[["size", "Разрешение"], ["visitors", "Посетители"]]} data={rows(data.screenSizes)} max={15} />
          </BlockState>
        </Section>

        <Section title="Ширина окна" note="Именно она решает, какой сработает медиазапрос. Округлено до сотни пикселей.">
          <BlockState error={blockError(data.viewportWidths)}>
            <Table columns={[["width", "Ширина, px"], ["visitors", "Посетители"]]} data={rows(data.viewportWidths)} max={15} />
          </BlockState>
        </Section>

        <Section title="Частота визитов" note="Сколько дней за период заходил каждый. Показывает, есть ли ядро постоянных пользователей.">
          <BlockState error={blockError(data.frequency)}>
            <Table columns={[["activeDays", "Дней с визитами"], ["visitors", "Посетителей"]]} data={rows(data.frequency)} max={20} />
          </BlockState>
        </Section>
      </div>
    </>
  );
}

// ─── Источники ──────────────────────────────────────────────────
export function AcquisitionTab({ data }) {
  const utm = [
    ["utm_source", data.utmSource, "source"],
    ["utm_medium", data.utmMedium, "medium"],
    ["utm_campaign", data.utmCampaign, "campaign"],
    ["utm_content", data.utmContent, "content"],
    ["utm_term", data.utmTerm, "term"],
  ];

  return (
    <>
      <Section title="Каналы привлечения" note="Грубая классификация входов в сессию: прямые заходы, поиск, соцсети, внутренние переходы.">
        <BlockState error={blockError(data.channels)}>
          <RankChart data={rows(data.channels)} nameKey="channel" valueKey="sessions" valueName="Сессии" colorIndex={1} />
          <Table columns={[["channel", "Канал"], ["sessions", "Сессий"]]} data={rows(data.channels)} />
        </BlockState>
      </Section>

      <Section title="Источники входа в сессию" note="Откуда человек пришёл на сайт вообще. Только эта таблица отвечает на вопрос про привлечение.">
        <BlockState error={blockError(data.sessionSources)}>
          <Table columns={[["source", "Источник"], ["sessions", "Сессий"], ["visitors", "Посетителей"]]} data={rows(data.sessionSources)} max={25} />
        </BlockState>
      </Section>

      <div className="an-cols">
        <Section title="Referrer событий" note="Включая внутренние переходы — поэтому здесь ожидаемо лидирует сам docpats.com.">
          <BlockState error={blockError(data.referrers)}>
            <Table columns={[["referrer", "Домен"], ["events", "Событий"], ["visitors", "Посетителей"]]} data={rows(data.referrers)} max={20} />
          </BlockState>
        </Section>

        <Section title="Адреса-источники" note="Конкретные страницы, с которых пришли.">
          <BlockState error={blockError(data.referrerUrls)}>
            <Table columns={[["url", "Адрес"], ["sessions", "Сессий"]]} data={rows(data.referrerUrls)} max={20} />
          </BlockState>
        </Section>
      </div>

      <Section title="UTM-метки" note="Заполнятся, когда пойдут рекламные кампании. Пустые таблицы здесь — норма, а не ошибка." wide>
        <div className="an-cols">
          {utm.map(([title, block, key]) => (
            <div key={title}>
              <h3 className="an-subtitle">{title}</h3>
              <BlockState error={blockError(block)}>
                <Table
                  columns={[[key, "Значение"], ["sessions", "Сессий"], ["visitors", "Посетителей"]]}
                  data={rows(block)}
                  empty="Меток нет"
                  max={10}
                />
              </BlockState>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// ─── События ────────────────────────────────────────────────────
export function BehaviorTab({ data, days }) {
  const events = rows(data.events);
  const custom = rows(data.customEvents);
  const retention = rows(data.retention);

  // Свойства всех продуктовых событий приходят одним плоским списком
  // { event, key, value, count } — группируем по событию, чтобы под каждым
  // показать его собственные разрезы.
  const propsByEvent = {};
  for (const row of rows(data.customEventProps)) {
    (propsByEvent[row.event] ||= []).push(row);
  }

  return (
    <>
      <Section title="Типы событий" note="И собственные, и служебные, которые библиотека шлёт сама.">
        <BlockState error={blockError(data.events)}>
          <RankChart data={events} nameKey="event" valueKey="count" valueName="Событий" max={10} />
          <Table
            columns={[["event", "Событие"], ["count", "Всего"], ["visitors", "Посетителей"], ["sessions", "Сессий"], ["lastSeen", "Последнее", (v) => dateTime(v)]]}
            data={events}
            max={30}
          />
        </BlockState>
      </Section>

      <Section
        title="Продуктовые события"
        note="Действия в модулях: попытки в арене, записи на приём, надиктовки, консультации. Разверните строку, чтобы увидеть разрезы события — станцию, режим, роль. Полный список имён заведён в client/src/lib/events.js."
        wide
      >
        <BlockState error={blockError(data.customEvents)}>
          {custom.length ? (
            custom.map((row) => (
              <EventRow
                key={row.event}
                row={row}
                breakdown={propsByEvent[row.event] || []}
                days={days}
              />
            ))
          ) : (
            <div className="an-empty">За период таких действий не было</div>
          )}
        </BlockState>
      </Section>

      <Section title="Возвращаемость по неделям" note="Сколько из пришедших на неделе N были активны спустя 1, 2, 3 недели.">
        <BlockState error={blockError(data.retention)}>
          <Table
            columns={[
              ["cohortWeek", "Неделя прихода", (v) => shortDate(v)],
              ["weeksLater", "Недель спустя"],
              ["visitors", "Активных"],
            ]}
            data={retention}
            max={30}
          />
        </BlockState>
      </Section>

      <div className="an-cols">
        <Section title="Ошибки фронтенда" note="Появятся, если включить отслеживание исключений в PostHog.">
          <BlockState error={blockError(data.exceptions)}>
            <Table
              columns={[["message", "Сообщение"], ["count", "Раз"], ["visitors", "У скольких"], ["lastSeen", "Последний раз", (v) => dateTime(v)]]}
              data={rows(data.exceptions)}
              empty="Ошибок не зафиксировано"
              max={20}
            />
          </BlockState>
        </Section>

        <Section title="Флаги функциональности">
          <BlockState error={blockError(data.featureFlags)}>
            <Table columns={[["flag", "Флаг"], ["events", "Событий"]]} data={rows(data.featureFlags)} empty="Флаги не используются" max={20} />
          </BlockState>
        </Section>

        <Section title="Версии SDK на клиентах" note="Разные версии значат, что у части пользователей в браузере висит старая сборка.">
          <BlockState error={blockError(data.sdkVersions)}>
            <Table columns={[["lib", "Библиотека"], ["version", "Версия"], ["events", "Событий"]]} data={rows(data.sdkVersions)} max={15} />
          </BlockState>
        </Section>
      </div>
    </>
  );
}

/**
 * Строка продуктового события с раскрытием.
 *
 * Свёрнутая показывает счётчики, развёрнутая — разрезы по свойствам. Разрезы
 * приходят уже загруженными вместе со вкладкой (один запрос на все события),
 * а вот динамика по дням и экраны догружаются по клику: тянуть их для сорока
 * событий разом значило бы сорок запросов к PostHog ради строки, на которую,
 * скорее всего, никто не нажмёт.
 */
function EventRow({ row, breakdown, days }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || detail || error) return;
    let alive = true;
    fetchEventDetail(row.event, days)
      .then((res) => alive && setDetail(res.data))
      .catch(() => alive && setError("Не удалось загрузить детализацию"));
    return () => {
      alive = false;
    };
  }, [open, detail, error, row.event, days]);

  // Группируем разрезы по имени свойства: у одного события их обычно два-три
  // (станция + режим, план + период), и каждое заслуживает своей таблички.
  const groups = {};
  for (const item of breakdown) (groups[item.key] ||= []).push(item);

  return (
    <div className={`an-event${open ? " is-open" : ""}`}>
      <button type="button" className="an-event__head" onClick={() => setOpen((v) => !v)}>
        <span className="an-event__caret">{open ? "▾" : "▸"}</span>
        <span className="an-event__name">{row.event}</span>
        <span className="an-event__nums">
          {num(row.count)} раз · {num(row.visitors)} чел.
        </span>
      </button>

      {open && (
        <div className="an-event__body">
          {Object.keys(groups).length === 0 ? (
            <div className="an-empty">У события нет собственных свойств</div>
          ) : (
            <div className="an-cols">
              {Object.entries(groups).map(([key, items]) => (
                <div key={key}>
                  <h3 className="an-subtitle">{key}</h3>
                  <Table
                    columns={[["value", "Значение"], ["count", "Раз"]]}
                    data={items}
                    max={15}
                  />
                </div>
              ))}
            </div>
          )}

          {error && <div className="an-block-error">{error}</div>}

          {detail && (
            <>
              <h3 className="an-subtitle" style={{ marginTop: 16 }}>Динамика</h3>
              <TimeChart
                data={rows(detail.daily)}
                series={[
                  { key: "count", name: "Событий" },
                  { key: "visitors", name: "Человек" },
                ]}
                height={200}
              />

              <div className="an-cols" style={{ marginTop: 12 }}>
                <div>
                  <h3 className="an-subtitle">С каких экранов</h3>
                  <Table
                    columns={[["screen", "Экран"], ["count", "Раз"], ["visitors", "Человек"]]}
                    data={rows(detail.byScreen)}
                    max={12}
                  />
                </div>
                <div>
                  <h3 className="an-subtitle">Из каких зон</h3>
                  <Table
                    columns={[["zone", "Зона"], ["count", "Раз"], ["visitors", "Человек"]]}
                    data={rows(detail.byZone)}
                    max={12}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Скорость ───────────────────────────────────────────────────
// Пороги стандартные для Core Web Vitals. Смотреть нужно на 75-й процентиль:
// среднее прячет хвост, в котором и сидят недовольные пользователи.
const VITALS = [
  ["LCP", "lcp", "Отрисовка главного блока", "мс", 2500, 4000],
  ["FCP", "fcp", "Первая отрисовка", "мс", 1800, 3000],
  ["INP", "inp", "Отклик на действие", "мс", 200, 500],
  ["CLS", "cls", "Смещения вёрстки", "", 0.1, 0.25],
  ["TTFB", "ttfb", "Ответ сервера", "мс", 800, 1800],
];

function verdict(value, good, bad) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return null;
  if (n <= good) return ["good", "хорошо"];
  if (n <= bad) return ["warn", "терпимо"];
  return ["bad", "плохо"];
}

export function PerformanceTab({ data }) {
  const init = firstRow(data.initTime);

  return (
    <>
      <Section title="Core Web Vitals" note="75-й процентиль: значение, хуже которого видит четверть пользователей. У приложения нет ленивой загрузки и один бандл на все маршруты — эти цифры здесь не теоретические.">
        <div className="an-stats">
          {VITALS.map(([label, key, hint, unit, good, bad]) => {
            const m = firstRow(data[key]);
            const v = verdict(m.p75, good, bad);
            return (
              <div key={key} className="an-stat">
                <div className="an-stat__value">
                  {m.p75 == null ? "—" : `${num(m.p75)}${unit ? ` ${unit}` : ""}`}
                </div>
                <div className="an-stat__label">{label}</div>
                <div className="an-stat__hint">{hint}</div>
                {v && (
                  <div className={`an-verdict is-${v[0]}`}>
                    {v[0] === "good" ? "●" : v[0] === "warn" ? "▲" : "■"} {v[1]}
                  </div>
                )}
                <div className="an-stat__hint">
                  медиана {num(m.median)} · замеров {num(m.samples)}
                </div>
              </div>
            );
          })}
          <Stat label="Инициализация SDK" value={init.medianMs == null ? "—" : `${num(init.medianMs)} мс`} hint={`p95 ${num(init.p95Ms)} мс`} />
        </div>
      </Section>

      <Section title="Динамика LCP" note="Стало ли хуже после релиза.">
        <BlockState error={blockError(data.lcpDaily)}>
          <TimeChart data={rows(data.lcpDaily)} series={[{ key: "p75", name: "LCP, p75 (мс)" }]} />
        </BlockState>
      </Section>

      <Section title="Скорость по экранам" note="Отсортировано от худшего — это и есть список на оптимизацию." wide>
        <BlockState error={blockError(data.byScreen)}>
          <Table
            columns={[
              ["screen", "Экран"],
              ["samples", "Замеров"],
              ["lcpP75", "LCP, мс"],
              ["fcpP75", "FCP, мс"],
              ["inpP75", "INP, мс"],
              ["clsP75", "CLS"],
            ]}
            data={rows(data.byScreen)}
            max={30}
          />
        </BlockState>
      </Section>

      <Section title="Скорость по устройствам" note="На телефоне картина всегда другая.">
        <BlockState error={blockError(data.byDevice)}>
          <Table
            columns={[["deviceType", "Устройство"], ["samples", "Замеров"], ["lcpP75", "LCP, мс"], ["inpP75", "INP, мс"]]}
            data={rows(data.byDevice)}
          />
        </BlockState>
      </Section>
    </>
  );
}

// ─── Сейчас ─────────────────────────────────────────────────────
export function LiveTab({ data }) {
  const active = firstRow(data.active);

  return (
    <>
      <Tiles>
        <Stat label="Посетителей за 30 минут" value={num(active.visitors)} />
        <Stat label="Сессий" value={num(active.sessions)} />
        <Stat label="Событий" value={num(active.events)} />
      </Tiles>

      <Section title="Пульс по минутам" note="Последние полчаса. Эта вкладка идёт мимо кеша — цифры всегда свежие.">
        <BlockState error={blockError(data.byMinute)}>
          <PulseChart
            data={rows(data.byMinute)}
            xKey="minute"
            yKey="events"
            name="События"
            formatX={(v) => new Date(v).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          />
        </BlockState>
      </Section>

      <Section title="Где сейчас находятся">
        <BlockState error={blockError(data.activeScreens)}>
          <Table columns={[["screen", "Экран"], ["visitors", "Человек"]]} data={rows(data.activeScreens)} empty="Сейчас никого нет" />
        </BlockState>
      </Section>

      <Section title="Последние события" wide>
        <BlockState error={blockError(data.latest)}>
          <Table
            columns={[
              ["timestamp", "Время", (v) => dateTime(v)],
              ["event", "Событие"],
              ["screen", "Экран"],
              ["zone", "Зона"],
              ["country", "Страна"],
              ["device", "Устройство"],
            ]}
            data={rows(data.latest)}
            max={50}
          />
        </BlockState>
      </Section>
    </>
  );
}

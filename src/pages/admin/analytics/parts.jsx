// client/src/pages/admin/analytics/parts.jsx
//
// Кирпичи дашборда посещаемости: плитка с числом, таблица-топ, обёртки над
// графиками. Вынесено из страницы, потому что каждая из семи вкладок собрана
// из одних и тех же четырёх элементов.
//
// ПРО ЦВЕТ. Категориальные цвета берутся строго по порядку из PALETTE и
// никогда не назначаются «по рангу»: если фильтр убирает серию, у оставшихся
// цвет не меняется. Три слота — предел для точечных форм; на линиях и
// столбцах допустим четвёртый. Дальше — «прочее», а не новый оттенок.

import React from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";

// Проверенная палитра: синий → оранжевый → бирюзовый → жёлтый.
// Порядок не косметика: именно он обеспечивает различимость соседних серий
// при дальтонизме. Менять местами нельзя.
export const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];

// Оформление осей и сетки: они должны читаться, но не спорить с данными.
const INK_MUTED = "#898781";
const GRID = "#e1e0d9";
const AXIS = { stroke: GRID, tick: { fill: INK_MUTED, fontSize: 11 }, tickLine: false };

/** Число с разделителями разрядов. Пусто → тире, а не «0». */
export function num(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("ru-RU") : String(value);
}

/** Доля 0…1 → «12,3 %». */
export function pct(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits).replace(".", ",")} %`;
}

/** Секунды → «4 мин 12 с». Для длительности сессий и времени на экране. */
export function duration(seconds) {
  const s = Math.round(Number(seconds));
  if (!Number.isFinite(s) || s <= 0) return "—";
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин ${s % 60} с`;
  const h = Math.floor(m / 60);
  return `${h} ч ${m % 60} мин`;
}

/** Дата ISO → «03.08, 08:44». */
export function dateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

/** Дата ISO → «03.08». Для подписей оси времени. */
export function shortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(5);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

/**
 * Плитка с одним числом.
 * delta — доля изменения к прошлому периоду; знак решает цвет, а рядом всегда
 * стоит стрелка со словом, чтобы смысл не держался на одном цвете.
 */
export function Stat({ label, value, hint, delta }) {
  const d = Number(delta);
  const hasDelta = Number.isFinite(d) && d !== 0;
  return (
    <div className="an-stat">
      <div className="an-stat__value">{value}</div>
      <div className="an-stat__label">{label}</div>
      {hint && <div className="an-stat__hint">{hint}</div>}
      {hasDelta && (
        <div className={`an-stat__delta ${d > 0 ? "is-up" : "is-down"}`}>
          {d > 0 ? "↑" : "↓"} {pct(Math.abs(d), 0)} к прошлому периоду
        </div>
      )}
    </div>
  );
}

/** Раздел с заголовком и пояснением: зачем на него вообще смотреть. */
export function Section({ title, note, children, wide }) {
  return (
    <section className={`an-section${wide ? " an-section--wide" : ""}`}>
      <h2 className="an-section__title">{title}</h2>
      {note && <p className="an-section__note">{note}</p>}
      {children}
    </section>
  );
}

/** Заглушка блока: не собрался, пуст или ещё грузится. */
export function BlockState({ error, empty, children }) {
  if (error) return <div className="an-block-error">Блок не собрался: {error}</div>;
  if (empty) return <div className="an-empty">Данных за период нет</div>;
  return children;
}

/**
 * Таблица-топ. Колонки описываются как [ключ, заголовок, форматтер].
 *
 * Таблица есть у каждого графика намеренно: это и запасной канал для тех,
 * кто не различает цвета, и единственный способ прочитать точное значение.
 */
export function Table({ columns, data, empty = "Данных нет", max }) {
  const list = max ? data.slice(0, max) : data;
  if (!list.length) return <div className="an-empty">{empty}</div>;

  return (
    <div className="an-table-wrap">
      <table className="an-table">
        <thead>
          <tr>
            {columns.map(([key, title]) => (
              <th key={key}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((row, i) => (
            <tr key={i}>
              {columns.map(([key, , format], ci) => (
                <td key={key} className={ci === 0 ? "an-td-name" : "an-td-num"}>
                  {format ? format(row[key], row) : num(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {max && data.length > max && (
        <div className="an-table-more">…и ещё {num(data.length - max)} строк</div>
      )}
    </div>
  );
}

// Общий тултип: без него график остаётся картинкой, по которой нельзя
// прочитать точное значение.
const tooltipStyle = {
  contentStyle: {
    background: "#fff",
    border: "1px solid #e6eaf0",
    borderRadius: 8,
    fontSize: 12,
    boxShadow: "0 4px 12px rgba(11,11,11,0.08)",
  },
  labelStyle: { color: "#52514e", marginBottom: 4 },
};

/**
 * График динамики по времени.
 * series — [{ key, name }] в порядке важности; цвет берётся по индексу.
 */
export function TimeChart({ data, series, xKey = "day", height = 260, formatX = shortDate }) {
  if (!data.length) return <div className="an-empty">Данных за период нет</div>;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={formatX} {...AXIS} />
          <YAxis width={44} allowDecimals={false} {...AXIS} />
          <Tooltip {...tooltipStyle} labelFormatter={formatX} />
          {series.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Заливка под линией — для «пульса» живой вкладки. */
export function PulseChart({ data, xKey, yKey, name, height = 160, formatX }) {
  if (!data.length) return <div className="an-empty">Тишина: событий не было</div>;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="an-pulse" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PALETTE[0]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={PALETTE[0]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={formatX} {...AXIS} />
          <YAxis width={40} allowDecimals={false} {...AXIS} />
          <Tooltip {...tooltipStyle} labelFormatter={formatX} />
          <Area
            type="monotone"
            dataKey={yKey}
            name={name}
            stroke={PALETTE[0]}
            strokeWidth={2}
            fill="url(#an-pulse)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Горизонтальные столбцы для рейтингов (экраны, страны, источники).
 *
 * Горизонтальные, а не вертикальные: подписи здесь — длинные строки вроде
 * «/dp/add-patient-medical-history/:id», и по вертикальной оси они читаются,
 * а под вертикальными столбцами превратились бы в косые обрубки.
 */
export function RankChart({ data, nameKey, valueKey, valueName, height, max = 12, colorIndex = 0 }) {
  const list = data.slice(0, max);
  if (!list.length) return <div className="an-empty">Данных за период нет</div>;

  return (
    <div style={{ width: "100%", height: height || Math.max(140, list.length * 28 + 40) }}>
      <ResponsiveContainer>
        <BarChart data={list} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...AXIS} />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={220}
            tick={{ fill: "#52514e", fontSize: 11 }}
            tickLine={false}
            stroke={GRID}
          />
          <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(11,11,11,0.04)" }} />
          <Bar dataKey={valueKey} name={valueName} radius={[0, 4, 4, 0]} barSize={14}>
            {list.map((_, i) => (
              // Цвет один на всю серию: это рейтинг одной величины, а не
              // разные сущности. Разноцветные столбцы здесь означали бы,
              // что цвет что-то кодирует, — он не кодирует ничего.
              <Cell key={i} fill={PALETTE[colorIndex]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Вертикальные столбцы — для естественно упорядоченных шкал (часы, дни). */
export function ColumnChart({ data, xKey, yKey, yName, height = 220, formatX, colorIndex = 0 }) {
  if (!data.length) return <div className="an-empty">Данных за период нет</div>;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={formatX} {...AXIS} />
          <YAxis width={44} allowDecimals={false} {...AXIS} />
          <Tooltip {...tooltipStyle} labelFormatter={formatX} cursor={{ fill: "rgba(11,11,11,0.04)" }} />
          <Bar dataKey={yKey} name={yName} fill={PALETTE[colorIndex]} radius={[4, 4, 0, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

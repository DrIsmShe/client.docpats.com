// client/src/pages/admin/dashboard/AdminHomeDashboard.jsx
//
// Главная страница админпанели (/admin/admin-panel).
//
// ЧТО БЫЛО. Здесь лежал кусок купленной темы: Lorem ipsum, выдуманные
// покупатели «Brandon Jacob», товары и суммы в долларах, статусы
// Approved/Pending/Rejected. Ни одна цифра не приходила с сервера.
//
// ЧТО СТАЛО. Четыре блока, в порядке убывания срочности:
//
//   1. Ключевые показатели — с приростом за 30 дней и графиком за две
//      недели. Число без динамики бесполезно: «1244 пользователя» — это
//      много или мало?
//   2. Очередь дел — то, что ждёт решения человека. Показывается только
//      непустое: пустых плашек «0 на модерации» на экране быть не должно,
//      иначе взгляд перестаёт их замечать.
//   3. Разделы платформы — сколько чего накоплено, каждая плитка ведёт
//      в свой раздел.
//   4. Здоровье процесса и лента последних действий из HIPAA-журнала.
//
// Данные одним запросом GET /admin/dashboard — страница должна открываться
// сразу, а не собираться из восьми ответов.

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "./adminDashboard.css";

const API_BASE = process.env.REACT_APP_API_URL;

const nf = new Intl.NumberFormat("ru-RU");
const fmt = (n) => nf.format(Number(n) || 0);

/** «2 часа назад», «5 минут назад» — без внешней библиотеки дат. */
function ago(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d} дн` : `${Math.floor(d / 30)} мес`;
}

/**
 * Спарклайн: график за две недели прямо в карточке.
 *
 * Свой SVG, а не библиотека графиков: четыре ломаных по 14 точек не стоят
 * ни лишней зависимости, ни веса в бандле.
 */
function Sparkline({ points, color = "#0f766e" }) {
  if (!points || points.length < 2) return <div style={{ height: 34 }} />;

  const vals = points.map((p) => p.value);
  const max = Math.max(...vals, 1);
  const w = 100;
  const h = 30;
  const step = w / (points.length - 1);

  const coords = vals.map((v, i) => [i * step, h - (v / max) * h]);
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <svg
      className="adm-spark"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points={area} fill={color} opacity="0.09" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Kpi({ label, data, series, color }) {
  if (!data) return null;
  const { total, today, trend } = data;

  // Процент показываем, только если сервер его посчитал: рост с нуля до трёх
  // это не «+300 %», а просто три.
  const cls =
    trend == null
      ? "adm-trend--flat"
      : trend > 0
        ? "adm-trend--up"
        : trend < 0
          ? "adm-trend--down"
          : "adm-trend--flat";

  return (
    <div className="adm-kpi">
      <div className="adm-kpi-label">{label}</div>
      <div className="adm-kpi-value">{fmt(total)}</div>
      <Sparkline points={series} color={color} />
      <div className="adm-kpi-foot">
        {trend != null && (
          <span className={`adm-trend ${cls}`}>
            {trend > 0 ? "+" : ""}
            {trend}% за месяц
          </span>
        )}
        <span>сегодня +{fmt(today)}</span>
      </div>
    </div>
  );
}

function Task({ n, label, hint, to, tone }) {
  if (!n) return null;
  return (
    <Link className={`adm-task adm-task--${tone}`} to={to}>
      <span className="adm-task-n">{fmt(n)}</span>
      <span className="adm-task-text">
        <span className="adm-task-label">{label}</span>
        {hint && <span className="adm-task-hint">{hint}</span>}
      </span>
    </Link>
  );
}

function Tile({ n, label, to }) {
  const body = (
    <>
      <div className="adm-tile-n">{fmt(n)}</div>
      <div className="adm-tile-label">{label}</div>
    </>
  );

  // Часть счётчиков не имеет своей страницы в админке. Ссылка «куда-нибудь
  // рядом» хуже её отсутствия: она обещает раздел, а ведёт в чужой.
  if (!to) return <div className="adm-tile adm-tile--flat">{body}</div>;

  return (
    <Link className="adm-tile" to={to}>
      {body}
    </Link>
  );
}

/** Технические имена действий из аудита — человеческим языком. */
const ACTION_RU = {
  list: "просмотр списка",
  read: "просмотр",
  create: "создание",
  update: "изменение",
  delete: "удаление",
  "auth.login": "вход",
  "auth.logout": "выход",
  "auth.failed_login": "неудачный вход",
  "auth.account_locked": "блокировка входа",
  "admin.doctor.create": "заведён врач",
  "admin.doctor.update": "правка врача",
  "admin.doctor.delete": "удалён врач",
};

const RESOURCE_RU = {
  patient: "пациент",
  "patient-profile": "профиль пациента",
  "doctor-profile": "профиль врача",
  appointment: "приём",
  "medical-record": "медзапись",
  other: "служебное",
};

export default function AdminHomeDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard`, {
        credentials: "include",
      });
      if (res.status === 403) throw new Error("Доступ только для администратора.");
      if (!res.ok) throw new Error("Не удалось загрузить сводку.");
      setData(await res.json());
    } catch (e) {
      setError(e.message || "Не удалось загрузить сводку.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="adm">
        <div className="adm-msg adm-msg--error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="adm">
        <div className="adm-head">
          <div>
            <h1>Панель управления</h1>
            <p>Загрузка сводки…</p>
          </div>
        </div>
        <div className="adm-kpis">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="adm-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const { metrics, queue, sections, series, activity, health } = data;

  // Считаем ровно то, что будет нарисовано: карточка с нулём не выводится,
  // поэтому «ничего не ждёт решения» обязано означать «карточек нет».
  // Иначе получается блок с заголовком «Требует внимания» и пустотой под ним.
  const pending = Object.values(queue).reduce((sum, n) => sum + (n || 0), 0);

  return (
    <div className="adm">
      <div className="adm-head">
        <div>
          <h1>Панель управления</h1>
          <p>
            Данные на{" "}
            {new Date(data.generatedAt).toLocaleString("ru-RU", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button className="adm-refresh" onClick={load} disabled={loading}>
          {loading ? "Обновляю…" : "Обновить"}
        </button>
      </div>

      <div className="adm-section">
        <div className="adm-kpis">
          <Kpi
            label="Пользователи"
            data={metrics.users}
            series={series.users}
            color="#0f766e"
          />
          <Kpi
            label="Приёмы в клиниках"
            data={metrics.appointments}
            series={series.appointments}
            color="#2563eb"
          />
          <Kpi label="AI-консультации" data={metrics.consultations} color="#7c3aed" />
          <Kpi label="Клиники" data={metrics.clinics} color="#c2410c" />
        </div>
      </div>

      <div className="adm-section">
        <h2>Требует внимания</h2>
        {pending === 0 ? (
          <div className="adm-clear">Ничего не ждёт решения.</div>
        ) : (
          <div className="adm-queue">
            <Task
              n={queue.doctorVerification}
              label="Врачей на верификации"
              hint="проверить документы"
              to="/admin/verification"
              tone="warn"
            />
            <Task
              n={queue.reviews}
              label="Отзывов на модерации"
              to="/admin/reviews"
              tone="warn"
            />
            <Task
              n={queue.clinicArticles}
              label="Статей клиник на модерации"
              to="/admin/clinics"
              tone="warn"
            />
            <Task
              n={queue.radiologyDrafts}
              label="Черновиков в диагностической арене"
              hint="ждут снимка и публикации"
              to="/admin/radiology"
              tone="info"
            />
            <Task
              n={queue.deniedLast24h}
              label="Отказов в доступе за сутки"
              hint="серия отказов — признак подбора"
              to="/admin/security"
              tone="danger"
            />
            <Task
              n={queue.blockedUsers}
              label="Заблокированных пользователей"
              to="/admin/users-list"
              tone="info"
            />
          </div>
        )}
      </div>

      <div className="adm-section">
        <h2>Разделы платформы</h2>
        <div className="adm-tiles">
          <Tile n={sections.doctors} label="Врачей" to="/admin/doctors-manage" />
          <Tile n={sections.patients} label="Пациентов" to="/admin/users-list" />
          <Tile n={sections.clinicPatients} label="Карт в клиниках" to="/admin/clinics" />
          <Tile n={sections.articles} label="Статей" />
          <Tile n={sections.radiologyCases} label="Кейсов по снимкам" to="/admin/radiology" />
          <Tile n={sections.labCases} label="Кейсов по анализам" to="/admin/labs" />
          <Tile n={sections.vpCases} label="Виртуальных пациентов" to="/admin/vp" />
          <Tile n={sections.examItems} label="Вопросов в тестах" to="/admin/education-programs" />
          <Tile n={sections.examAttempts} label="Попыток в тестах" to="/admin/arena-analytics" />
          <Tile n={sections.diagnosticCases} label="Разборов диагностики" />
          <Tile n={sections.simulations} label="Планов симуляции" />
          <Tile n={sections.medicalCodes} label="Медицинских кодов" to="/medical-codes" />
          <Tile n={sections.leads} label="Заявок клиник" to="/admin/billing" />
          <Tile n={sections.notifications} label="Уведомлений" />
        </div>
      </div>

      <div className="adm-split">
        <div>
          <div className="adm-section">
            <h2>Состояние сервера</h2>
            <div className="adm-panel">
              <div className="adm-rows">
                <div className="adm-row">
                  <span>База данных</span>
                  <span>
                    <i
                      className={`adm-dot adm-dot--${health.mongo ? "ok" : "bad"}`}
                    />
                    {health.mongo ? "на связи" : "нет соединения"}
                  </span>
                </div>
                <div className="adm-row">
                  <span>Аптайм</span>
                  <span>
                    {Math.floor(health.uptimeSec / 3600)} ч{" "}
                    {Math.floor((health.uptimeSec % 3600) / 60)} мин
                  </span>
                </div>
                <div className="adm-row">
                  <span>Память</span>
                  <span>
                    {health.heapUsedMb} / {health.heapTotalMb} МБ
                  </span>
                </div>
                <div className="adm-row">
                  <span>Нагрузка</span>
                  <span>{health.loadAvg}</span>
                </div>
                <div className="adm-row">
                  <span>Node.js</span>
                  <span>{health.node}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="adm-section">
          <h2>Последние действия</h2>
          <div className="adm-panel">
            {activity.length === 0 ? (
              <div style={{ fontSize: 13, color: "#64748b" }}>Записей пока нет.</div>
            ) : (
              <div className="adm-feed">
                {activity.map((e, i) => (
                  <div className="adm-event" key={i}>
                    <span className="adm-event-time">{ago(e.at)}</span>
                    <span className="adm-event-body">
                      <span className={e.outcome === "denied" ? "adm-event-bad" : ""}>
                        {ACTION_RU[e.action] || e.action}
                      </span>{" "}
                      <span className="adm-event-res">
                        · {RESOURCE_RU[e.resourceType] || e.resourceType}
                        {e.outcome === "denied" ? " · отказано" : ""}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

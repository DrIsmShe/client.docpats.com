// client/src/pages/clinic/ClinicAnalyticsPage/ClinicAnalyticsPage.jsx
//
// Mounted in BOTH clinic zones:
//   /clinic/analytics            -> owner zone    (owner/admin, analytics RO)
//   /clinic/employee/analytics   -> employee zone (manager, analytics RO)
//
// Read-only clinic analytics dashboard. Data from
// GET /api/v1/clinic/analytics/overview?range=<preset> (RBAC: analytics.read).
// Doctor names for the load chart resolved client-side (variant B) via listStaff().

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useClinicZone } from "../../../lib/useClinicZone";
import { getAnalyticsOverview, listStaff } from "../../../api/clinic";
import "./clinicAnalyticsPage.css";

// Подписи периодов и статусов — в словаре: здесь только ключи, иначе
// текст не виден ни одной из проверок перевода.
const RANGE_OPTIONS = [
  { key: "day", labelKey: "analytics.range.day" },
  { key: "week", labelKey: "analytics.range.week" },
  { key: "month", labelKey: "analytics.range.month" },
  { key: "half_year", labelKey: "analytics.range.half_year" },
  { key: "year", labelKey: "analytics.range.year" },
  { key: "three_years", labelKey: "analytics.range.three_years" },
  { key: "five_years", labelKey: "analytics.range.five_years" },
  { key: "all", labelKey: "analytics.range.all" },
];

const STATUS_META = {
  scheduled: { labelKey: "analytics.status.scheduled", color: "#3d7fff" },
  checked_in: { labelKey: "analytics.status.checked_in", color: "#7c3dff" },
  completed: { labelKey: "analytics.status.completed", color: "#22c55e" },
  cancelled: { labelKey: "analytics.status.cancelled", color: "#f59e0b" },
  no_show: { labelKey: "analytics.status.no_show", color: "#ef4444" },
};

function shortId(id) {
  if (!id) return "\u2014";
  const s = String(id);
  return s.length > 8 ? "#" + s.slice(-6) : "#" + s;
}

export default function ClinicAnalyticsPage() {
  const { t } = useTranslation("clinic");
  const layoutContext = useOutletContext();
  const navigate = useNavigate();
  const { dashboardPath, loginPath } = useClinicZone();

  const [range, setRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [doctorNames, setDoctorNames] = useState({});

  const myRole = layoutContext?.role || "member";
  const perms = layoutContext?.permissions || {};
  const isOwner = myRole === "owner";
  const canView = isOwner || !!perms?.analytics?.read;

  useEffect(() => {
    let alive = true;
    listStaff()
      .then((res) => {
        if (!alive) return;
        const map = {};
        for (const m of res.items || []) {
          const id = String(m.userId || m._id || m.id || "");
          if (!id) continue;
          const name = m.name || [m.firstName, m.lastName].filter(Boolean).join(" ") || "";
          if (name) map[id] = name;
        }
        setDoctorNames(map);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const load = useCallback(
    async (rangeKey) => {
      try {
        setError(null);
        setLoading(true);
        const res = await getAnalyticsOverview(rangeKey);
        setOverview(res.overview || null);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        if (err.response?.status === 401) {
          navigate(loginPath, { replace: true });
          return;
        }
        // Отказ по тарифу приходит с признаком, а не только текстом:
        // серверные сообщения не переводятся, и на азербайджанской
        // странице выскакивала русская фраза. По признаку показываем свой
        // перевод, текст сервера остаётся запасным.
        const reason = err.response?.data?.details?.reason;
        setError(
          reason === "feature_not_in_plan"
            ? t("analytics.notInPlan", {
                defaultValue:
                  "Аналитика по клинике входит в тарифы Business и Enterprise",
              })
            : err.response?.data?.error ||
              err.message ||
              t("analytics.loadFailed", {
                defaultValue: "Не удалось загрузить аналитику",
              }),
        );
        setLoading(false);
      }
    },
    [navigate, loginPath, t],
  );

  useEffect(() => {
    if (canView) load(range);
  }, [range, canView, load]);

  const statusData = useMemo(() => {
    const by = overview?.appointments?.byStatus || {};
    return Object.keys(STATUS_META).map((key) => ({
      key,
      name: t(STATUS_META[key].labelKey),
      value: by[key] || 0,
      color: STATUS_META[key].color,
    }));
  }, [overview]);

  const trendData = useMemo(() => {
    const raw = overview?.dailyTrend || [];
    return raw.map((d) => ({
      date: d.date,
      short: d.date ? d.date.slice(5) : d.date,
      count: d.count,
    }));
  }, [overview]);

  const doctorData = useMemo(() => {
    const raw = overview?.doctorLoad || [];
    return raw.map((d) => ({
      doctorId: d.doctorId,
      name: doctorNames[String(d.doctorId)] || shortId(d.doctorId),
      count: d.count,
    }));
  }, [overview, doctorNames]);

  const noShowPct = useMemo(() => {
    const r = overview?.noShow?.rate;
    if (r === null || r === undefined) return null;
    return Math.round(r * 1000) / 10;
  }, [overview]);

  if (!canView) {
    return (
      <div className="an-page-error">
        <h2>{t("analytics.noAccessTitle", { defaultValue: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430" })}</h2>
        <p>{t("analytics.noAccessBody", { defaultValue: "\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u043F\u0440\u0430\u0432 \u043D\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438" })}</p>
        <Link to={dashboardPath}>{t("analytics.back", { defaultValue: "\u2190 \u0414\u0430\u0448\u0431\u043E\u0440\u0434" })}</Link>
      </div>
    );
  }

  return (
    <div className="an-page">
      <div className="an-page-header">
        <div className="an-page-header-left">
          <Link to={dashboardPath} className="an-page-back">
            {t("analytics.back", { defaultValue: "\u2190 \u0414\u0430\u0448\u0431\u043E\u0440\u0434" })}
          </Link>
          <h1>{t("analytics.title", { defaultValue: "\u0410\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430" })}</h1>
          <p className="an-page-subtitle">
            {t("analytics.subtitle", { defaultValue: "\u041E\u0431\u0437\u043E\u0440 \u0440\u0430\u0431\u043E\u0442\u044B \u043A\u043B\u0438\u043D\u0438\u043A\u0438" })}
          </p>
        </div>
      </div>

      <div className="an-range-bar">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={"an-range-btn " + (range === opt.key ? "is-active" : "")}
            onClick={() => setRange(opt.key)}
            disabled={loading}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {error ? (
        <div className="an-page-error">
          <p>{error}</p>
          <button onClick={() => load(range)} type="button">
            {t("common.retry", { defaultValue: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" })}
          </button>
        </div>
      ) : loading ? (
        <div className="an-page-loading">
          <div className="an-page-spinner" />
        </div>
      ) : (
        <>
          <div className="an-cards">
            <div className="an-card">
              <div className="an-card-num">{overview?.appointments?.total ?? 0}</div>
              <div className="an-card-label">{t("analytics.totalAppointments", { defaultValue: "\u0412\u0441\u0435\u0433\u043E \u043F\u0440\u0438\u0451\u043C\u043E\u0432" })}</div>
            </div>
            <div className="an-card">
              <div className="an-card-num">{noShowPct === null ? "\u2014" : noShowPct + "%"}</div>
              <div className="an-card-label">{t("analytics.noShowRate", { defaultValue: "\u0414\u043E\u043B\u044F \u043D\u0435\u044F\u0432\u043E\u043A" })}</div>
            </div>
            <div className="an-card">
              <div className="an-card-num">{overview?.newPatients ?? 0}</div>
              <div className="an-card-label">{t("analytics.newPatients", { defaultValue: "\u041D\u043E\u0432\u044B\u0445 \u043F\u0430\u0446\u0438\u0435\u043D\u0442\u043E\u0432" })}</div>
            </div>
          </div>

          <section className="an-section">
            <h2>{t("analytics.byStatus", { defaultValue: "\u041F\u0440\u0438\u0451\u043C\u044B \u043F\u043E \u0441\u0442\u0430\u0442\u0443\u0441\u0430\u043C" })}</h2>
            <div className="an-chart">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="an-section">
            <h2>{t("analytics.dailyTrend", { defaultValue: "\u0414\u0438\u043D\u0430\u043C\u0438\u043A\u0430 \u043F\u043E \u0434\u043D\u044F\u043C" })}</h2>
            {trendData.length === 0 ? (
              <div className="an-empty">{t("analytics.noData", { defaultValue: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434" })}</div>
            ) : (
              <div className="an-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="short" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3d7fff" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="an-section">
            <h2>{t("analytics.doctorLoad", { defaultValue: "\u041D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0432\u0440\u0430\u0447\u0435\u0439" })}</h2>
            {doctorData.length === 0 ? (
              <div className="an-empty">{t("analytics.noData", { defaultValue: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434" })}</div>
            ) : (
              <div className="an-chart">
                <ResponsiveContainer width="100%" height={Math.max(160, doctorData.length * 40 + 40)}>
                  <BarChart data={doctorData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3dff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
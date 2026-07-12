// client/src/pages/clinic/pharmacy/PharmacyReportsPage.jsx
//
// Отчёты по выдаче со склада (dispense reports). Зона RESOURCES.INVENTORY:READ
// — руководство + фармацевт (НЕ analytics, иначе фармацевт отрезан).
//
// Один запрос getDispenseReport({period|from/to, bucket}) отдаёт всё:
//   { period, totals, byTarget, topDrugs, byDepartment, controlled, series }
// series приходит только когда передан bucket — шлём bucket всегда.
//
// PDF — та же выборка через getDispenseReportPdf (blob) → download.
//
// Графики: recharts@3.8.0.
//
// ⚠ TRANSFER NOTE: содержит кириллицу. Скачивать/вставлять напрямую, НЕ через
// PowerShell Set-Content.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Download,
  Pill,
  ShieldAlert,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useClinicPermissions } from "../../../lib/can";
import { getDispenseReport, getDispenseReportPdf } from "../../../api/pharmacy";

const PERIODS = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
];

// bucket per period so the time series has sensible granularity
const BUCKET_BY_PERIOD = {
  day: "hour",
  week: "day",
  month: "day",
  quarter: "week",
  year: "month",
};

const TARGET_LABELS = {
  requisition: "По заявкам",
  department: "В отделения",
  patient: "Пациентам",
};

const PIE_COLORS = ["#2563eb", "#0ea5e9", "#14b8a6", "#f59e0b", "#a855f7"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const S = {
  page: { padding: "24px 28px", maxWidth: 1200, margin: "0 auto" },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  titleWrap: { display: "flex", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: 700, margin: 0 },
  controls: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  select: {
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14,
    marginBottom: 24,
  },
  kpi: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "18px 20px",
    background: "#fff",
  },
  kpiLabel: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: ".04em",
    fontWeight: 600,
  },
  kpiValue: { fontSize: 30, fontWeight: 700, marginTop: 6, color: "#0f172a" },
  kpiCtrl: { color: "#b45309" },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 18,
    marginBottom: 24,
  },
  panel: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 18,
    background: "#fff",
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 14,
    color: "#334155",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "2px solid #e2e8f0",
    color: "#64748b",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: ".04em",
  },
  td: { padding: "8px 10px", borderBottom: "1px solid #f1f5f9" },
  tright: { textAlign: "right" },
  muted: { color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 24 },
  err: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    marginBottom: 14,
  },
  ctrlPanel: {
    border: "1px solid #fde68a",
    borderRadius: 12,
    padding: 18,
    background: "#fffbeb",
    marginBottom: 24,
  },
  ctrlHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#b45309",
    marginBottom: 12,
  },
};

function num(n) {
  return (n || 0).toLocaleString("ru-RU");
}

export default function PharmacyReportsPage() {
  const { t } = useTranslation();
  const { can } = useClinicPermissions();
  const canRead = can("inventory", "read");

  const [period, setPeriod] = useState("month");
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const params = useMemo(
    () => ({ period, date, bucket: BUCKET_BY_PERIOD[period] || "day" }),
    [period, date],
  );

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDispenseReport(params);
      setData(res.data || null);
    } catch (e) {
      setError(
        t("pharmacy.reports.loadError", {
          defaultValue: "Не удалось загрузить отчёт",
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [params, t]);

  useEffect(() => {
    if (canRead) fetchReport();
  }, [fetchReport, canRead]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await getDispenseReportPdf(params);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pharmacy-report-${period}-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(
        t("pharmacy.reports.pdfError", {
          defaultValue: "Не удалось сформировать PDF",
        }),
      );
    } finally {
      setDownloading(false);
    }
  };

  if (!canRead) {
    return (
      <div style={S.page}>
        <div style={S.err}>
          <ShieldAlert size={18} />
          {t("pharmacy.reports.noAccess", {
            defaultValue: "Нет доступа к отчётам аптеки",
          })}
        </div>
      </div>
    );
  }

  const totals = data?.totals || {};
  const byTarget = data?.byTarget || [];
  const topDrugs = data?.topDrugs || [];
  const byDepartment = data?.byDepartment || [];
  const controlled = data?.controlled || {};
  const series = data?.series || [];

  const targetChart = byTarget.map((r) => ({
    name: TARGET_LABELS[r.target] || r.target,
    value: r.qty || 0,
    count: r.count || 0,
  }));

  return (
    <div style={S.page}>
      <div style={S.head}>
        <div style={S.titleWrap}>
          <BarChart3 size={24} color="#2563eb" />
          <h1 style={S.title}>
            {t("pharmacy.reports.title", {
              defaultValue: "Отчёты по выдаче",
            })}
          </h1>
        </div>
        <button
          type="button"
          style={S.btn}
          onClick={handleDownloadPdf}
          disabled={downloading || loading}
        >
          {downloading ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <Download size={16} />
          )}
          {t("pharmacy.reports.pdf", { defaultValue: "Скачать PDF" })}
        </button>
      </div>

      <div style={S.controls}>
        <select
          style={S.select}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {t(`pharmacy.reports.period.${p.value}`, {
                defaultValue: p.label,
              })}
            </option>
          ))}
        </select>
        <input
          style={S.select}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {data?.period?.label && (
          <span style={{ color: "#64748b", fontSize: 13 }}>
            {data.period.label}
          </span>
        )}
      </div>

      {error && (
        <div style={S.err}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={S.muted}>
          <Loader2 size={22} className="spin" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div style={S.kpis}>
            <div style={S.kpi}>
              <div style={S.kpiLabel}>
                {t("pharmacy.reports.kpiDispenses", {
                  defaultValue: "Всего выдач",
                })}
              </div>
              <div style={S.kpiValue}>{num(totals.dispenseCount)}</div>
            </div>
            <div style={S.kpi}>
              <div style={S.kpiLabel}>
                {t("pharmacy.reports.kpiQty", {
                  defaultValue: "Единиц выдано",
                })}
              </div>
              <div style={S.kpiValue}>{num(totals.totalQty)}</div>
            </div>
            <div style={S.kpi}>
              <div style={S.kpiLabel}>
                {t("pharmacy.reports.kpiControlled", {
                  defaultValue: "Из них ПКУ",
                })}
              </div>
              <div style={{ ...S.kpiValue, ...S.kpiCtrl }}>
                {num(totals.controlledCount)}
              </div>
            </div>
          </div>

          {/* time series */}
          <div style={{ ...S.panel, marginBottom: 24 }}>
            <div style={S.panelTitle}>
              {t("pharmacy.reports.dynamics", {
                defaultValue: "Динамика выдач",
              })}
            </div>
            {series.length === 0 ? (
              <div style={S.muted}>
                {t("pharmacy.reports.noData", {
                  defaultValue: "Нет данных за период",
                })}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="qty"
                    name={t("pharmacy.reports.qty", {
                      defaultValue: "Единиц",
                    })}
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name={t("pharmacy.reports.count", {
                      defaultValue: "Выдач",
                    })}
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={S.grid2}>
            {/* by target (pie) */}
            <div style={S.panel}>
              <div style={S.panelTitle}>
                {t("pharmacy.reports.byTarget", {
                  defaultValue: "По каналам выдачи",
                })}
              </div>
              {targetChart.length === 0 ? (
                <div style={S.muted}>
                  {t("pharmacy.reports.noData", {
                    defaultValue: "Нет данных за период",
                  })}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={targetChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {targetChart.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* by department (bar) */}
            <div style={S.panel}>
              <div style={S.panelTitle}>
                {t("pharmacy.reports.byDepartment", {
                  defaultValue: "По отделениям",
                })}
              </div>
              {byDepartment.length === 0 ? (
                <div style={S.muted}>
                  {t("pharmacy.reports.noData", {
                    defaultValue: "Нет данных за период",
                  })}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={byDepartment}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="qty"
                      name={t("pharmacy.reports.qty", {
                        defaultValue: "Единиц",
                      })}
                      fill="#2563eb"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* top drugs table */}
          <div style={{ ...S.panel, marginBottom: 24 }}>
            <div style={S.panelTitle}>
              {t("pharmacy.reports.topDrugs", {
                defaultValue: "Топ препаратов",
              })}
            </div>
            {topDrugs.length === 0 ? (
              <div style={S.muted}>
                {t("pharmacy.reports.noData", {
                  defaultValue: "Нет данных за период",
                })}
              </div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>
                      {t("pharmacy.reports.drug", { defaultValue: "Препарат" })}
                    </th>
                    <th style={{ ...S.th, ...S.tright }}>
                      {t("pharmacy.reports.qty", { defaultValue: "Единиц" })}
                    </th>
                    <th style={{ ...S.th, ...S.tright }}>
                      {t("pharmacy.reports.count", { defaultValue: "Выдач" })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topDrugs.map((d) => (
                    <tr key={d.drugItemId}>
                      <td style={S.td}>{d.name || "—"}</td>
                      <td style={{ ...S.td, ...S.tright }}>{num(d.qty)}</td>
                      <td style={{ ...S.td, ...S.tright }}>{num(d.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* controlled substances (ПКУ) */}
          <div style={S.ctrlPanel}>
            <div style={S.ctrlHead}>
              <Pill size={18} />
              {t("pharmacy.reports.controlled", {
                defaultValue: "Предметно-количественный учёт (ПКУ)",
              })}
            </div>
            <div style={{ marginBottom: 12, fontSize: 13, color: "#92400e" }}>
              {t("pharmacy.reports.controlledTotals", {
                defaultValue: "Всего ПКУ: {{count}} выдач, {{qty}} единиц",
                count: num(controlled.count),
                qty: num(controlled.totalQty),
              })}
            </div>
            {(controlled.byDrug || []).length === 0 ? (
              <div style={{ ...S.muted, color: "#b45309" }}>
                {t("pharmacy.reports.noControlled", {
                  defaultValue: "Выдач ПКУ за период не было",
                })}
              </div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>
                      {t("pharmacy.reports.drug", { defaultValue: "Препарат" })}
                    </th>
                    <th style={{ ...S.th, ...S.tright }}>
                      {t("pharmacy.reports.qty", { defaultValue: "Единиц" })}
                    </th>
                    <th style={{ ...S.th, ...S.tright }}>
                      {t("pharmacy.reports.count", { defaultValue: "Выдач" })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {controlled.byDrug.map((d) => (
                    <tr key={d.drugItemId}>
                      <td style={S.td}>{d.name || "—"}</td>
                      <td style={{ ...S.td, ...S.tright }}>{num(d.qty)}</td>
                      <td style={{ ...S.td, ...S.tright }}>{num(d.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

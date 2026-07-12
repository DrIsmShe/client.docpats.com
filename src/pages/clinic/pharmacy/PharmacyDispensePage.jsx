// client/src/pages/clinic/pharmacy/PharmacyDispensePage.jsx
//
// Выдача препаратов со склада (Dispense). Зона RESOURCES.INVENTORY:WRITE
// (движение остатков). Канал «пациенту» дополнительно требует
// PRESCRIPTION:READ — в v1 отложен (пациентский пикер + гейт = отдельный заход).
//
// Каналы v1:
//   • «По заявке»     — приходит ?requisitionId=; тянем populated заявку,
//     рисуем строки с остатком (qtyRequested − qtyDispensed), выдаём построчно.
//   • «В отделение»   — select отделения + поиск препарата + qty.
//   • «Пациенту»      — заглушка «скоро».
//
// qty хранится в baseUnit (как и заявка). Медсестра/фармацевт вводит УПАКОВКИ,
// форма конвертирует packs × unitsPerPack перед отправкой.
//
// Тело ошибки backend: { error, code, details?, retryAfter? }. Маппим code →
// человекочитаемый RU-текст; fallback на error.
//
// ⚠ TRANSFER NOTE: содержит кириллицу. Скачивать/вставлять напрямую, НЕ через
// PowerShell Set-Content.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PackageCheck,
  Building2,
  UserRound,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useClinicPermissions } from "../../../lib/can";
import { listDepartments } from "../../../api/clinic";
import {
  getDrugItems,
  getRequisition,
  dispense as apiDispense,
} from "../../../api/pharmacy";

const BASE_UNIT_LABELS = {
  tablet: "таб.",
  capsule: "капс.",
  ampoule: "амп.",
  vial_dose: "флак./доза",
  ml: "мл",
  g: "г",
  drop: "кап.",
  piece: "шт.",
  dose: "доза",
};

// backend error code → RU message
const ERROR_MESSAGES = {
  OVER_DISPENSE: "Превышен доступный остаток по позиции заявки.",
  STOCK_CONFLICT: "Склад изменился во время выдачи. Повторите операцию.",
  REQ_NOT_FULFILLABLE:
    "Заявка не в том статусе для выдачи (нужна поданная или частично выданная).",
  DRUG_MISMATCH: "Препарат не совпадает с позицией заявки.",
  DRUG_ITEM_NOT_FOUND: "Препарат не найден в каталоге.",
  INSUFFICIENT_STOCK: "Недостаточно остатка на складе.",
  VALIDATION_ERROR: "Проверьте заполнение полей.",
  FORBIDDEN: "Недостаточно прав для этой операции.",
};

function unitLabel(u) {
  return BASE_UNIT_LABELS[u] || u || "";
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const S = {
  page: { padding: "24px 28px", maxWidth: 900, margin: "0 auto" },
  head: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, margin: 0 },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    marginBottom: 12,
  },
  tabs: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid #e2e8f0",
    marginBottom: 20,
  },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 16px",
    border: "none",
    background: "none",
    fontSize: 14,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: -1,
  },
  tabActive: { color: "#2563eb", borderBottomColor: "#2563eb" },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    background: "#fff",
  },
  lineRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderTop: "1px solid #f1f5f9",
  },
  label: { fontSize: 12, fontWeight: 600, color: "#475569" },
  input: {
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
  },
  field: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    borderRadius: 8,
    border: "1px solid transparent",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnPrimary: { background: "#2563eb", color: "#fff" },
  btnSmall: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  muted: { color: "#94a3b8", fontSize: 12 },
  done: {
    color: "#166534",
    fontSize: 13,
    display: "inline-flex",
    gap: 4,
    alignItems: "center",
  },
  empty: { textAlign: "center", padding: "48px 12px", color: "#94a3b8" },
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
  ok: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    marginBottom: 14,
  },
  soon: {
    textAlign: "center",
    padding: "40px 16px",
    color: "#94a3b8",
    border: "1px dashed #cbd5e1",
    borderRadius: 10,
  },
};

export default function PharmacyDispensePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useQuery();
  const { can } = useClinicPermissions();
  const canDispense = can("inventory", "write");
  const canPatient = can("prescription", "read");

  const preReqId = query.get("requisitionId") || "";
  const [tab, setTab] = useState(preReqId ? "requisition" : "department");

  const [banner, setBanner] = useState(null); // {type:"ok"|"err", text}

  const showError = (e) => {
    const code = e?.response?.data?.code;
    const raw = e?.response?.data?.error || e?.response?.data?.message;
    const text =
      (code && ERROR_MESSAGES[code]) ||
      raw ||
      t("pharmacy.dispense.genericError", {
        defaultValue: "Не удалось выполнить выдачу.",
      });
    setBanner({ type: "err", text });
  };

  // ── channel: requisition ──
  const [req, setReq] = useState(null);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState("");
  const [linePacks, setLinePacks] = useState({}); // { requisitionItemId: packs }
  const [busyLine, setBusyLine] = useState(null);

  const loadReq = useCallback(async () => {
    if (!preReqId) return;
    setReqLoading(true);
    setReqError("");
    try {
      const res = await getRequisition(preReqId);
      setReq(res.data?.requisition || res.data || null);
    } catch (e) {
      setReqError(
        t("pharmacy.dispense.reqLoadError", {
          defaultValue: "Не удалось загрузить заявку",
        }),
      );
    } finally {
      setReqLoading(false);
    }
  }, [preReqId, t]);

  useEffect(() => {
    if (canDispense) loadReq();
  }, [loadReq, canDispense]);

  const dispenseLine = async (item) => {
    const drug = item.drugItemId || {};
    const upp = drug.unitsPerPack || 1;
    const packs = Number(linePacks[item._id] || 0);
    if (packs <= 0) return;
    const qty = Math.max(1, Math.round(packs * upp));
    setBusyLine(item._id);
    setBanner(null);
    try {
      const res = await apiDispense({
        target: "requisition",
        requisitionId: req._id,
        requisitionItemId: item._id,
        drugItemId: drug._id || item.drugItemId,
        qty,
      });
      // refresh from returned requisition snapshot
      if (res.data?.requisition) setReq(res.data.requisition);
      else await loadReq();
      setLinePacks((prev) => ({ ...prev, [item._id]: "" }));
      setBanner({
        type: "ok",
        text: t("pharmacy.dispense.lineOk", {
          defaultValue: "Позиция выдана",
        }),
      });
    } catch (e) {
      showError(e);
    } finally {
      setBusyLine(null);
    }
  };

  // ── channel: department ──
  const [departments, setDepartments] = useState([]);
  const [depId, setDepId] = useState("");
  const [drugQuery, setDrugQuery] = useState("");
  const [drugResults, setDrugResults] = useState([]);
  const [drug, setDrug] = useState(null);
  const [depPacks, setDepPacks] = useState(1);
  const [depBusy, setDepBusy] = useState(false);

  useEffect(() => {
    if (!canDispense) return;
    (async () => {
      try {
        const list = await listDepartments({ status: "active" });
        setDepartments(Array.isArray(list) ? list : []);
      } catch (e) {
        /* non-fatal */
      }
    })();
  }, [canDispense]);

  useEffect(() => {
    if (tab !== "department") return undefined;
    const q = drugQuery.trim();
    if (!q || drug) {
      setDrugResults([]);
      return undefined;
    }
    const id = setTimeout(async () => {
      try {
        const res = await getDrugItems({ search: q, limit: 20 });
        setDrugResults(res.data?.items || []);
      } catch (e) {
        setDrugResults([]);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [drugQuery, drug, tab]);

  const dispenseToDepartment = async () => {
    if (!depId || !drug) return;
    const upp = drug.unitsPerPack || 1;
    const qty = Math.max(1, Math.round(Number(depPacks || 0) * upp));
    if (qty <= 0) return;
    setDepBusy(true);
    setBanner(null);
    try {
      await apiDispense({
        target: "department",
        departmentId: depId,
        drugItemId: drug._id,
        qty,
      });
      setBanner({
        type: "ok",
        text: t("pharmacy.dispense.deptOk", {
          defaultValue: "Выдано в отделение",
        }),
      });
      setDrug(null);
      setDrugQuery("");
      setDepPacks(1);
    } catch (e) {
      showError(e);
    } finally {
      setDepBusy(false);
    }
  };

  if (!canDispense) {
    return (
      <div style={S.page}>
        <div style={S.err}>
          <ShieldAlert size={18} />
          {t("pharmacy.dispense.noAccess", {
            defaultValue: "Нет прав на выдачу со склада",
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <button type="button" style={S.back} onClick={() => navigate(-1)}>
        <ArrowLeft size={15} />
        {t("common.back", { defaultValue: "Назад" })}
      </button>

      <div style={S.head}>
        <PackageCheck size={24} color="#2563eb" />
        <h1 style={S.title}>
          {t("pharmacy.dispense.title", { defaultValue: "Выдача со склада" })}
        </h1>
      </div>

      <div style={S.tabs}>
        <button
          type="button"
          style={{ ...S.tab, ...(tab === "requisition" ? S.tabActive : {}) }}
          onClick={() => setTab("requisition")}
        >
          <PackageCheck size={16} />
          {t("pharmacy.dispense.tabReq", { defaultValue: "По заявке" })}
        </button>
        <button
          type="button"
          style={{ ...S.tab, ...(tab === "department" ? S.tabActive : {}) }}
          onClick={() => setTab("department")}
        >
          <Building2 size={16} />
          {t("pharmacy.dispense.tabDept", { defaultValue: "В отделение" })}
        </button>
        <button
          type="button"
          style={{ ...S.tab, ...(tab === "patient" ? S.tabActive : {}) }}
          onClick={() => setTab("patient")}
        >
          <UserRound size={16} />
          {t("pharmacy.dispense.tabPatient", { defaultValue: "Пациенту" })}
        </button>
      </div>

      {banner && (
        <div style={banner.type === "ok" ? S.ok : S.err}>
          {banner.type === "ok" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {banner.text}
        </div>
      )}

      {/* ── REQUISITION CHANNEL ── */}
      {tab === "requisition" && (
        <>
          {!preReqId ? (
            <div style={S.empty}>
              {t("pharmacy.dispense.noReq", {
                defaultValue:
                  "Откройте заявку из очереди аптеки, чтобы выдать по ней.",
              })}
            </div>
          ) : reqLoading ? (
            <div style={S.empty}>
              <Loader2 size={22} className="spin" />
            </div>
          ) : reqError ? (
            <div style={S.err}>
              <AlertTriangle size={16} />
              {reqError}
            </div>
          ) : req ? (
            <div style={S.card}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {req.departmentId?.name || "—"}
              </div>
              <div style={S.muted}>
                {t("pharmacy.dispense.reqStatus", {
                  defaultValue: "Статус",
                })}
                : {req.status}
              </div>

              {(req.items || []).map((item) => {
                const d = item.drugItemId || {};
                const remaining =
                  (item.qtyRequested || 0) - (item.qtyDispensed || 0);
                const upp = d.unitsPerPack || 1;
                const packsVal = linePacks[item._id] ?? "";
                const previewQty = Math.max(
                  0,
                  Math.round(Number(packsVal || 0) * upp),
                );
                const closed = remaining <= 0;
                return (
                  <div key={item._id} style={S.lineRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>
                        {d.name || "—"}
                        {d.strength ? `, ${d.strength}` : ""}
                      </div>
                      <div style={S.muted}>
                        {t("pharmacy.dispense.remaining", {
                          defaultValue: "Остаток к выдаче",
                        })}
                        : {remaining} {unitLabel(d.baseUnit)} (
                        {item.qtyDispensed || 0}/{item.qtyRequested})
                      </div>
                    </div>

                    {closed ? (
                      <span style={S.done}>
                        <CheckCircle2 size={15} />
                        {t("pharmacy.dispense.fulfilled", {
                          defaultValue: "Выдано",
                        })}
                      </span>
                    ) : (
                      <>
                        <div style={{ width: 90 }}>
                          <input
                            style={{ ...S.input, width: "100%" }}
                            type="number"
                            min={1}
                            placeholder={t("pharmacy.dispense.packs", {
                              defaultValue: "уп.",
                            })}
                            value={packsVal}
                            onChange={(e) =>
                              setLinePacks((prev) => ({
                                ...prev,
                                [item._id]: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div style={{ ...S.muted, width: 90 }}>
                          {previewQty > 0
                            ? `= ${previewQty} ${unitLabel(d.baseUnit)}`
                            : ""}
                        </div>
                        <button
                          type="button"
                          style={S.btnSmall}
                          onClick={() => dispenseLine(item)}
                          disabled={busyLine === item._id || previewQty <= 0}
                        >
                          {busyLine === item._id ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <PackageCheck size={14} />
                          )}
                          {t("pharmacy.dispense.give", {
                            defaultValue: "Выдать",
                          })}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}

      {/* ── DEPARTMENT CHANNEL ── */}
      {tab === "department" && (
        <div style={S.card}>
          <div style={S.field}>
            <span style={S.label}>
              {t("pharmacy.dispense.department", {
                defaultValue: "Отделение",
              })}{" "}
              *
            </span>
            <select
              style={S.input}
              value={depId}
              onChange={(e) => setDepId(e.target.value)}
            >
              <option value="">
                {t("pharmacy.dispense.selectDept", {
                  defaultValue: "— выберите отделение —",
                })}
              </option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...S.field, position: "relative" }}>
            <span style={S.label}>
              {t("pharmacy.dispense.drug", { defaultValue: "Препарат" })} *
            </span>
            {drug ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {drug.name}
                  {drug.strength ? `, ${drug.strength}` : ""}{" "}
                  <span style={S.muted}>
                    ({drug.unitsPerPack || 1} {unitLabel(drug.baseUnit)}/уп.)
                  </span>
                </span>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                  onClick={() => {
                    setDrug(null);
                    setDrugQuery("");
                  }}
                >
                  {t("pharmacy.dispense.change", { defaultValue: "Сменить" })}
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    style={{ ...S.input, width: "100%", paddingLeft: 34 }}
                    placeholder={t("pharmacy.dispense.searchDrug", {
                      defaultValue: "Найти препарат…",
                    })}
                    value={drugQuery}
                    onChange={(e) => setDrugQuery(e.target.value)}
                  />
                </div>
                {drugResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      marginTop: 4,
                      zIndex: 10,
                      maxHeight: 220,
                      overflowY: "auto",
                      boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                    }}
                  >
                    {drugResults.map((d) => (
                      <button
                        key={d._id}
                        type="button"
                        onClick={() => {
                          setDrug(d);
                          setDrugResults([]);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        {d.name}
                        {d.strength ? `, ${d.strength}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {drug && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <div style={{ width: 120 }}>
                <span style={S.label}>
                  {t("pharmacy.dispense.packs", { defaultValue: "Упаковок" })}
                </span>
                <input
                  style={{ ...S.input, width: "100%" }}
                  type="number"
                  min={1}
                  value={depPacks}
                  onChange={(e) => setDepPacks(e.target.value)}
                />
              </div>
              <div style={{ ...S.muted, paddingBottom: 8 }}>
                ={" "}
                {Math.max(
                  0,
                  Math.round(Number(depPacks || 0) * (drug.unitsPerPack || 1)),
                )}{" "}
                {unitLabel(drug.baseUnit)}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              style={{
                ...S.btn,
                ...S.btnPrimary,
                opacity: !depId || !drug ? 0.5 : 1,
              }}
              onClick={dispenseToDepartment}
              disabled={!depId || !drug || depBusy}
            >
              {depBusy ? (
                <Loader2 size={15} className="spin" />
              ) : (
                <PackageCheck size={15} />
              )}
              {t("pharmacy.dispense.give", { defaultValue: "Выдать" })}
            </button>
          </div>
        </div>
      )}

      {/* ── PATIENT CHANNEL (v1 stub) ── */}
      {tab === "patient" && (
        <div style={S.soon}>
          {canPatient
            ? t("pharmacy.dispense.patientSoon", {
                defaultValue:
                  "Выдача пациенту появится в следующем обновлении.",
              })
            : t("pharmacy.dispense.patientNoAccess", {
                defaultValue:
                  "Выдача пациенту доступна фармацевту (нужно право на рецепты).",
              })}
        </div>
      )}
    </div>
  );
}

// client/src/pages/clinic/pharmacy/PharmacyRequisitionsPage.jsx
//
// Заявки отделений в аптеку (Requisition). Зона RESOURCES.REQUISITION:
//   read  -> список/просмотр (очередь фармацевта)
//   write -> создание/редактирование draft, submit, cancel (медсестра)
// Author vs fulfiller НЕ разделён по RBAC — обе роли имеют requisition:write;
// разграничение по жизненному циклу (выдача — отдельный экран/route).
//
// Две вкладки в одной странице:
//   • «Очередь аптеки»    — status=submitted,partially_dispensed; фармацевт
//     видит открытые заявки; кнопка «Выдать» ведёт на экран выдачи.
//   • «Заявки отделений»  — создание/редактирование draft, submit/cancel;
//     переключатель Мои / Все.
//
// ВАЖНО про единицы: модель хранит qtyRequested в baseUnit (таб./амп./мл).
// Медсестра вводит УПАКОВКИ; форма конвертирует packs × unitsPerPack ПЕРЕД
// отправкой. Один канонический юнит в модели убирает pack/base-дрейф.
//
// Форма ответа списка: { requisitions, total } (НЕ items).
// departmentId и items.drugItemId приходят populated.
//
// ⚠ TRANSFER NOTE: содержит кириллицу. Скачивать/вставлять напрямую, НЕ через
// PowerShell Set-Content.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ClipboardList,
  Plus,
  Trash2,
  Send,
  X,
  Pencil,
  Ban,
  PackageCheck,
  AlertTriangle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useClinicPermissions } from "../../../lib/can";
import { listDepartments } from "../../../api/clinic";
import {
  getDrugItems,
  getRequisitions,
  createRequisition,
  updateRequisitionDraft,
  submitRequisition,
  cancelRequisition,
} from "../../../api/pharmacy";

// ── status meta (labels + colors) ──
const STATUS_META = {
  draft: { label: "Черновик", bg: "#f1f5f9", fg: "#475569" },
  submitted: { label: "Подана", bg: "#dbeafe", fg: "#1d4ed8" },
  partially_dispensed: {
    label: "Частично выдана",
    bg: "#fef3c7",
    fg: "#b45309",
  },
  dispensed: { label: "Выдана", bg: "#dcfce7", fg: "#166534" },
  rejected: { label: "Отклонена", bg: "#fee2e2", fg: "#b91c1c" },
  cancelled: { label: "Отменена", bg: "#f1f5f9", fg: "#94a3b8" },
};

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

const PRIORITY_LABELS = { normal: "Обычный", urgent: "Срочный" };

const emptyLine = () => ({
  drugItemId: "",
  drug: null, // {_id, name, baseUnit, unitsPerPack, ...} snapshot for UI math
  packs: 1,
  note: "",
});

// ── styles ──
const S = {
  page: { padding: "24px 28px", maxWidth: 1100, margin: "0 auto" },
  head: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, margin: 0 },
  tabs: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid #e2e8f0",
    marginBottom: 18,
  },
  tab: {
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
  toolbar: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
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
  btnGhost: { background: "#fff", color: "#334155", borderColor: "#e2e8f0" },
  btnSmall: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 13,
    cursor: "pointer",
    color: "#334155",
  },
  checkboxRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#475569",
    cursor: "pointer",
    userSelect: "none",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    background: "#fff",
  },
  cardHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 999,
  },
  urgent: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  lineRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    padding: "4px 0",
    borderTop: "1px solid #f1f5f9",
  },
  muted: { color: "#94a3b8", fontSize: 12 },
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
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.45)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    zIndex: 50,
    overflowY: "auto",
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 640,
    padding: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,.2)",
  },
  modalHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  field: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 600, color: "#475569" },
  input: {
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    padding: 6,
    borderRadius: 6,
    display: "inline-flex",
  },
  modalFoot: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  lineCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    background: "#f8fafc",
  },
};

function unitLabel(u) {
  return BASE_UNIT_LABELS[u] || u || "";
}

export default function PharmacyRequisitionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = useClinicPermissions();
  const canRead = can("requisition", "read");
  const canWrite = can("requisition", "write");

  const [tab, setTab] = useState("queue"); // "queue" | "department"
  const [mineOnly, setMineOnly] = useState(true);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // reference data for the draft form
  const [departments, setDepartments] = useState([]);
  const [drugQuery, setDrugQuery] = useState("");
  const [drugResults, setDrugResults] = useState([]);

  // modal / draft form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [depId, setDepId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [activeLineIdx, setActiveLineIdx] = useState(null);

  // ── fetch list depending on active tab ──
  const fetchList = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params =
        tab === "queue"
          ? { status: "submitted,partially_dispensed", limit: 200 }
          : { mine: mineOnly ? "true" : undefined, limit: 200 };
      const res = await getRequisitions(params);
      setRows(res.data?.requisitions || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      setLoadError(
        t("pharmacy.req.loadError", {
          defaultValue: "Не удалось загрузить заявки",
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [tab, mineOnly, t]);

  useEffect(() => {
    if (!canRead) return undefined;
    const id = setTimeout(fetchList, 200);
    return () => clearTimeout(id);
  }, [fetchList, canRead]);

  // ── load active departments once (for the draft select) ──
  useEffect(() => {
    if (!canWrite) return;
    (async () => {
      try {
        const list = await listDepartments({ status: "active" });
        setDepartments(Array.isArray(list) ? list : []);
      } catch (e) {
        /* non-fatal: form still opens, select just empty */
      }
    })();
  }, [canWrite]);

  // ── drug search (debounced) for the active line ──
  useEffect(() => {
    if (activeLineIdx == null) return undefined;
    const q = drugQuery.trim();
    if (!q) {
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
  }, [drugQuery, activeLineIdx]);

  // ── draft form helpers ──
  const openCreate = () => {
    setEditingId(null);
    setDepId("");
    setPriority("normal");
    setNote("");
    setLines([emptyLine()]);
    setFormError("");
    setActiveLineIdx(null);
    setDrugQuery("");
    setDrugResults([]);
    setFormOpen(true);
  };

  const openEditDraft = (r) => {
    setEditingId(r._id);
    setDepId(r.departmentId?._id || r.departmentId || "");
    setPriority(r.priority || "normal");
    setNote(r.note || "");
    setLines(
      (r.items || []).map((it) => {
        const drug = it.drugItemId || null;
        const upp = drug?.unitsPerPack || 1;
        return {
          drugItemId: drug?._id || it.drugItemId || "",
          drug,
          // convert stored baseUnit qty back to packs for editing
          packs:
            upp > 0
              ? Math.max(1, Math.round(it.qtyRequested / upp))
              : it.qtyRequested,
          note: it.note || "",
        };
      }),
    );
    setFormError("");
    setActiveLineIdx(null);
    setDrugQuery("");
    setDrugResults([]);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
  };

  const setLine = (idx, patch) =>
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx) =>
    setLines((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    );

  const pickDrug = (idx, drug) => {
    setLine(idx, { drugItemId: drug._id, drug });
    setActiveLineIdx(null);
    setDrugQuery("");
    setDrugResults([]);
  };

  // build { departmentId, items:[{drugItemId, qtyRequested(baseUnit), note}], ... }
  const buildPayload = (submit) => {
    const items = lines
      .filter((l) => l.drugItemId && Number(l.packs) > 0)
      .map((l) => {
        const upp = l.drug?.unitsPerPack || 1;
        return {
          drugItemId: l.drugItemId,
          qtyRequested: Math.max(1, Math.round(Number(l.packs) * upp)),
          note: l.note || "",
        };
      });
    return { departmentId: depId, items, priority, note, submit: !!submit };
  };

  const validate = () => {
    if (!depId) {
      setFormError(
        t("pharmacy.req.depRequired", { defaultValue: "Выберите отделение" }),
      );
      return false;
    }
    const valid = lines.filter((l) => l.drugItemId && Number(l.packs) > 0);
    if (valid.length === 0) {
      setFormError(
        t("pharmacy.req.itemsRequired", {
          defaultValue: "Добавьте хотя бы одну позицию",
        }),
      );
      return false;
    }
    return true;
  };

  const persist = async (submit) => {
    if (!validate()) return;
    setSaving(true);
    setFormError("");
    try {
      const payload = buildPayload(submit);
      if (editingId) {
        // draft-only patch (no submit flag on PATCH); submit via action below
        await updateRequisitionDraft(editingId, {
          departmentId: payload.departmentId,
          items: payload.items,
          priority: payload.priority,
          note: payload.note,
        });
        if (submit) await submitRequisition(editingId);
      } else {
        await createRequisition(payload); // submit flag handled server-side
      }
      setFormOpen(false);
      await fetchList();
    } catch (e) {
      setFormError(
        e?.response?.data?.error ||
          t("pharmacy.req.saveError", {
            defaultValue: "Не удалось сохранить. Проверьте поля.",
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitExisting = async (r) => {
    try {
      await submitRequisition(r._id);
      await fetchList();
    } catch (e) {
      /* surfaced via reload */
    }
  };

  const handleCancel = async (r) => {
    const ok = window.confirm(
      t("pharmacy.req.confirmCancel", {
        defaultValue: "Отменить заявку?",
      }),
    );
    if (!ok) return;
    try {
      await cancelRequisition(r._id);
      await fetchList();
    } catch (e) {
      /* no-op */
    }
  };

  const goDispense = (r) => {
    // dispense screen reads ?requisitionId= to preload the queue item
    navigate(`/clinic/employee/pharmacy/dispense?requisitionId=${r._id}`);
  };

  const list = useMemo(() => rows, [rows]);

  if (!canRead) {
    return (
      <div style={S.page}>
        <div style={S.err}>
          <ShieldAlert size={18} />
          {t("pharmacy.req.noAccess", {
            defaultValue: "Нет доступа к заявкам",
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.head}>
        <ClipboardList size={24} color="#2563eb" />
        <h1 style={S.title}>
          {t("pharmacy.req.title", { defaultValue: "Заявки в аптеку" })}
        </h1>
      </div>

      <div style={S.tabs}>
        <button
          type="button"
          style={{ ...S.tab, ...(tab === "queue" ? S.tabActive : {}) }}
          onClick={() => setTab("queue")}
        >
          {t("pharmacy.req.tabQueue", { defaultValue: "Очередь аптеки" })}
        </button>
        <button
          type="button"
          style={{ ...S.tab, ...(tab === "department" ? S.tabActive : {}) }}
          onClick={() => setTab("department")}
        >
          {t("pharmacy.req.tabDept", { defaultValue: "Заявки отделений" })}
        </button>
      </div>

      <div style={S.toolbar}>
        {tab === "department" && (
          <>
            <label style={S.checkboxRow}>
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
              />
              {t("pharmacy.req.mineOnly", { defaultValue: "Только мои" })}
            </label>
            {canWrite && (
              <button
                style={{ ...S.btn, ...S.btnPrimary }}
                onClick={openCreate}
                type="button"
              >
                <Plus size={16} />
                {t("pharmacy.req.create", { defaultValue: "Новая заявка" })}
              </button>
            )}
          </>
        )}
      </div>

      {loadError && (
        <div style={S.err}>
          <AlertTriangle size={18} />
          {loadError}
        </div>
      )}

      {loading ? (
        <div style={S.empty}>
          <Loader2 size={22} className="spin" />
          <div style={{ marginTop: 8 }}>
            {t("common.loading", { defaultValue: "Загрузка…" })}
          </div>
        </div>
      ) : list.length === 0 ? (
        <div style={S.empty}>
          {tab === "queue"
            ? t("pharmacy.req.emptyQueue", {
                defaultValue: "Открытых заявок нет.",
              })
            : t("pharmacy.req.emptyDept", {
                defaultValue: "Заявок нет. Создайте первую.",
              })}
        </div>
      ) : (
        list.map((r) => {
          const meta = STATUS_META[r.status] || STATUS_META.draft;
          const depName = r.departmentId?.name || "—";
          const isDraft = r.status === "draft";
          const isOpen =
            r.status === "submitted" || r.status === "partially_dispensed";
          return (
            <div key={r._id} style={S.card}>
              <div style={S.cardHead}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {depName}
                    {r.priority === "urgent" && (
                      <span style={{ ...S.badge, ...S.urgent, marginLeft: 8 }}>
                        {PRIORITY_LABELS.urgent}
                      </span>
                    )}
                  </div>
                  <div style={S.muted}>
                    {new Date(r.submittedAt || r.createdAt).toLocaleString(
                      "ru-RU",
                    )}
                  </div>
                </div>
                <span
                  style={{ ...S.badge, background: meta.bg, color: meta.fg }}
                >
                  {t(`pharmacy.req.status.${r.status}`, {
                    defaultValue: meta.label,
                  })}
                </span>
              </div>

              {(r.items || []).map((it) => {
                const drug = it.drugItemId || {};
                return (
                  <div key={it._id || drug._id} style={S.lineRow}>
                    <span style={{ flex: 1 }}>
                      {drug.name || "—"}
                      {drug.strength ? `, ${drug.strength}` : ""}
                    </span>
                    <span style={S.muted}>
                      {it.qtyDispensed || 0}/{it.qtyRequested}{" "}
                      {unitLabel(drug.baseUnit)}
                    </span>
                  </div>
                );
              })}

              {r.note && (
                <div style={{ ...S.muted, marginTop: 8 }}>{r.note}</div>
              )}

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                {tab === "queue" && isOpen && canWrite && (
                  <button
                    style={{
                      ...S.btnSmall,
                      borderColor: "#bfdbfe",
                      color: "#1d4ed8",
                    }}
                    onClick={() => goDispense(r)}
                    type="button"
                  >
                    <PackageCheck size={15} />
                    {t("pharmacy.req.dispense", { defaultValue: "Выдать" })}
                  </button>
                )}
                {tab === "department" && isDraft && canWrite && (
                  <>
                    <button
                      style={S.btnSmall}
                      onClick={() => openEditDraft(r)}
                      type="button"
                    >
                      <Pencil size={15} />
                      {t("common.edit", { defaultValue: "Изменить" })}
                    </button>
                    <button
                      style={{
                        ...S.btnSmall,
                        borderColor: "#bfdbfe",
                        color: "#1d4ed8",
                      }}
                      onClick={() => handleSubmitExisting(r)}
                      type="button"
                    >
                      <Send size={15} />
                      {t("pharmacy.req.submit", { defaultValue: "Подать" })}
                    </button>
                  </>
                )}
                {tab === "department" &&
                  canWrite &&
                  (isDraft || r.status === "submitted") && (
                    <button
                      style={{
                        ...S.btnSmall,
                        borderColor: "#fecaca",
                        color: "#b91c1c",
                      }}
                      onClick={() => handleCancel(r)}
                      type="button"
                    >
                      <Ban size={15} />
                      {t("pharmacy.req.cancel", { defaultValue: "Отменить" })}
                    </button>
                  )}
              </div>
            </div>
          );
        })
      )}

      {!loading && list.length > 0 && (
        <div style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>
          {t("pharmacy.req.count", {
            defaultValue: "Всего: {{count}}",
            count: total,
          })}
        </div>
      )}

      {/* ── draft create/edit modal ── */}
      {formOpen && (
        <div style={S.overlay} onMouseDown={closeForm}>
          <div style={S.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={S.modalHead}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editingId
                  ? t("pharmacy.req.editTitle", {
                      defaultValue: "Редактировать заявку",
                    })
                  : t("pharmacy.req.createTitle", {
                      defaultValue: "Новая заявка",
                    })}
              </h2>
              <button style={S.iconBtn} onClick={closeForm} type="button">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={S.err}>
                <AlertTriangle size={16} />
                {formError}
              </div>
            )}

            <div style={S.field}>
              <span style={S.label}>
                {t("pharmacy.req.department", { defaultValue: "Отделение" })} *
              </span>
              <select
                style={S.input}
                value={depId}
                onChange={(e) => setDepId(e.target.value)}
              >
                <option value="">
                  {t("pharmacy.req.selectDept", {
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

            <div style={S.field}>
              <span style={S.label}>
                {t("pharmacy.req.priority", { defaultValue: "Приоритет" })}
              </span>
              <select
                style={S.input}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="normal">{PRIORITY_LABELS.normal}</option>
                <option value="urgent">{PRIORITY_LABELS.urgent}</option>
              </select>
            </div>

            {/* line items */}
            <div style={{ marginBottom: 8, ...S.label }}>
              {t("pharmacy.req.items", { defaultValue: "Позиции" })}
            </div>
            {lines.map((l, idx) => {
              const upp = l.drug?.unitsPerPack || 1;
              const baseQty = Math.max(
                1,
                Math.round(Number(l.packs || 0) * upp),
              );
              return (
                <div key={idx} style={S.lineCard}>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div style={{ flex: 1, position: "relative" }}>
                      {l.drug ? (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: 14 }}>
                            {l.drug.name}
                            {l.drug.strength ? `, ${l.drug.strength}` : ""}
                          </span>
                          <button
                            type="button"
                            style={S.iconBtn}
                            onClick={() => {
                              setActiveLineIdx(idx);
                              setLine(idx, { drug: null, drugItemId: "" });
                            }}
                            title={t("pharmacy.req.changeDrug", {
                              defaultValue: "Сменить препарат",
                            })}
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            style={S.input}
                            placeholder={t("pharmacy.req.searchDrug", {
                              defaultValue: "Найти препарат…",
                            })}
                            value={activeLineIdx === idx ? drugQuery : ""}
                            onFocus={() => {
                              setActiveLineIdx(idx);
                              setDrugQuery("");
                            }}
                            onChange={(e) => setDrugQuery(e.target.value)}
                          />
                          {activeLineIdx === idx && drugResults.length > 0 && (
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
                                maxHeight: 200,
                                overflowY: "auto",
                                boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                              }}
                            >
                              {drugResults.map((d) => (
                                <button
                                  key={d._id}
                                  type="button"
                                  onClick={() => pickDrug(idx, d)}
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
                                  {d.strength ? `, ${d.strength}` : ""}{" "}
                                  <span style={S.muted}>
                                    ({d.unitsPerPack || 1}{" "}
                                    {unitLabel(d.baseUnit)}/уп.)
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      style={S.iconBtn}
                      onClick={() => removeLine(idx)}
                      title={t("common.remove", { defaultValue: "Удалить" })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {l.drug && (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-end",
                        marginTop: 8,
                      }}
                    >
                      <div style={{ width: 120 }}>
                        <span style={S.label}>
                          {t("pharmacy.req.packs", {
                            defaultValue: "Упаковок",
                          })}
                        </span>
                        <input
                          style={{ ...S.input, width: "100%" }}
                          type="number"
                          min={1}
                          value={l.packs}
                          onChange={(e) =>
                            setLine(idx, { packs: e.target.value })
                          }
                        />
                      </div>
                      <div style={{ ...S.muted, paddingBottom: 8 }}>
                        = {baseQty} {unitLabel(l.drug.baseUnit)}
                      </div>
                      <input
                        style={{ ...S.input, flex: 1 }}
                        placeholder={t("pharmacy.req.lineNote", {
                          defaultValue: "Примечание к позиции",
                        })}
                        value={l.note}
                        onChange={(e) => setLine(idx, { note: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              style={{ ...S.btnSmall, marginBottom: 12 }}
              onClick={addLine}
            >
              <Plus size={15} />
              {t("pharmacy.req.addLine", { defaultValue: "Добавить позицию" })}
            </button>

            <div style={S.field}>
              <span style={S.label}>
                {t("pharmacy.req.note", { defaultValue: "Примечание" })}
              </span>
              <textarea
                style={{ ...S.input, minHeight: 50, resize: "vertical" }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div style={S.modalFoot}>
              <button
                style={{ ...S.btn, ...S.btnGhost }}
                onClick={closeForm}
                type="button"
                disabled={saving}
              >
                {t("common.cancel", { defaultValue: "Отмена" })}
              </button>
              <button
                style={{ ...S.btn, ...S.btnGhost }}
                onClick={() => persist(false)}
                type="button"
                disabled={saving}
              >
                {saving && <Loader2 size={15} className="spin" />}
                {t("pharmacy.req.saveDraft", {
                  defaultValue: "Сохранить черновик",
                })}
              </button>
              <button
                style={{ ...S.btn, ...S.btnPrimary }}
                onClick={() => persist(true)}
                type="button"
                disabled={saving}
              >
                <Send size={15} />
                {t("pharmacy.req.saveSubmit", {
                  defaultValue: "Сохранить и подать",
                })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

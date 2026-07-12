// client/src/pages/clinic/pharmacy/PharmacyCatalogPage.jsx
//
// Каталог препаратов (номенклатура) для зоны фармацевта.
//
// Permissions come from useClinicPermissions().can(resource, action) — the
// single source of truth shared with EmployeeDashboardPage. The hook reads
// { kind, clinic, role, permissions } from useOutletContext() and folds in
// the owner-always-allow rule, so pages never touch ctx.permissions directly.
// Gate resource is "pharmacy" (server RESOURCES.PHARMACY): read → view,
// write → create/edit/archive/restore.
//
// All user-facing strings go through t(key,{defaultValue}) so RU works today
// and en/tr/az/ar can be added to locale JSON later.
//
// ⚠ TRANSFER NOTE: this file contains Cyrillic (in defaultValue + label maps).
// Download it directly / paste into the editor — do NOT pipe through
// PowerShell Set-Content, which mangles non-ASCII. (If you must use PS, write
// it via [System.IO.File]::WriteAllText with UTF8Encoding($false).)

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pill,
  Plus,
  Search,
  Pencil,
  Archive,
  RotateCcw,
  X,
  AlertTriangle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useClinicPermissions } from "../../../lib/can";
import {
  getDrugItems,
  createDrugItem,
  updateDrugItem,
  archiveDrugItem,
  restoreDrugItem,
} from "../../../api/pharmacy";

// ── enums (MUST match drugItem.model.js) ───────────────────
const FORM_OPTIONS = [
  "tablet",
  "capsule",
  "syrup",
  "solution",
  "injection",
  "ointment",
  "drops",
  "spray",
  "suppository",
  "powder",
  "patch",
  "other",
];
const BASE_UNIT_OPTIONS = [
  "tablet",
  "capsule",
  "ampoule",
  "vial_dose",
  "ml",
  "g",
  "drop",
  "piece",
  "dose",
];
const PACK_UNIT_OPTIONS = [
  "pack",
  "box",
  "blister",
  "bottle",
  "vial",
  "tube",
  "piece",
];

// RU labels for enum values.
const FORM_LABELS = {
  tablet: "Таблетки",
  capsule: "Капсулы",
  syrup: "Сироп",
  solution: "Раствор",
  injection: "Инъекция",
  ointment: "Мазь / гель",
  drops: "Капли",
  spray: "Спрей",
  suppository: "Свечи",
  powder: "Порошок",
  patch: "Пластырь",
  other: "Другое",
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
const PACK_UNIT_LABELS = {
  pack: "упаковка",
  box: "коробка",
  blister: "блистер",
  bottle: "флакон",
  vial: "ампула-флак.",
  tube: "туба",
  piece: "штука",
};

const EMPTY_FORM = {
  name: "",
  inn: "",
  form: "tablet",
  strength: "",
  baseUnit: "tablet",
  packUnit: "pack",
  unitsPerPack: 1,
  category: "",
  manufacturer: "",
  sku: "",
  isControlled: false,
  minStock: 0,
  note: "",
};

// ── styles (module-level to avoid per-render object churn) ──
const S = {
  page: { padding: "24px 28px", maxWidth: 1100, margin: "0 auto" },
  head: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, margin: 0 },
  toolbar: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  searchWrap: { position: "relative", flex: 1, minWidth: 220 },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  searchInput: {
    width: "100%",
    padding: "9px 12px 9px 34px",
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
    border: "1px solid transparent",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnPrimary: { background: "#2563eb", color: "#fff" },
  btnGhost: { background: "#fff", color: "#334155", borderColor: "#e2e8f0" },
  checkboxRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#475569",
    cursor: "pointer",
    userSelect: "none",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e2e8f0",
    color: "#64748b",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: ".04em",
    fontWeight: 600,
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  },
  rowArchived: { opacity: 0.55 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 999,
  },
  badgeCtrl: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  badgeLow: {
    background: "#fffbeb",
    color: "#b45309",
    border: "1px solid #fde68a",
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
  empty: { textAlign: "center", padding: "48px 12px", color: "#94a3b8" },
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
    maxWidth: 560,
    padding: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,.2)",
  },
  modalHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 600, color: "#475569" },
  input: {
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
  },
  modalFoot: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
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
};

export default function PharmacyCatalogPage() {
  const { t } = useTranslation();
  const { can } = useClinicPermissions();
  const canRead = can("pharmacy", "read");
  const canWrite = can("pharmacy", "write");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  // modal / form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getDrugItems({
        search: search.trim() || undefined,
        includeArchived: includeArchived ? "true" : undefined,
        limit: 500,
      });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      setLoadError(
        t("pharmacy.catalog.loadError", {
          defaultValue: "Не удалось загрузить каталог",
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [search, includeArchived, t]);

  // debounced fetch on search / archived toggle
  useEffect(() => {
    if (!canRead) return undefined;
    const id = setTimeout(fetchItems, 300);
    return () => clearTimeout(id);
  }, [fetchItems, canRead]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      inn: item.inn || "",
      form: item.form || "tablet",
      strength: item.strength || "",
      baseUnit: item.baseUnit || "tablet",
      packUnit: item.packUnit || "pack",
      unitsPerPack: item.unitsPerPack ?? 1,
      category: item.category || "",
      manufacturer: item.manufacturer || "",
      sku: item.sku || "",
      isControlled: !!item.isControlled,
      minStock: item.minStock ?? 0,
      note: item.note || "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
  };

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(
        t("pharmacy.form.nameRequired", {
          defaultValue: "Укажите название препарата",
        }),
      );
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = {
      ...form,
      unitsPerPack: Math.max(1, Number(form.unitsPerPack) || 1),
      minStock: Math.max(0, Number(form.minStock) || 0),
    };
    try {
      if (editingId) {
        await updateDrugItem(editingId, payload);
      } else {
        await createDrugItem(payload);
      }
      setFormOpen(false);
      await fetchItems();
    } catch (e) {
      setFormError(
        e?.response?.data?.error ||
          t("pharmacy.form.saveError", {
            defaultValue: "Не удалось сохранить. Проверьте поля.",
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (item) => {
    const ok = window.confirm(
      t("pharmacy.catalog.confirmArchive", {
        defaultValue: "Убрать препарат из активного каталога?",
      }),
    );
    if (!ok) return;
    try {
      await archiveDrugItem(item._id);
      await fetchItems();
    } catch (e) {
      /* surfaced via reload; keep silent per existing UX */
    }
  };

  const handleRestore = async (item) => {
    try {
      await restoreDrugItem(item._id);
      await fetchItems();
    } catch (e) {
      /* no-op */
    }
  };

  const rows = useMemo(() => items, [items]);

  if (!canRead) {
    return (
      <div style={S.page}>
        <div style={S.err}>
          <ShieldAlert size={18} />
          {t("pharmacy.catalog.noAccess", {
            defaultValue: "Нет доступа к аптечному каталогу",
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.head}>
        <Pill size={24} color="#2563eb" />
        <h1 style={S.title}>
          {t("pharmacy.catalog.title", { defaultValue: "Каталог препаратов" })}
        </h1>
      </div>

      <div style={S.toolbar}>
        <div style={S.searchWrap}>
          <Search size={16} style={S.searchIcon} />
          <input
            style={S.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("pharmacy.catalog.searchPlaceholder", {
              defaultValue: "Поиск по названию, МНН или коду…",
            })}
          />
        </div>

        <label style={S.checkboxRow}>
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          {t("pharmacy.catalog.showArchived", {
            defaultValue: "Показать архив",
          })}
        </label>

        {canWrite && (
          <button
            style={{ ...S.btn, ...S.btnPrimary }}
            onClick={openCreate}
            type="button"
          >
            <Plus size={16} />
            {t("pharmacy.catalog.add", { defaultValue: "Добавить препарат" })}
          </button>
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
      ) : rows.length === 0 ? (
        <div style={S.empty}>
          {t("pharmacy.catalog.empty", {
            defaultValue: "Каталог пуст. Добавьте первый препарат.",
          })}
        </div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>
                {t("pharmacy.col.name", { defaultValue: "Название" })}
              </th>
              <th style={S.th}>
                {t("pharmacy.col.form", { defaultValue: "Форма" })}
              </th>
              <th style={S.th}>
                {t("pharmacy.col.strength", { defaultValue: "Дозировка" })}
              </th>
              <th style={S.th}>
                {t("pharmacy.col.pack", { defaultValue: "Упаковка" })}
              </th>
              <th style={S.th}>
                {t("pharmacy.col.category", { defaultValue: "Категория" })}
              </th>
              <th style={{ ...S.th, textAlign: "right" }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const archived = item.status === "archived";
              return (
                <tr key={item._id} style={archived ? S.rowArchived : undefined}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>
                      {item.name}{" "}
                      {item.isControlled && (
                        <span style={{ ...S.badge, ...S.badgeCtrl }}>
                          <ShieldAlert size={11} />
                          {t("pharmacy.badge.controlled", {
                            defaultValue: "ПКУ",
                          })}
                        </span>
                      )}
                    </div>
                    {item.inn && (
                      <div style={{ color: "#94a3b8", fontSize: 12 }}>
                        {item.inn}
                      </div>
                    )}
                  </td>
                  <td style={S.td}>{FORM_LABELS[item.form] || item.form}</td>
                  <td style={S.td}>{item.strength || "—"}</td>
                  <td style={S.td}>
                    {item.unitsPerPack} {BASE_UNIT_LABELS[item.baseUnit] || ""}
                    {" / "}
                    {PACK_UNIT_LABELS[item.packUnit] || item.packUnit}
                    {item.minStock > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ ...S.badge, ...S.badgeLow }}>
                          {t("pharmacy.badge.min", { defaultValue: "мин." })}{" "}
                          {item.minStock}{" "}
                          {BASE_UNIT_LABELS[item.baseUnit] || ""}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={S.td}>{item.category || "—"}</td>
                  <td
                    style={{
                      ...S.td,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {canWrite && !archived && (
                      <>
                        <button
                          style={S.iconBtn}
                          onClick={() => openEdit(item)}
                          type="button"
                          title={t("common.edit", { defaultValue: "Изменить" })}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          style={S.iconBtn}
                          onClick={() => handleArchive(item)}
                          type="button"
                          title={t("pharmacy.action.archive", {
                            defaultValue: "В архив",
                          })}
                        >
                          <Archive size={16} />
                        </button>
                      </>
                    )}
                    {canWrite && archived && (
                      <button
                        style={S.iconBtn}
                        onClick={() => handleRestore(item)}
                        type="button"
                        title={t("pharmacy.action.restore", {
                          defaultValue: "Восстановить",
                        })}
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && rows.length > 0 && (
        <div style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>
          {t("pharmacy.catalog.count", {
            defaultValue: "Всего позиций: {{count}}",
            count: total,
          })}
        </div>
      )}

      {formOpen && (
        <div style={S.overlay} onMouseDown={closeForm}>
          <div style={S.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={S.modalHead}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editingId
                  ? t("pharmacy.form.editTitle", {
                      defaultValue: "Редактировать препарат",
                    })
                  : t("pharmacy.form.createTitle", {
                      defaultValue: "Новый препарат",
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
                {t("pharmacy.col.name", { defaultValue: "Название" })} *
              </span>
              <input
                style={S.input}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoFocus
              />
            </div>

            <div style={S.field}>
              <span style={S.label}>
                {t("pharmacy.form.inn", { defaultValue: "МНН / вещество" })}
              </span>
              <input
                style={S.input}
                value={form.inn}
                onChange={(e) => setField("inn", e.target.value)}
              />
            </div>

            <div style={S.grid2}>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.col.form", { defaultValue: "Форма" })}
                </span>
                <select
                  style={S.input}
                  value={form.form}
                  onChange={(e) => setField("form", e.target.value)}
                >
                  {FORM_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {FORM_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.col.strength", { defaultValue: "Дозировка" })}
                </span>
                <input
                  style={S.input}
                  value={form.strength}
                  onChange={(e) => setField("strength", e.target.value)}
                  placeholder="500 мг"
                />
              </div>
            </div>

            <div style={S.grid2}>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.form.baseUnit", {
                    defaultValue: "Ед. учёта (выдача)",
                  })}
                </span>
                <select
                  style={S.input}
                  value={form.baseUnit}
                  onChange={(e) => setField("baseUnit", e.target.value)}
                >
                  {BASE_UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {BASE_UNIT_LABELS[u]}
                    </option>
                  ))}
                </select>
              </div>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.form.packUnit", {
                    defaultValue: "Ед. закупки",
                  })}
                </span>
                <select
                  style={S.input}
                  value={form.packUnit}
                  onChange={(e) => setField("packUnit", e.target.value)}
                >
                  {PACK_UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {PACK_UNIT_LABELS[u]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={S.grid2}>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.form.unitsPerPack", {
                    defaultValue: "Ед. в упаковке",
                  })}
                </span>
                <input
                  style={S.input}
                  type="number"
                  min={1}
                  value={form.unitsPerPack}
                  onChange={(e) => setField("unitsPerPack", e.target.value)}
                />
              </div>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.form.minStock", {
                    defaultValue: "Мин. остаток (ед.)",
                  })}
                </span>
                <input
                  style={S.input}
                  type="number"
                  min={0}
                  value={form.minStock}
                  onChange={(e) => setField("minStock", e.target.value)}
                />
              </div>
            </div>

            <div style={S.grid2}>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.col.category", { defaultValue: "Категория" })}
                </span>
                <input
                  style={S.input}
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  placeholder="Антибиотики"
                />
              </div>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.form.manufacturer", {
                    defaultValue: "Производитель",
                  })}
                </span>
                <input
                  style={S.input}
                  value={form.manufacturer}
                  onChange={(e) => setField("manufacturer", e.target.value)}
                />
              </div>
            </div>

            <div style={S.field}>
              <span style={S.label}>
                {t("pharmacy.form.sku", { defaultValue: "Код / штрихкод" })}
              </span>
              <input
                style={S.input}
                value={form.sku}
                onChange={(e) => setField("sku", e.target.value)}
              />
            </div>

            <label style={{ ...S.checkboxRow, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={form.isControlled}
                onChange={(e) => setField("isControlled", e.target.checked)}
              />
              {t("pharmacy.form.isControlled", {
                defaultValue: "Предметно-количественный учёт (ПКУ)",
              })}
            </label>

            <div style={S.field}>
              <span style={S.label}>
                {t("pharmacy.form.note", { defaultValue: "Примечание" })}
              </span>
              <textarea
                style={{ ...S.input, minHeight: 60, resize: "vertical" }}
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
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
                style={{ ...S.btn, ...S.btnPrimary }}
                onClick={handleSave}
                type="button"
                disabled={saving}
              >
                {saving && <Loader2 size={15} className="spin" />}
                {t("common.save", { defaultValue: "Сохранить" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

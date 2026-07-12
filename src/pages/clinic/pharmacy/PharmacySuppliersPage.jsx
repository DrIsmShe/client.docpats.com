// client/src/pages/clinic/pharmacy/PharmacySuppliersPage.jsx
//
// Поставщики аптеки. Зона фармацевта (RESOURCES.SUPPLIER):
//   read  -> список/просмотр (accountant RO сюда тоже попадает)
//   write -> создание/редактирование/архив/восстановление
//
// Permissions via useClinicPermissions().can(resource, action) — единый
// источник, как в PharmacyCatalogPage / EmployeeDashboardPage. Строки через
// t(key,{defaultValue}) для будущей i18n.
//
// ⚠ TRANSFER NOTE: содержит кириллицу. Скачивать/вставлять напрямую, НЕ через
// PowerShell Set-Content.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Truck,
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
  getSuppliers,
  createSupplier,
  updateSupplier,
  archiveSupplier,
  restoreSupplier,
} from "../../../api/pharmacy";

const EMPTY_FORM = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  taxId: "",
  note: "",
};

// ── styles (module-level, mirrors PharmacyCatalogPage) ──
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
  muted: { color: "#94a3b8", fontSize: 12 },
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
    maxWidth: 520,
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

export default function PharmacySuppliersPage() {
  const { t } = useTranslation();
  const { can } = useClinicPermissions();
  const canRead = can("supplier", "read");
  const canWrite = can("supplier", "write");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getSuppliers({
        search: search.trim() || undefined,
        includeArchived: includeArchived ? "true" : undefined,
        limit: 500,
      });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      setLoadError(
        t("pharmacy.suppliers.loadError", {
          defaultValue: "Не удалось загрузить поставщиков",
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [search, includeArchived, t]);

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
      contactPerson: item.contactPerson || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
      taxId: item.taxId || "",
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
        t("pharmacy.suppliers.nameRequired", {
          defaultValue: "Укажите название поставщика",
        }),
      );
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await updateSupplier(editingId, form);
      } else {
        await createSupplier(form);
      }
      setFormOpen(false);
      await fetchItems();
    } catch (e) {
      setFormError(
        e?.response?.data?.error ||
          t("pharmacy.suppliers.saveError", {
            defaultValue: "Не удалось сохранить. Проверьте поля.",
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (item) => {
    const ok = window.confirm(
      t("pharmacy.suppliers.confirmArchive", {
        defaultValue: "Убрать поставщика из активного списка?",
      }),
    );
    if (!ok) return;
    try {
      await archiveSupplier(item._id);
      await fetchItems();
    } catch (e) {
      /* surfaced via reload */
    }
  };

  const handleRestore = async (item) => {
    try {
      await restoreSupplier(item._id);
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
          {t("pharmacy.suppliers.noAccess", {
            defaultValue: "Нет доступа к поставщикам",
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.head}>
        <Truck size={24} color="#2563eb" />
        <h1 style={S.title}>
          {t("pharmacy.suppliers.title", { defaultValue: "Поставщики" })}
        </h1>
      </div>

      <div style={S.toolbar}>
        <div style={S.searchWrap}>
          <Search size={16} style={S.searchIcon} />
          <input
            style={S.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("pharmacy.suppliers.searchPlaceholder", {
              defaultValue: "Поиск по названию, контакту или ИНН…",
            })}
          />
        </div>

        <label style={S.checkboxRow}>
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          {t("pharmacy.suppliers.showArchived", {
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
            {t("pharmacy.suppliers.add", {
              defaultValue: "Добавить поставщика",
            })}
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
          {t("pharmacy.suppliers.empty", {
            defaultValue: "Список пуст. Добавьте первого поставщика.",
          })}
        </div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>
                {t("pharmacy.suppliers.col.name", {
                  defaultValue: "Название",
                })}
              </th>
              <th style={S.th}>
                {t("pharmacy.suppliers.col.contact", {
                  defaultValue: "Контакт",
                })}
              </th>
              <th style={S.th}>
                {t("pharmacy.suppliers.col.phone", { defaultValue: "Телефон" })}
              </th>
              <th style={S.th}>
                {t("pharmacy.suppliers.col.taxId", { defaultValue: "ИНН" })}
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
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    {item.email && <div style={S.muted}>{item.email}</div>}
                  </td>
                  <td style={S.td}>{item.contactPerson || "—"}</td>
                  <td style={S.td}>{item.phone || "—"}</td>
                  <td style={S.td}>{item.taxId || "—"}</td>
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
          {t("pharmacy.suppliers.count", {
            defaultValue: "Всего поставщиков: {{count}}",
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
                  ? t("pharmacy.suppliers.editTitle", {
                      defaultValue: "Редактировать поставщика",
                    })
                  : t("pharmacy.suppliers.createTitle", {
                      defaultValue: "Новый поставщик",
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
                {t("pharmacy.suppliers.col.name", {
                  defaultValue: "Название",
                })}{" "}
                *
              </span>
              <input
                style={S.input}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoFocus
              />
            </div>

            <div style={S.grid2}>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.suppliers.col.contact", {
                    defaultValue: "Контакт",
                  })}
                </span>
                <input
                  style={S.input}
                  value={form.contactPerson}
                  onChange={(e) => setField("contactPerson", e.target.value)}
                />
              </div>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.suppliers.col.phone", {
                    defaultValue: "Телефон",
                  })}
                </span>
                <input
                  style={S.input}
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
            </div>

            <div style={S.grid2}>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.suppliers.field.email", {
                    defaultValue: "Эл. почта",
                  })}
                </span>
                <input
                  style={S.input}
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
              <div style={S.field}>
                <span style={S.label}>
                  {t("pharmacy.suppliers.col.taxId", {
                    defaultValue: "ИНН / ВЁEN",
                  })}
                </span>
                <input
                  style={S.input}
                  value={form.taxId}
                  onChange={(e) => setField("taxId", e.target.value)}
                />
              </div>
            </div>

            <div style={S.field}>
              <span style={S.label}>
                {t("pharmacy.suppliers.field.address", {
                  defaultValue: "Адрес",
                })}
              </span>
              <input
                style={S.input}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>

            <div style={S.field}>
              <span style={S.label}>
                {t("pharmacy.suppliers.field.note", {
                  defaultValue: "Примечание",
                })}
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
